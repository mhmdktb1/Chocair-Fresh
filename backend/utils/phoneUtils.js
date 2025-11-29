/**
 * ==========================================
 * LEBANESE PHONE NUMBER UTILITIES (Backend)
 * ==========================================
 * 
 * Node.js version for backend validation
 */

/**
 * Map of Arabic digits to Western digits
 */
const ARABIC_TO_WESTERN = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

/**
 * Valid Lebanese mobile operator prefixes
 */
const VALID_OPERATOR_PREFIXES = ['70', '71', '76', '78', '79', '81'];

/**
 * Convert Arabic/Indic digits to Western digits
 */
function convertArabicToWestern(input) {
  return input.replace(/[٠-٩]/g, (digit) => ARABIC_TO_WESTERN[digit] || digit);
}

/**
 * Remove all non-digit characters except leading +
 */
function cleanPhoneNumber(input) {
  let cleaned = convertArabicToWestern(input);
  cleaned = cleaned.replace(/[^\d+]/g, '');
  
  if (cleaned.includes('+')) {
    const parts = cleaned.split('+');
    cleaned = '+' + parts.join('');
  }
  
  return cleaned;
}

/**
 * Normalize Lebanese phone number to international format
 * 
 * @param {string} input - Phone number in any supported format
 * @returns {string|null} Normalized phone number (+961XXXXXXXX) or null if invalid
 * 
 * @example
 * normalizeLebanesePhoneNumber("70 123 456") // "+96170123456"
 * normalizeLebanesePhoneNumber("+961 70 123456") // "+96170123456"
 * normalizeLebanesePhoneNumber("٠٧٠١٢٣٤٥٦") // "+96170123456"
 */
function normalizeLebanesePhoneNumber(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  let cleaned = cleanPhoneNumber(input.trim());
  
  if (!cleaned) {
    return null;
  }

  const hasPlus = cleaned.startsWith('+');
  if (hasPlus) {
    cleaned = cleaned.substring(1);
  }

  let mobileNumber = '';

  if (cleaned.startsWith('00961')) {
    mobileNumber = cleaned.substring(5);
  } else if (cleaned.startsWith('961')) {
    mobileNumber = cleaned.substring(3);
  } else if (cleaned.startsWith('0') && cleaned.length >= 8) {
    mobileNumber = cleaned.substring(1);
  } else if (cleaned.length === 8) {
    mobileNumber = cleaned;
  } else {
    return null;
  }

  if (mobileNumber.length !== 8) {
    return null;
  }

  const operatorPrefix = mobileNumber.substring(0, 2);
  if (!VALID_OPERATOR_PREFIXES.includes(operatorPrefix)) {
    return null;
  }

  if (!/^\d{8}$/.test(mobileNumber)) {
    return null;
  }

  return `+961${mobileNumber}`;
}

/**
 * Validate if a string is a valid Lebanese phone number
 */
function isValidLebanesePhoneNumber(input) {
  return normalizeLebanesePhoneNumber(input) !== null;
}

export {
  normalizeLebanesePhoneNumber,
  isValidLebanesePhoneNumber
};
