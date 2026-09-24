export const USD_TO_LBP_RATE = 89500;

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
 * Formats a USD amount to Lebanese Pounds (L.L.).
 * @param {number} amountInUSD - The USD amount
 * @param {number} rate - Exchange rate (default: 89,500)
 * @returns {string} - The formatted L.L. currency string (e.g., "89,500 L.L.")
 */
export const formatLL = (amountInUSD, rate = USD_TO_LBP_RATE) => {
  if (amountInUSD === undefined || amountInUSD === null || isNaN(amountInUSD)) return '0 L.L.';
  const llAmount = Math.round(Number(amountInUSD) * rate);
  return `${llAmount.toLocaleString('en-US')} L.L.`;
};

/**
 * Formats both USD and L.L. side by side.
 * @param {number} amountInUSD - The USD amount
 * @param {number} rate - Exchange rate
 * @returns {string} - e.g. "$10.00 (895,000 L.L.)"
 */
export const formatDualCurrency = (amountInUSD, rate = USD_TO_LBP_RATE) => {
  return `${formatCurrency(amountInUSD)} (${formatLL(amountInUSD, rate)})`;
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
