// Form Management Module
import { token } from './auth.js';
import { displayResponseMessage, displayRawResponse } from './utils.js';
import { loadBatches } from './batchManagement.js';
import { createUser, getAllParents } from './userManagement.js';

let parentCounter = 1;

/**
 * Set up parent controls in the form
 */
function setupParentControls() {
    // Make sure the first parent entry has its remove button hidden
    const firstRemoveBtn = document.querySelector('.parent-entry .remove-parent-btn');
    if (firstRemoveBtn) {
        firstRemoveBtn.style.display = 'none';
    }
}

/**
 * Add a new parent entry to the form
 */
function addParentEntry() {
    parentCounter++;
    const newParentHtml = `
        <div class="parent-entry border-bottom pb-2 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">Phụ huynh #${parentCounter}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger remove-parent-btn">Xóa</button>
            </div>
            
            <!-- Manual parent info entry -->
            <div class="manual-parent-info">
                <div class="row mb-2">
                    <div class="col-md-6">
                        <label class="form-label">Họ tên phụ huynh</label>
                        <input type="text" class="form-control parent-name">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Số điện thoại</label>
                        <input type="text" class="form-control parent-phone">
                    </div>
                </div>
                
                <div class="row mb-2">
                    <div class="col-md-6">
                        <label class="form-label">Nghề nghiệp</label>
                        <input type="text" class="form-control parent-career">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Giới tính</label>
                        <div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input parent-gender" type="radio" name="parentGender${parentCounter}" value="true" checked>
                                <label class="form-check-label">Nam</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input parent-gender" type="radio" name="parentGender${parentCounter}" value="false">
                                <label class="form-check-label">Nữ</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('parentsContainer').insertAdjacentHTML('beforeend', newParentHtml);
    
    // Show remove button on first parent if we have more than one
    if (parentCounter > 1) {
        document.querySelector('.remove-parent-btn[style="display:none;"]')?.removeAttribute('style');
    }
    
    // Update the JSON template
    updateJsonTemplate();
}

/**
 * Handle removal of parent entry
 */
function handleParentRemoval(event) {
    if (event.target.classList.contains('remove-parent-btn')) {
        event.target.closest('.parent-entry').remove();
        
        // Renumber the remaining parents
        parentCounter = 0;
        document.querySelectorAll('.parent-entry').forEach((entry, index) => {
            parentCounter = index + 1;
            entry.querySelector('h6').textContent = `Phụ huynh #${parentCounter}`;
            
            // Update radio button names
            const radioButtons = entry.querySelectorAll('.parent-gender');
            radioButtons.forEach(radio => {
                radio.name = `parentGender${parentCounter}`;
            });
        });
        
        // If we're back to only one parent, hide its remove button
        if (parentCounter === 1) {
            document.querySelector('.remove-parent-btn').style.display = 'none';
        }
        
        // Update the JSON template
        updateJsonTemplate();
    }
}

/**
 * Update JSON template based on form values
 */
function updateJsonTemplate() {
    // Get role from dropdown
    const role = document.getElementById('roleField').value;
    const userType = role.toLowerCase();
    
    // Create basic JSON template
    let template = {
        role: role,
        firstName: document.getElementById('firstNameField').value || "",
        lastName: document.getElementById('lastNameField').value || "",
        phone: document.getElementById('phoneField').value || "",
        gender: document.querySelector('input[name="genderField"]:checked').value === 'true' ? true : false,
        password: document.getElementById('passwordField').value || "1234"
    };
    
    // Add type-specific fields
    if (userType === 'student') {
        Object.assign(template, {
            address: document.getElementById('addressField').value || "",
            dateOfBirth: document.getElementById('dobField').value || "",
            batchId: parseInt(document.getElementById('batchField').value) || null
        });
        
        // Get parent information
        const { parentNames, parentPhones, parentCareers, parentGenders } = getAllParents();
        if (parentNames.length > 0) {
            Object.assign(template, {
                parentNames: parentNames,
                parentCareers: parentCareers,
                parentPhones: parentPhones,
                parentGenders: parentGenders
            });
        }
    } else if (userType === 'teacher') {
        // Get all majors from both the list and current input
        let majorsList = document.getElementById('majorListInput').value;
        const currentMajor = document.getElementById('majorField').value.trim();
        
        // Combine if both exist
        if (majorsList && currentMajor) {
            majorsList += ', ' + currentMajor;
        } else if (currentMajor) {
            majorsList = currentMajor;
        }
        
        Object.assign(template, {
            address: document.getElementById('teacherAddressField').value || "",
            dateOfBirth: document.getElementById('teacherDobField').value || "",
            major: majorsList,
            weeklyCapacity: parseInt(document.getElementById('weeklyCapacityField').value) || 10
        });
    }
    
    document.getElementById('unified-create-json').value = JSON.stringify(template, null, 2);
}

/**
 * Add major to the major list
 */
function addMajor() {
    const majorField = document.getElementById('majorField');
    const majorValue = majorField.value.trim();
    
    if (majorValue) {
        // Add to the visual list
        const majorList = document.getElementById('majorList');
        const majorItem = document.createElement('div');
        majorItem.className = 'badge bg-secondary me-2 mb-2 p-2';
        majorItem.innerHTML = `${majorValue} <span class="remove-major" style="cursor:pointer;">&times;</span>`;
        majorList.appendChild(majorItem);
        
        // Clear the input
        majorField.value = '';
        
        // Update the hidden input with all majors
        updateMajorsList();
    }
}

/**
 * Remove a major from the major list
 */
function handleMajorRemoval(event) {
    if (event.target.classList.contains('remove-major')) {
        event.target.parentNode.remove();
        updateMajorsList();
    }
}

/**
 * Update the hidden input with all majors
 */
function updateMajorsList() {
    const majors = [];
    document.querySelectorAll('#majorList .badge').forEach(badge => {
        majors.push(badge.textContent.replace('×', '').trim());
    });
    
    // Store as comma-separated string
    document.getElementById('majorListInput').value = majors.join(', ');
    
    // Also update the JSON template
    updateJsonTemplate();
}

/**
 * Toggle display of entity-specific fields based on role
 */
function toggleEntityFields() {
    const selectedRole = document.getElementById('roleField').value.toLowerCase();
    
    // Hide all entity-specific fields
    document.querySelectorAll('.entity-fields').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show fields for selected entity type based on role
    if (selectedRole === 'student') {
        document.getElementById('studentFields').style.display = 'block';
        loadBatches();
    } else if (selectedRole === 'teacher') {
        document.getElementById('teacherFields').style.display = 'block';
    }
    
    // Update JSON editor with template for selected type
    updateJsonTemplate();
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Basic validation
    const role = document.getElementById('roleField').value;
    const firstName = document.getElementById('firstNameField').value.trim();
    const lastName = document.getElementById('lastNameField').value.trim();
    
    if (!firstName || !lastName) {
        displayResponseMessage('unified-create-response-message', 'Vui lòng nhập đầy đủ họ và tên', false);
        return;
    }
    
    // Role-specific validation
    if (role.toLowerCase() === 'student') {
        const batchField = document.getElementById('batchField');
        if (!batchField.value) {
            displayResponseMessage('unified-create-response-message', 'Vui lòng chọn khóa học cho học sinh', false);
            return;
        }
    } else if (role.toLowerCase() === 'teacher') {
        // Check if we have at least one major
        const majorList = document.getElementById('majorListInput').value;
        const majorField = document.getElementById('majorField').value.trim();
        
        if (!majorList && !majorField) {
            displayResponseMessage('unified-create-response-message', 'Vui lòng nhập ít nhất một chuyên ngành cho giáo viên', false);
            return;
        }
    }
    
    try {
        // Get role from dropdown
        const role = document.getElementById('roleField').value;
        const userType = role.toLowerCase();
        const selectedBatch = document.getElementById('batchField').value;
        
        // Get gender value as boolean for all user types
        const genderValue = document.querySelector('input[name="genderField"]:checked').value === 'true';
        
        // Get the userId and generate email for students
        const backupEmail = document.getElementById('backupEmailField').value.trim() || null;
        
        // Create base payload
        const payload = {
            role: role,
            firstName: document.getElementById('firstNameField').value,
            lastName: document.getElementById('lastNameField').value,
            phone: document.getElementById('phoneField').value,
            gender: genderValue,
            password: document.getElementById('passwordField').value || "1234",
            backup_email: backupEmail
        };
        
        // Add fields based on role
        if (userType === 'student') {
            // Add student-specific fields
            payload.batchId = parseInt(selectedBatch);
            payload.address = document.getElementById('addressField').value;
            payload.dateOfBirth = document.getElementById('dobField').value;
            
            // Get parents data
            const { parentNames, parentPhones, parentCareers, parentGenders } = getAllParents();
            
            if (parentNames.length > 0) {
                const parents = [];
                
                for (let i = 0; i < parentNames.length; i++) {
                    if (parentNames[i]) {
                        parents.push({
                            firstName: parentNames[i],
                            lastName: '',
                            gender: parentGenders[i],
                            phone: parentPhones[i] || null
                        });
                    }
                }
                
                if (parents.length) {
                    payload.parents = parents;
                    // Also add the arrays
                    payload.parentNames = parentNames;
                    payload.parentPhones = parentPhones;
                    payload.parentCareers = parentCareers;
                    payload.parentGenders = parentGenders;
                }
            }
        } else if (userType === 'teacher') {
            // Get all majors from both the list and current input
            let majorsList = document.getElementById('majorListInput').value;
            const currentMajor = document.getElementById('majorField').value.trim();
            
            // Combine if both exist
            if (majorsList && currentMajor) {
                majorsList += ', ' + currentMajor;
            } else if (currentMajor) {
                majorsList = currentMajor;
            }
            
            // Get teacher ID if provided
            const teacherIdField = document.getElementById('teacherIdField').value.trim();
            
            // Add teacher specific fields
            Object.assign(payload, {
                teacherId: teacherIdField || undefined,
                address: document.getElementById('teacherAddressField').value || "",
                dateOfBirth: document.getElementById('teacherDobField').value || "",
                major: majorsList,
                weeklyCapacity: parseInt(document.getElementById('weeklyCapacityField').value) || 10
            });
        }
        
        // Submit user creation request
        const data = await createUser(payload);
        
        // Display response
        displayResponseMessage(
            'unified-create-response-message', 
            data.success 
                ? `${userType} created successfully! UserID: ${data.data.userId}, Email: ${data.data.email}` 
                : `Error: ${data.message}`,
            data.success
        );
        
        displayRawResponse('unified-create-response', data);
        displayRawResponse('response', data);
        
    } catch (error) {
        displayResponseMessage('unified-create-response-message', `Error: ${error.message}`, false);
        displayRawResponse('unified-create-response', { error: error.message });
    }
}

/**
 * Execute user creation from raw JSON
 */
async function executeJsonUserCreation() {
    try {
        const jsonData = JSON.parse(document.getElementById('unified-create-json').value);
        
        // Convert gender to boolean if it's a string
        if (typeof jsonData.gender === 'string') {
            jsonData.gender = jsonData.gender === 'Male' || jsonData.gender === 'true' || jsonData.gender === 'True';
        }
        
        const data = await createUser(jsonData);
        
        // Display response
        displayRawResponse('unified-create-response', data);
        displayRawResponse('response', data);
        
    } catch (error) {
        displayResponseMessage('unified-create-response-message', `Error: ${error.message}`, false);
        displayRawResponse('unified-create-response', { error: error.message });
    }
}

/**
 * Initialize all form event listeners
 */
function initFormEvents() {
    // Initialize parent control setup
    setupParentControls();
    
    // Role change handler
    document.getElementById('roleField').addEventListener('change', toggleEntityFields);
    
    // Add parent button
    document.getElementById('addParentBtn').addEventListener('click', addParentEntry);
    
    // Remove parent button delegation
    document.getElementById('parentsContainer').addEventListener('click', handleParentRemoval);
    
    // Add major button handler
    document.getElementById('addMajorBtn').addEventListener('click', addMajor);
    
    // Remove major badge when clicked
    document.getElementById('majorList').addEventListener('click', handleMajorRemoval);
    
    // Update JSON when any field changes
    document.querySelectorAll('#unifiedCreateForm input, #unifiedCreateForm select').forEach(el => {
        el.addEventListener('input', updateJsonTemplate);
    });
    
    // Handle form submission
    document.getElementById('unifiedCreateForm').addEventListener('submit', handleFormSubmit);
    
    // Execute from raw JSON
    document.getElementById('unified-create-execute').addEventListener('click', executeJsonUserCreation);
    
    // Batch creation button
    document.getElementById('createBatchBtn').addEventListener('click', async function() {
        try {
            const batchName = document.getElementById('batchNameField').value;
            const startYear = parseInt(document.getElementById('startYearField').value);
            const endYear = parseInt(document.getElementById('endYearField').value);
            
            // Call the imported createBatch function from batchManagement.js
            const response = await fetch('/api/database/batches/create-if-not-exists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    batchName: batchName || `Khóa ${startYear}-${endYear}`,
                    startYear: startYear,
                    endYear: endYear,
                    isActive: true
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Add the new batch to the dropdown and select it
                const batchSelect = document.getElementById('batchField');
                const option = document.createElement('option');
                option.value = data.data.batchId;
                option.textContent = `${data.data.batchName}`;
                option.dataset.startYear = startYear.toString();
                option.dataset.endYear = endYear.toString();
                batchSelect.appendChild(option);
                batchSelect.value = data.data.batchId;
                
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('newBatchModal'));
                modal.hide();
                
                // Reset the form
                document.getElementById('newBatchForm').reset();
                
                // Only show alert if the batch is newly created
                if (data.isNew) {
                    alert('Khóa học đã được tạo mới thành công!');
                }
            } else {
                alert(`Lỗi: ${data.message}`);
                console.error('Batch creation error:', data);
            }
        } catch (error) {
            console.error('Error creating batch:', error);
            alert(`Lỗi: ${error.message}`);
        }
    });
    
    // Initial JSON template setup
    updateJsonTemplate();
}

export {
    parentCounter,
    setupParentControls,
    addParentEntry,
    updateJsonTemplate,
    toggleEntityFields,
    handleFormSubmit,
    initFormEvents
}; 