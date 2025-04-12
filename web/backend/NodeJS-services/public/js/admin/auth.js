// Auth Module
let token = localStorage.getItem('auth_token') || '';
let currentUser = JSON.parse(localStorage.getItem('current_user') || 'null');

/**
 * Update authentication status display
 */
function updateAuthStatus() {
    const authStatus = document.getElementById('authStatus');
    
    if (token && currentUser) {
        authStatus.innerHTML = `
            <span class="badge bg-success">Đã đăng nhập</span>
            <span class="ms-2">Người dùng: <strong>${currentUser.name || currentUser.userId}</strong> (${currentUser.role})</span>
        `;
    } else {
        authStatus.innerHTML = `<span class="badge bg-warning">Chưa đăng nhập</span>`;
    }
}

/**
 * Check authentication status with API
 */
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('current_user', JSON.stringify(data.data));
            currentUser = data.data;
            displayResponseMessage('response', 'Đã xác thực thành công!', true);
        } else {
            localStorage.removeItem('current_user');
            currentUser = null;
            displayResponseMessage('response', 'Lỗi xác thực: ' + data.message, false);
        }
        
        updateAuthStatus();
        
    } catch (error) {
        displayResponseMessage('response', `Error: ${error.message}`, false);
        localStorage.removeItem('current_user');
        currentUser = null;
        updateAuthStatus();
    }
}

// Exported functions and variables
export { token, currentUser, updateAuthStatus, checkAuth }; 