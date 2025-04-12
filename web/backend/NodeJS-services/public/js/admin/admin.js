// Main Admin Module
import { updateAuthStatus } from './auth.js';
import { loadBatches } from './batchManagement.js';
import { initUserListEvents, loadUserList, loadSubjectOptions } from './userManagement.js';
import { initFormEvents } from './formManagement.js';

// Initialize everything when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Update authentication status
    updateAuthStatus();
    
    // Initialize form events
    initFormEvents();
    
    // Initialize user list events
    initUserListEvents();
    
    // Load batches
    loadBatches();
    
    // Load subject options for teacher filter
    loadSubjectOptions();
    
    // Load initial user list (student tab is active by default)
    loadUserList('student', 1);
    
    // Check authentication button
    document.getElementById('checkAuthBtn').addEventListener('click', async () => {
        try {
            await import('./auth.js').then(({ checkAuth }) => {
                checkAuth();
            });
        } catch (error) {
            console.error('Error checking authentication:', error);
        }
    });
}); 