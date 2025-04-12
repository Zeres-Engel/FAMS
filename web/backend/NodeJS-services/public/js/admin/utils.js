// Utils Module

/**
 * Display formatted response message
 * @param {string} elementId - The ID of element to display message in
 * @param {string} data - The message to display
 * @param {boolean} isSuccess - Whether this is a success message
 */
function displayResponseMessage(elementId, data, isSuccess = true) {
    const element = document.getElementById(elementId);
    
    if (isSuccess) {
        element.innerHTML = `<div class="alert alert-success">${data}</div>`;
    } else {
        element.innerHTML = `<div class="alert alert-danger">${data}</div>`;
    }
}

/**
 * Display raw JSON response
 * @param {string} elementId - The ID of element to display data in 
 * @param {object|string} data - The data to display
 */
function displayRawResponse(elementId, data) {
    const element = document.getElementById(elementId);
    element.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}

/**
 * Log to console for debugging
 * @param {string} message - Debug message
 * @param {any} data - Debug data
 */
function logDebug(message, data) {
    console.log(`DEBUG - ${message}:`, data);
}

/**
 * Calculate numeric batchId from start year
 * @param {number} startYear - The starting year 
 * @returns {number} Calculated batch ID
 */
function calculateBatchId(startYear) {
    // Formula: 2021-2024 = 1, 2022-2025 = 2, etc.
    const baseYear = 2021;
    return (startYear - baseYear) + 1;
}

export { 
    displayResponseMessage, 
    displayRawResponse, 
    logDebug,
    calculateBatchId
}; 