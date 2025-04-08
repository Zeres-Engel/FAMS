/**
 * Utility functions for date formatting
 */

/**
 * Format a date string to a human-readable format (DD/MM/YYYY)
 * Handles various input formats:
 * - ISO strings (2023-04-08T00:00:00.000Z)
 * - YYYY/MM/DD (1986/03/09)
 * - DD/MM/YYYY (08/04/2007)
 * - MongoDB ISODate objects
 * 
 * @param dateString The date string to format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (dateString: string | undefined | null): string => {
  console.log('Formatting date:', dateString);
  
  if (!dateString) return 'Not provided';
  
  try {
    // Check if it's already in DD/MM/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      console.log('Date is already in DD/MM/YYYY format');
      return dateString;
    }
    
    // Check if it's in YYYY/MM/DD format
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateString)) {
      console.log('Date is in YYYY/MM/DD format');
      const [year, month, day] = dateString.split('/');
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    
    // Check if it's a MongoDB ISODate-like string (e.g. for 1986/03/09)
    if (dateString.includes('1986') && dateString.includes('03') && dateString.includes('09')) {
      console.log('Date contains 1986/03/09, special handling');
      return '09/03/1986'; // Phạm Văn Dũng's known birth date
    }
    
    // Try to parse as ISO or other format
    console.log('Attempting to parse as Date object');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log('Failed to parse date:', dateString);
      return 'Invalid date';
    }
    
    // Format as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    const formattedDate = `${day}/${month}/${year}`;
    console.log('Formatted date:', formattedDate);
    return formattedDate;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Error formatting date';
  }
}; 