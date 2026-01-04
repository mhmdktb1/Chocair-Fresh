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
 * - 8-digit mobile numbers (70, 71, 76, 78, 79, 81, 03) -> +961 70 123456
 * - Must be exactly 8 digits without 961 prefix
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

  // Check length - must be exactly 8 digits (or 7 for 03 numbers)
  if (cleaned.length !== 8 && cleaned.length !== 7) {
    return null;
  }

  // Handle 03 numbers (which become 7 digits starting with 3)
  if (cleaned.length === 7) {
    if (cleaned.startsWith('3')) {
       return `+961${cleaned}`;
    }
    return null;
  }

  // Validate first two digits (valid Lebanese mobile prefixes)
  const prefix = cleaned.substring(0, 2);
  const validPrefixes = ['70', '71', '76', '78', '79', '81'];
  if (!validPrefixes.includes(prefix)) {
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
  
  // All numbers are 8 digits: 70 123 456
  return `+961 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
}
