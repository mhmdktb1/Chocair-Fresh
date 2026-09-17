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
  if (!input) return '';
  const normalized = normalizeLebanesePhoneNumber(input);
  if (normalized) {
    const number = normalized.substring(4); // Remove +961
    if (number.length === 7) {
      return `+961 ${number.substring(0, 1)} ${number.substring(1, 4)} ${number.substring(4)}`;
    }
    return `+961 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
  }
  return input;
}

/**
 * Validate and normalize any phone number based on selected country or direct international input
 * Returns { isValid: boolean, normalized: string|null, error: string|null }
 */
export function validateAndNormalizePhone(rawPhone, country = { code: 'LB', dialCode: '+961', name: 'Lebanon' }) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalized: null, error: 'Please enter your phone number.' };
  }

  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return { isValid: false, normalized: null, error: 'Please enter your phone number.' };
  }

  // Handle direct full international format with leading '+'
  if (trimmed.startsWith('+')) {
    const cleanIntl = '+' + cleanPhoneNumber(trimmed).replace(/\D/g, '');
    if (cleanIntl.startsWith('+961')) {
      const leb = normalizeLebanesePhoneNumber(cleanIntl);
      if (leb) {
        return { isValid: true, normalized: leb, error: null };
      }
      return { 
        isValid: false, 
        normalized: null, 
        error: 'Please enter a valid Lebanese phone number (e.g., 70 123 456 or 03 123 456).' 
      };
    }
    
    // For other international codes starting with '+'
    const digitsOnly = cleanIntl.substring(1);
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      return { isValid: true, normalized: cleanIntl, error: null };
    }
    return { isValid: false, normalized: null, error: 'Please enter a valid international phone number.' };
  }

  // 1. If selected country is Lebanon
  if (!country || country.code === 'LB' || country.dialCode === '+961') {
    const lebNorm = normalizeLebanesePhoneNumber(trimmed);
    if (lebNorm) {
      return { isValid: true, normalized: lebNorm, error: null };
    }
    return { 
      isValid: false, 
      normalized: null, 
      error: 'Please enter a valid Lebanese phone number (e.g., 70 123 456 or 03 123 456).' 
    };
  }

  // 2. For any other selected country (e.g. UAE, Saudi Arabia, France, USA, etc.)
  let cleanDigits = cleanPhoneNumber(trimmed).replace(/\D/g, '');
  
  // If user pasted/typed with dial code prefix included (e.g., entered 971501234567 for UAE)
  const dialCodeDigits = (country.dialCode || '').replace(/\D/g, '');
  if (dialCodeDigits && cleanDigits.startsWith(dialCodeDigits)) {
    cleanDigits = cleanDigits.substring(dialCodeDigits.length);
  }

  // Remove leading zeros (e.g. 050 -> 50)
  cleanDigits = cleanDigits.replace(/^0+/, '');

  // International subscriber numbers are strictly between 6 and 14 digits
  if (cleanDigits.length < 6 || cleanDigits.length > 14) {
    return { 
      isValid: false, 
      normalized: null, 
      error: `Please enter a valid phone number for ${country.name || 'the selected country'}.` 
    };
  }

  const normalized = `${country.dialCode}${cleanDigits}`;
  return { isValid: true, normalized, error: null };
}
