// User Management Module
import { token } from './auth.js';
import { displayRawResponse, displayResponseMessage } from './utils.js';
import { createBatch } from './batchManagement.js';

// Pagination state
let currentUserType = 'student';
let currentPage = 1;
let pageSize = 10;
let totalUsers = 0;

// Define column structure for different user types
const columnDefinitions = {
    student: [
        { field: 'id', label: 'ID', sortable: true },
        { field: 'studentId', label: 'Mã học sinh', sortable: true },
        { field: 'userId', label: 'User ID' },
        { field: 'fullName', label: 'Họ và tên', sortable: true },
        { field: 'email', label: 'Email', sortable: true },
        { field: 'phone', label: 'Số điện thoại' },
        { field: 'gender', label: 'Giới tính', 
          formatter: (value) => value === true ? 'Nam' : 'Nữ' },
        { field: 'className', label: 'Lớp' },
        { field: 'batchId', label: 'Khóa', sortable: true,
          formatter: (value) => `Khóa ${value}` },
        { field: 'isActive', label: 'Trạng thái', sortable: true, 
          formatter: (value) => value === true ? 'Đang hoạt động' : 'Không hoạt động' }
    ],
    teacher: [
        { field: 'id', label: 'ID', sortable: true },
        { field: 'teacherId', label: 'Mã giáo viên', sortable: true },
        { field: 'userId', label: 'User ID' },
        { field: 'fullName', label: 'Họ và tên', sortable: true },
        { field: 'email', label: 'Email', sortable: true },
        { field: 'phone', label: 'Số điện thoại' },
        { field: 'gender', label: 'Giới tính', 
          formatter: (value) => value === true ? 'Nam' : 'Nữ' },
        { field: 'major', label: 'Chuyên môn' },
        { field: 'homeroomClassName', label: 'Chủ nhiệm lớp' },
        { field: 'numberOfHomeroomClasses', label: 'Số lớp chủ nhiệm' },
        { field: 'isActive', label: 'Trạng thái', sortable: true,
          formatter: (value) => value === true ? 'Đang hoạt động' : 'Không hoạt động' }
    ],
    parent: [
        { field: 'id', label: 'ID', sortable: true },
        { field: 'parentId', label: 'Mã phụ huynh', sortable: true },
        { field: 'userId', label: 'User ID' },
        { field: 'fullName', label: 'Họ và tên', sortable: true },
        { field: 'email', label: 'Email', sortable: true },
        { field: 'phone', label: 'Số điện thoại' },
        { field: 'gender', label: 'Giới tính',
          formatter: (value) => value === true ? 'Nam' : 'Nữ' },
        { field: 'career', label: 'Nghề nghiệp' },
        { field: 'childrenCount', label: 'Số con',
          formatter: (value) => value || 0 },
        { field: 'childrenInfo', label: 'Thông tin con', 
          formatter: (value) => {
            if (!value || value.length === 0) return 'Không có';
            return value.map(child => {
              const userId = child.userId || 'N/A';
              const studentId = child.studentId || 'N/A';
              const batchId = child.batchId || 'N/A';
              
              let displayName = 'Học sinh';
              if (child.fullName && child.fullName.trim()) {
                displayName = child.fullName;
              } else if (userId !== 'N/A') {
                displayName = userId;
              } else {
                displayName = `Student ID: ${studentId}`;
              }
              
              return `${displayName}<br><small>(ID: ${studentId}, Khóa ${batchId})</small>`;
            }).join('<br><hr style="margin: 3px 0">');
          }},
        { field: 'isActive', label: 'Trạng thái', sortable: true,
          formatter: (value) => value === true ? 'Đang hoạt động' : 'Không hoạt động' }
    ]
};

/**
 * Generate academic year options based on current year
 */
function generateAcademicYearOptions() {
    const currentYear = new Date().getFullYear();
    const options = [];
    
    // Create 3 batches
    for (let i = 1; i <= 3; i++) {
        const startYear = currentYear - 5 + i;
        const endYear = startYear + 3;
        const batchId = i;
        
        options.push({
            value: batchId.toString(),
            label: `${startYear}-${endYear} (Khóa ${batchId})`
        });
    }
    
    console.log("Generated academic years:", options);
    return options;
}

// Filter options with academic year options
const filterOptions = {
    student: [
        { field: 'status', label: 'Trạng thái', options: [
            { value: 'active', label: 'Đang hoạt động' },
            { value: 'inactive', label: 'Không hoạt động' }
        ]},
        { field: 'batchId', label: 'Năm học', options: generateAcademicYearOptions() }
    ],
    teacher: [
        { field: 'status', label: 'Trạng thái', options: [
            { value: 'active', label: 'Đang hoạt động' },
            { value: 'inactive', label: 'Không hoạt động' }
        ]},
        { field: 'major', label: 'Chuyên môn', options: [] }
    ],
    parent: [
        { field: 'status', label: 'Trạng thái', options: [
            { value: 'active', label: 'Đang hoạt động' },
            { value: 'inactive', label: 'Không hoạt động' }
        ]},
        { field: 'batchId', label: 'Phụ huynh có con ở khóa', options: generateAcademicYearOptions() }
    ]
};

/**
 * Initialize user list event listeners
 */
function initUserListEvents() {
    // User type tab selection
    document.querySelectorAll('#userTypeTab button').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('#userTypeTab button').forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            
            // Update current user type and reload list
            currentUserType = this.dataset.type;
            currentPage = 1;
            updateFilterOptions(currentUserType);
            loadUserList(currentUserType, currentPage);
        });
    });
    
    // Search button
    document.getElementById('userSearchButton').addEventListener('click', function() {
        currentPage = 1;
        loadUserList(currentUserType, currentPage);
    });
    
    // Search input - search on Enter
    document.getElementById('userSearchInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            currentPage = 1;
            loadUserList(currentUserType, currentPage);
        }
    });
    
    // Filter select change
    document.getElementById('userFilterSelect').addEventListener('change', function() {
        currentPage = 1;
        loadUserList(currentUserType, currentPage);
    });
}

/**
 * Update filter options based on user type
 */
function updateFilterOptions(userType) {
    const filterSelect = document.getElementById('userFilterSelect');
    filterSelect.innerHTML = '<option value="">-- Lọc --</option>';
    
    if (!filterOptions[userType]) return;
    
    // Display options directly
    filterOptions[userType].forEach(filterGroup => {
        // Create optgroup with label
        const optgroup = document.createElement('optgroup');
        optgroup.label = filterGroup.label;
        
        // Add options
        if (filterGroup.options) {
            filterGroup.options.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = `${filterGroup.field}:${option.value}`;
                optionEl.textContent = option.label;
                optgroup.appendChild(optionEl);
            });
        }
        
        // Add group to dropdown
        filterSelect.appendChild(optgroup);
    });
    
    console.log("Filter options updated for", userType);
    console.log("Available filters:", filterOptions[userType]);
}

/**
 * Load user list from API
 */
async function loadUserList(userType, page) {
    // Show loading state
    document.getElementById('userListLoading').classList.remove('d-none');
    document.getElementById('userListEmpty').classList.add('d-none');
    document.getElementById('userListError').classList.add('d-none');
    
    try {
        const searchTerm = document.getElementById('userSearchInput').value.trim();
        const filterSelect = document.getElementById('userFilterSelect');
        const filterValue = filterSelect.value;
        
        // Use basic endpoint
        let url = `/api/database/users/${userType}/basic`;
        
        // Query parameters
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', pageSize);
        
        if (searchTerm) {
            params.append('search', searchTerm);
        }
        
        if (filterValue) {
            const [field, value] = filterValue.split(':');
            
            // Special handling for batchId (convert to number)
            if (field === 'batchId') {
                params.append(field, parseInt(value));
            } else {
                params.append(field, value);
            }
        }
        
        url += `?${params.toString()}`;
        
        // Update JSON request area with current query
        document.getElementById('user-list-json-request').value = JSON.stringify({
            type: userType,
            search: searchTerm,
            page: page,
            limit: pageSize,
            filter: filterValue
        }, null, 2);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        const data = await response.json();
        
        // Display raw response
        displayRawResponse('user-list-response', data);
        
        if (data.success) {
            // Get users array from response - handle different response structures
            const users = data.data || data.users || [];
            
            if (users.length === 0) {
                // Show empty state
                document.getElementById('userListEmpty').classList.remove('d-none');
                document.getElementById('userListTable').classList.add('d-none');
                document.getElementById('userListPagination').classList.add('d-none');
            } else {
                // Show table and pagination
                document.getElementById('userListTable').classList.remove('d-none');
                document.getElementById('userListPagination').classList.remove('d-none');
                
                // Update table headers
                updateTableHeaders(userType);
                
                // Update table body
                updateTableBody(userType, users);
                
                // Update pagination
                totalUsers = data.total || data.count || users.length;
                updatePagination(page, totalUsers);
            }
        } else {
            throw new Error(data.message || 'Unknown error');
        }
        
        // Hide loading state
        document.getElementById('userListLoading').classList.add('d-none');
        
    } catch (error) {
        console.error(`Error loading ${userType} list:`, error);
        document.getElementById('userListLoading').classList.add('d-none');
        document.getElementById('userListError').classList.remove('d-none');
        document.getElementById('userListError').textContent = `Đã xảy ra lỗi: ${error.message}`;
        
        // Display error in raw response area
        displayRawResponse('user-list-response', { error: error.message });
    }
}

/**
 * Update table headers based on user type
 */
function updateTableHeaders(userType) {
    const headerRow = document.getElementById('userTableHeader');
    headerRow.innerHTML = '';
    
    // Add action column
    const actionHeader = document.createElement('th');
    actionHeader.textContent = 'Thao tác';
    headerRow.appendChild(actionHeader);
    
    // Add data columns
    columnDefinitions[userType].forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label || column.header || column.field;
        headerRow.appendChild(th);
    });
}

/**
 * Update table body with user data
 */
function updateTableBody(userType, users) {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        // Add action column
        const actionCell = document.createElement('td');
        actionCell.innerHTML = `
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-primary view-user" data-id="${user._id || user.id}">
                    <i class="bi bi-eye"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary edit-user" data-id="${user._id || user.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button type="button" class="btn btn-outline-danger delete-user" data-id="${user._id || user.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        row.appendChild(actionCell);
        
        // Add data columns
        columnDefinitions[userType].forEach(column => {
            const cell = document.createElement('td');
            let value = user[column.field];
            
            // Apply formatter if defined
            if (column.formatter && typeof column.formatter === 'function') {
                value = column.formatter(value);
            }
            
            cell.innerHTML = value !== undefined && value !== null ? value : '';
            row.appendChild(cell);
        });
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    document.querySelectorAll('.view-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewUser(currentUserType, id);
        });
    });
    
    document.querySelectorAll('.edit-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editUser(currentUserType, id);
        });
    });
    
    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteUser(currentUserType, id);
        });
    });
}

/**
 * Update pagination controls
 */
function updatePagination(currentPage, totalItems) {
    const pagination = document.getElementById('userListPagination');
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Previous');
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    prevLi.appendChild(prevLink);
    pagination.appendChild(prevLi);
    
    // Add page links
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust start page if needed to always show 5 pages if available
    if (endPage - startPage < 4 && totalPages > 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.dataset.page = i;
        pageLi.appendChild(pageLink);
        pagination.appendChild(pageLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Next');
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    nextLi.appendChild(nextLink);
    pagination.appendChild(nextLi);
    
    // Add event listeners for pagination buttons
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (this.getAttribute('aria-label') === 'Previous' && currentPage > 1) {
                currentPage--;
                loadUserList(currentUserType, currentPage);
            } else if (this.getAttribute('aria-label') === 'Next' && currentPage < totalPages) {
                currentPage++;
                loadUserList(currentUserType, currentPage);
            } else if (this.dataset.page) {
                currentPage = parseInt(this.dataset.page);
                loadUserList(currentUserType, currentPage);
            }
        });
    });
}

/**
 * View user details
 */
function viewUser(userType, id) {
    console.log(`View ${userType} with ID: ${id}`);
    alert(`Xem thông tin chi tiết cho ${userType} ID: ${id}`);
}

/**
 * Edit user details
 */
function editUser(userType, id) {
    console.log(`Edit ${userType} with ID: ${id}`);
    alert(`Chỉnh sửa thông tin cho ${userType} ID: ${id}`);
}

/**
 * Delete user
 */
function deleteUser(userType, id) {
    if (confirm(`Bạn có chắc chắn muốn xóa ${userType} với ID: ${id}?`)) {
        console.log(`Delete ${userType} with ID: ${id}`);
        alert(`Đã xóa ${userType} ID: ${id}`);
    }
}

/**
 * Load subject options for teacher filter
 */
async function loadSubjectOptions() {
    try {
        console.log('Đang tải tùy chọn các môn học cho lọc giáo viên...');
        
        // Use fixed list of subjects from CSV
        const defaultSubjects = [
            { value: 'Toán', label: 'Toán' },
            { value: 'Vật lý', label: 'Vật lý' },
            { value: 'Hóa học', label: 'Hóa học' },
            { value: 'Sinh học', label: 'Sinh học' },
            { value: 'Lịch sử', label: 'Lịch sử' },
            { value: 'Địa lý', label: 'Địa lý' },
            { value: 'Dã ngoại', label: 'Dã ngoại' },
            { value: 'Tin học', label: 'Tin học' },
            { value: 'Bơi lội', label: 'Bơi lội' },
            { value: 'Cầu lông', label: 'Cầu lông' },
            { value: 'Bóng Chuyền', label: 'Bóng Chuyền' }
        ];
        
        // Update options for major filter
        const majorFilterIndex = filterOptions.teacher.findIndex(f => f.field === 'major');
        if (majorFilterIndex !== -1) {
            filterOptions.teacher[majorFilterIndex].options = defaultSubjects;
            console.log(`Đã cập nhật ${defaultSubjects.length} môn học cho bộ lọc giáo viên`);
        } else {
            console.warn('Không tìm thấy filter major trong filterOptions.teacher');
        }
        
        // If teacher tab is active, update dropdown immediately
        if (currentUserType === 'teacher') {
            updateFilterOptions('teacher');
            console.log('Đã cập nhật dropdown lọc cho tab giáo viên');
        }
    } catch (error) {
        console.error('Lỗi khi thiết lập tùy chọn môn học:', error);
        alert('Không thể tải danh sách môn học. Vui lòng thử lại sau.');
    }
}

/**
 * Create new user (student/teacher)
 */
async function createUser(userData) {
    try {
        // Verify role is present
        if (!userData.role) {
            throw new Error('Role is required');
        }
        
        const role = userData.role.toLowerCase();
        
        // For student role, create batch if needed
        if (role === 'student' && userData.batchId) {
            const batchId = userData.batchId.toString();
            
            // Calculate start and end years based on the batch ID
            const baseYear = 2021; // Where batchId 1 = 2021-2024
            const startYear = baseYear + parseInt(batchId) - 1;
            const endYear = startYear + 3;
            
            // Create/ensure batch exists before creating the student
            try {
                const batchName = `Khóa ${startYear}-${endYear}`;
                await createBatch(batchName, startYear, endYear);
            } catch (batchError) {
                console.error('Error creating batch:', batchError);
                // Continue with user creation even if batch creation fails
            }
        }
        
        // Submit user creation request
        console.log('Creating user with payload:', userData);
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Error creating user');
        }
        
        return data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

/**
 * Get all parents data from form
 */
function getAllParents() {
    const parentNames = [];
    const parentPhones = [];
    const parentCareers = [];
    const parentGenders = [];
    
    document.querySelectorAll('.parent-entry').forEach((entry) => {
        // Get parent info
        const name = entry.querySelector('.parent-name').value.trim();
        const phone = entry.querySelector('.parent-phone').value.trim();
        const career = entry.querySelector('.parent-career').value.trim();
        const gender = entry.querySelector('.parent-gender:checked').value === 'true';
        
        // Only add parent info if we have a name (minimum required field)
        if (name) {
            parentNames.push(name);
            parentPhones.push(phone);
            parentCareers.push(career);
            parentGenders.push(gender);
        }
    });
    
    return { parentNames, parentPhones, parentCareers, parentGenders };
}

// Export functions
export {
    columnDefinitions,
    filterOptions,
    initUserListEvents,
    updateFilterOptions,
    loadUserList,
    loadSubjectOptions,
    createUser,
    getAllParents
}; 