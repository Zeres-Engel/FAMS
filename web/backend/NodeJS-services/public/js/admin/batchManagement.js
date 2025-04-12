// Batch Management Module
import { token } from './auth.js';
import { calculateBatchId, displayResponseMessage } from './utils.js';

/**
 * Function to generate batch options based on current year
 * @returns {Array} Array of batch objects with name, startYear, endYear
 */
function generateBatchOptions() {
    const currentYear = new Date().getFullYear();
    console.log('Current year for generating batches:', currentYear);
    
    // Make sure these are valid numbers
    const startYear1 = currentYear - 2;
    const endYear1 = currentYear + 1;
    
    const startYear2 = currentYear - 1;
    const endYear2 = currentYear + 2;
    
    const startYear3 = currentYear;
    const endYear3 = currentYear + 3;
    
    const batchData = [
        { name: `Khóa ${startYear1}-${endYear1}`, startYear: startYear1, endYear: endYear1 },
        { name: `Khóa ${startYear2}-${endYear2}`, startYear: startYear2, endYear: endYear2 },
        { name: `Khóa ${startYear3}-${endYear3}`, startYear: startYear3, endYear: endYear3 }
    ];
    
    console.log('Generated default batches:', batchData);
    return batchData;
}

/**
 * Function to load batches from the API with options based on current year
 */
async function loadBatches() {
    try {
        const response = await fetch('/api/database/batches/options', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('Batches data from API:', data);
        
        const batchSelect = document.getElementById('batchField');
        
        // Clear existing options except the first one
        while (batchSelect.options.length > 1) {
            batchSelect.remove(1);
        }
        
        if (data.success && data.data.length > 0) {
            // Add batches to the dropdown
            data.data.forEach(batch => {
                const option = document.createElement('option');
                
                // Extract years from startDate and endDate if they exist
                let startYear, endYear;
                
                if (batch.startDate) {
                    startYear = new Date(batch.startDate).getFullYear();
                } else if (batch.startYear) {
                    startYear = parseInt(batch.startYear);
                }
                
                if (batch.endDate) {
                    endYear = new Date(batch.endDate).getFullYear();
                } else if (batch.endYear) {
                    endYear = parseInt(batch.endYear);
                }
                
                // Calculate the numeric batchId based on start year
                let numericId;
                if (batch.batchId && !isNaN(parseInt(batch.batchId))) {
                    numericId = parseInt(batch.batchId);
                    option.value = numericId.toString();
                } else if (startYear) {
                    numericId = calculateBatchId(startYear);
                    option.value = numericId.toString();
                } else {
                    option.value = '';
                    numericId = '';
                }
                
                // Store the data for later use
                option.dataset.startYear = (startYear || '').toString();
                option.dataset.endYear = (endYear || '').toString();
                option.dataset.batchName = batch.batchName || '';
                option.dataset.numericId = numericId.toString();
                
                // Format display text to show year range and ID
                option.textContent = `Khóa ${startYear}-${endYear} (ID: ${numericId})`;
                batchSelect.appendChild(option);
            });
        } else {
            // If API fails, generate default options based on current year
            const defaultBatches = generateBatchOptions();
            defaultBatches.forEach(batch => {
                const option = document.createElement('option');
                
                // Calculate numeric ID based on year range (2021-2024 = 1)
                const numericId = calculateBatchId(batch.startYear);
                
                // Set the correct value to ensure the batchId is passed correctly
                option.value = numericId.toString();
                option.textContent = `Khóa ${batch.startYear}-${batch.endYear} (ID: ${numericId})`;
                
                // Store data for later use
                option.dataset.startYear = batch.startYear.toString();
                option.dataset.endYear = batch.endYear.toString();
                option.dataset.batchName = `Khóa ${batch.startYear}-${batch.endYear}`;
                option.dataset.numericId = numericId.toString();
                
                console.log('Setting dataset for default batch:', {
                    batchName: option.dataset.batchName,
                    startYear: option.dataset.startYear,
                    endYear: option.dataset.endYear,
                    numericId: option.dataset.numericId,
                    value: option.value
                });
                
                batchSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading batches:', error);
    }
}

/**
 * Creates a new batch
 * @returns {Promise} Promise representing the creation process
 */
async function createBatch(batchName, startYear, endYear) {
    try {
        if (!startYear || !endYear || isNaN(startYear) || isNaN(endYear)) {
            throw new Error('Vui lòng điền đầy đủ thông tin năm bắt đầu và kết thúc hợp lệ');
        }
        
        // Calculate numeric batch ID (2021-2024 = 1)
        const baseYear = 2021;
        const numericId = (startYear - baseYear) + 1;
        const batchId = numericId.toString();
        
        // Always create standard dates for each academic year
        // September 1st of start year to June 30th of end year
        const startDate = new Date(Date.UTC(startYear, 8, 1)); // September 1st (months are 0-indexed)
        const endDate = new Date(Date.UTC(endYear, 5, 30));    // June 30th
        
        // Verify dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Lỗi: Không thể tạo ngày hợp lệ từ năm đã nhập');
        }
        
        console.log('Creating batch with dates:', {
            startYear,
            endYear,
            numericId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        
        const response = await fetch('/api/database/batches/create-if-not-exists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                batchId: batchId,
                numericId: numericId,
                batchName: batchName || `Khóa ${startYear}-${endYear} (ID: ${batchId})`,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                startYear: startYear,
                endYear: endYear,
                isActive: true
            })
        });
        
        const data = await response.json();
        console.log('Batch creation response:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Unknown error creating batch');
        }
        
        return data;
    } catch (error) {
        console.error('Error creating batch:', error);
        throw error;
    }
}

/**
 * Function to load batch options for filters
 */
async function loadBatchOptions() {
    try {
        const response = await fetch('/api/database/batches/options', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            return data.data.map(batch => {
                const batchId = batch.batchId || batch.numericId;
                const batchName = batch.batchName || `Khóa ${batch.startYear}-${batch.endYear}`;
                return {
                    value: batchId,
                    label: batchName
                };
            });
        } else {
            // If API fails, generate default options based on current year
            const defaultBatches = generateBatchOptions();
            return defaultBatches.map(batch => ({
                value: calculateBatchId(batch.startYear),
                label: batch.name
            }));
        }
    } catch (error) {
        console.error('Error loading batch options:', error);
        return []; // Return empty array on error
    }
}

// Export functions
export { 
    generateBatchOptions, 
    loadBatches, 
    createBatch,
    loadBatchOptions
}; 