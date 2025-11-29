/**
 * ==========================================
 * LEBANESE PHONE NUMBER UTILITIES
 * ==========================================
 * 
 * Handles normalization and validation of Lebanese phone numbers.
 * Accepts multiple formats and converts to standard +961XXXXXXXX format.
 */

/**
 * Map of Arabic digits to Western digits
 */
const ARABIC_TO_WESTERN = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

/**
 * Valid Lebanese mobile operator prefixes
 * Reference: https://en.wikipedia.org/wiki/Telephone_numbers_in_Lebanon
 */
const VALID_OPERATOR_PREFIXES = ['70', '71', '76', '78', '79', '81'];

/**
 * Convert Arabic/Indic digits to Western digits
 * @param {string} input - String containing Arabic digits
 * @returns {string} String with Western digits
 * 
 * @example
 * convertArabicToWestern("٠٧٠١٢٣٤٥٦") // "070123456"
 */
function convertArabicToWestern(input) {
  return input.replace(/[٠-٩]/g, (digit) => ARABIC_TO_WESTERN[digit] || digit);
}

/**
 * Remove all non-digit characters except leading +
 * @param {string} input - Phone number with formatting
 * @returns {string} Cleaned phone number
 * 
 * @example
 * cleanPhoneNumber("+961 (70) 123-456") // "+96170123456"
 * cleanPhoneNumber("00961.70.123.456") // "0096170123456"
 */
function cleanPhoneNumber(input) {
  // First, convert Arabic digits to Western
  let cleaned = convertArabicToWestern(input);
  
  // Keep only digits and leading +
  cleaned = cleaned.replace(/[^\d+]/g, '');
  
  // Ensure + is only at the start
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    cleaned = '+' + parts.join('');
  }
  
  return cleaned;
}

/**
 * Normalize Lebanese phone number to international format
 * Accepts various input formats and returns standardized +961XXXXXXXX
 * 
 * @param {string} input - Phone number in any supported format
 * @returns {string|null} Normalized phone number (+961XXXXXXXX) or null if invalid
 * 
 * @example
 * // All these return "+96170123456"
 * normalizeLebanesePhoneNumber("70 123 456")
 * normalizeLebanesePhoneNumber("70123456")
 * normalizeLebanesePhoneNumber("70-123-456")
 * normalizeLebanesePhoneNumber("70.123.456")
 * normalizeLebanesePhoneNumber("(70)123456")
 * normalizeLebanesePhoneNumber("+96170123456")
 * normalizeLebanesePhoneNumber("+961 70 123456")
 * normalizeLebanesePhoneNumber("+961-70-123-456")
 * normalizeLebanesePhoneNumber("0096170123456")
 * normalizeLebanesePhoneNumber("96170123456")
 * normalizeLebanesePhoneNumber("961 70 123 456")
 * normalizeLebanesePhoneNumber("00961 70 123456")
 * normalizeLebanesePhoneNumber("(+961) 70 123 456")
 * normalizeLebanesePhoneNumber("٠٧٠١٢٣٤٥٦") // Arabic digits
 * 
 * @example
 * // Invalid examples return null
 * normalizeLebanesePhoneNumber("12345") // Too short
 * normalizeLebanesePhoneNumber("75123456") // Invalid operator prefix
 * normalizeLebanesePhoneNumber("+1234567890") // Wrong country code
 */
export function normalizeLebanesePhoneNumber(input) {
  // Validate input
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Clean the input
  let cleaned = cleanPhoneNumber(input.trim());
  
  if (!cleaned) {
    return null;
  }

  // Remove leading + for processing
  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  let mobileNumber = '';

  // Case 1: Starts with "00961" (international format with 00)
  if (cleaned.startsWith('00961')) {
    mobileNumber = cleaned.substring(5); // Remove "00961"
  }
  // Case 2: Starts with "961" (international format without +)
  else if (cleaned.startsWith('961')) {
    mobileNumber = cleaned.substring(3); // Remove "961"
  }
  // Case 3: Starts with "0" (local format with leading zero)
  else if (cleaned.startsWith('0') && cleaned.length >= 8) {
    mobileNumber = cleaned.substring(1); // Remove leading "0"
  }
  // Case 4: Just the mobile number (8 digits starting with valid prefix)
  else if (cleaned.length === 8) {
    mobileNumber = cleaned;
  }
  // Case 5: 7 digits without leading zero (old format)
  else if (cleaned.length === 7) {
    mobileNumber = cleaned;
  }
  // Invalid format
  else {
    return null;
  }

  // Ensure we have exactly 8 digits for mobile number
  // If 7 digits, it might be old format (add leading digit based on common patterns)
  if (mobileNumber.length === 7) {
    // Common pattern: if starts with 0, 1, 6, 8, or 9, prepend '7' or '8'
    // For safety, we'll require 8 digits
    return null;
  }

  if (mobileNumber.length !== 8) {
    return null;
  }

  // Validate operator prefix (first 2 digits)
  const operatorPrefix = mobileNumber.substring(0, 2);
  if (!VALID_OPERATOR_PREFIXES.includes(operatorPrefix)) {
    return null;
  }

  // Ensure all remaining characters are digits
  if (!/^\d{8}$/.test(mobileNumber)) {
    return null;
  }

  // Return normalized format
  return `+961${mobileNumber}`;
}

/**
 * Validate if a string is a valid Lebanese phone number
 * @param {string} input - Phone number to validate
 * @returns {boolean} True if valid, false otherwise
 * 
 * @example
 * isValidLebanesePhoneNumber("+96170123456") // true
 * isValidLebanesePhoneNumber("70 123 456") // true
 * isValidLebanesePhoneNumber("12345") // false
 */
export function isValidLebanesePhoneNumber(input) {
  return normalizeLebanesePhoneNumber(input) !== null;
}

/**
 * Format a normalized phone number for display
 * @param {string} normalizedPhone - Phone in +961XXXXXXXX format
 * @param {string} format - Display format ('international', 'local', 'friendly')
 * @returns {string} Formatted phone number
 * 
 * @example
 * formatPhoneNumber("+96170123456", "international") // "+961 70 123 456"
 * formatPhoneNumber("+96170123456", "local") // "070 123 456"
 * formatPhoneNumber("+96170123456", "friendly") // "(70) 123-456"
 */
export function formatPhoneNumber(normalizedPhone, format = 'international') {
  if (!normalizedPhone || !normalizedPhone.startsWith('+961')) {
    return normalizedPhone;
  }

  const digits = normalizedPhone.substring(4); // Remove "+961"
  const operator = digits.substring(0, 2);
  const part1 = digits.substring(2, 5);
  const part2 = digits.substring(5, 8);

  switch (format) {
    case 'international':
      return `+961 ${operator} ${part1} ${part2}`;
    case 'local':
      return `0${operator} ${part1} ${part2}`;
    case 'friendly':
      return `(${operator}) ${part1}-${part2}`;
    default:
      return normalizedPhone;
  }
}

/**
 * Get operator name from phone number
 * @param {string} phoneNumber - Phone number (any format)
 * @returns {string|null} Operator name or null
 * 
 * @example
 * getOperatorName("+96170123456") // "Touch"
 * getOperatorName("81 123 456") // "Alfa"
 */
export function getOperatorName(phoneNumber) {
  const normalized = normalizeLebanesePhoneNumber(phoneNumber);
  if (!normalized) return null;

  const prefix = normalized.substring(4, 6); // Get operator prefix

  const operators = {
    '70': 'Touch',
    '71': 'Alfa',
    '76': 'Alfa',
    '78': 'Touch',
    '79': 'Touch',
    '81': 'Alfa'
  };

  return operators[prefix] || null;
}

/**
 * Test function to validate all examples
 * Run this in console to verify functionality
 */
export function testPhoneNormalization() {
  const testCases = [
    { input: "70 123 456", expected: "+96170123456" },
    { input: "70123456", expected: "+96170123456" },
    { input: "70-123-456", expected: "+96170123456" },
    { input: "70.123.456", expected: "+96170123456" },
    { input: "(70)123456", expected: "+96170123456" },
    { input: "+96170123456", expected: "+96170123456" },
    { input: "+961 70 123456", expected: "+96170123456" },
    { input: "+961-70-123-456", expected: "+96170123456" },
    { input: "0096170123456", expected: "+96170123456" },
    { input: "96170123456", expected: "+96170123456" },
    { input: "961 70 123 456", expected: "+96170123456" },
    { input: "00961 70 123456", expected: "+96170123456" },
    { input: "(+961) 70 123 456", expected: "+96170123456" },
    { input: "٠٧٠١٢٣٤٥٦", expected: "+96170123456" },
    { input: "071123456", expected: "+96171123456" },
    { input: "(81) 999-888", expected: "+96181999888" },
    { input: "078 555 444", expected: "+96178555444" },
    // Invalid cases
    { input: "12345", expected: null },
    { input: "75123456", expected: null },
    { input: "+1234567890", expected: null },
    { input: "65123456", expected: null },
    { input: "", expected: null },
    { input: "abcd", expected: null }
  ];

  console.log("🧪 Testing Lebanese Phone Number Normalization\n");
  
  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected }) => {
    const result = normalizeLebanesePhoneNumber(input);
    const status = result === expected ? "✅" : "❌";
    
    if (result === expected) {
      passed++;
    } else {
      failed++;
      console.log(`${status} Input: "${input}"`);
      console.log(`   Expected: ${expected}`);
      console.log(`   Got: ${result}\n`);
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed (${testCases.length} total)`);
  
  return { passed, failed, total: testCases.length };
}

// Export all functions
export default {
  normalizeLebanesePhoneNumber,
  isValidLebanesePhoneNumber,
  formatPhoneNumber,
  getOperatorName,
  testPhoneNormalization
};
