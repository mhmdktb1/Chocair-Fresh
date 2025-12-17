/**
 * ==========================================
 * LEBANESE PHONE NUMBER UTILITIES (Frontend)
 * ==========================================
 */

/**
 * Map of Arabic digits to Western digits
 */
const ARABIC_TO_WESTERN = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

/**
 * Convert Arabic/Indic digits to Western digits
 */
export function convertArabicToWestern(input) {
  return input.replace(/[٠-٩]/g, (digit) => ARABIC_TO_WESTERN[digit] || digit);
}

/**
 * Remove all non-digit characters except leading +
 */
export function cleanPhoneNumber(input) {
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
 * Supports:
 * - 8-digit mobile numbers (70, 71, 76, 78, 79, 81) -> +961 70 123456
 * - 7-digit mobile/landline numbers (03, 01, 04, etc) -> +961 3 123456
 */
export function normalizeLebanesePhoneNumber(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  let cleaned = cleanPhoneNumber(input.trim());
  
  if (!cleaned) {
    return null;
  }

  // Remove international prefix if present
  if (cleaned.startsWith('+961')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('00961')) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith('961')) {
    cleaned = cleaned.substring(3);
  }

  // Handle leading zero
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Check length
  // 8 digits: 70, 71, 76, etc.
  // 7 digits: 3 (03), 1 (01), etc.
  if (cleaned.length !== 7 && cleaned.length !== 8) {
    return null;
  }

  return `+961${cleaned}`;
}

/**
 * Format phone number for display
 * e.g. +96170123456 -> +961 70 123 456
 */
export function formatPhoneNumber(input) {
  const normalized = normalizeLebanesePhoneNumber(input);
  if (!normalized) return input;

  const number = normalized.substring(4); // Remove +961
  
  if (number.length === 8) {
    // 70 123 456
    return `+961 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
  } else if (number.length === 7) {
    // 3 123 456
    return `+961 ${number.substring(0, 1)} ${number.substring(1, 4)} ${number.substring(4)}`;
  }
  
  return normalized;
}
