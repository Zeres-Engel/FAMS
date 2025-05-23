/**
 * Parse expiry date from format string
 * @param {string} expiryFormat - Format string like "1y", "2y", "3y" or a valid date string
 * @returns {Date} Calculated expiry date
 */
exports.parseExpiryDate = (expiryFormat) => {
  // If no expiry format provided, default to 3 years
  if (!expiryFormat) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    return expiryDate;
  }

  // Check if the format is like "1y", "2y", "3y"
  const yearMatch = expiryFormat.match(/^(\d+)y$/);
  if (yearMatch) {
    const years = parseInt(yearMatch[1], 10);
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + years);
    return expiryDate;
  }

  // Otherwise, assume it's a valid date string
  return new Date(expiryFormat);
}; 