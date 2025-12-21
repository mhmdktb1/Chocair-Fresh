/**
 * Formats a number as a currency string.
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency symbol (default: '$')
 * @returns {string} - The formatted currency string
 */
export const formatCurrency = (amount, currency = '$') => {
  if (amount === undefined || amount === null) return `${currency}0.00`;
  return `${currency}${Number(amount).toFixed(2)}`;
};

/**
 * Formats a date string to a readable format.
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date string (e.g., "Oct 25, 2023")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};
