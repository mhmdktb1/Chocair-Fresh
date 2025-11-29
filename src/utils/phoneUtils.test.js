/**
 * ==========================================
 * PHONE UTILS - TEST FILE
 * ==========================================
 * 
 * Run this in browser console or with Node.js to test
 * Lebanese phone number normalization.
 */

import { 
  normalizeLebanesePhoneNumber, 
  isValidLebanesePhoneNumber,
  formatPhoneNumber,
  getOperatorName 
} from './phoneUtils.js';

console.log('🧪 Starting Lebanese Phone Number Tests...\n');

// ==========================================
// TEST SUITE 1: NORMALIZATION
// ==========================================

console.log('📋 TEST SUITE 1: Normalization\n');

const normalizationTests = [
  // Standard formats
  { input: "70 123 456", expected: "+96170123456", description: "Spaced format" },
  { input: "70123456", expected: "+96170123456", description: "Compact format" },
  { input: "70-123-456", expected: "+96170123456", description: "Dashed format" },
  { input: "70.123.456", expected: "+96170123456", description: "Dotted format" },
  { input: "(70)123456", expected: "+96170123456", description: "Parentheses format" },
  
  // International formats
  { input: "+96170123456", expected: "+96170123456", description: "International + format" },
  { input: "+961 70 123456", expected: "+96170123456", description: "International + with spaces" },
  { input: "+961-70-123-456", expected: "+96170123456", description: "International + with dashes" },
  { input: "0096170123456", expected: "+96170123456", description: "International 00 format" },
  { input: "96170123456", expected: "+96170123456", description: "Without country code" },
  { input: "961 70 123 456", expected: "+96170123456", description: "961 with spaces" },
  { input: "00961 70 123456", expected: "+96170123456", description: "00961 with spaces" },
  { input: "(+961) 70 123 456", expected: "+96170123456", description: "Fancy international format" },
  
  // Local format with leading zero
  { input: "070123456", expected: "+96170123456", description: "Local with leading 0" },
  { input: "071123456", expected: "+96171123456", description: "Alfa local format" },
  { input: "081999888", expected: "+96181999888", description: "Alfa 81 prefix" },
  
  // Different operators
  { input: "78 555 444", expected: "+96178555444", description: "Touch 78 prefix" },
  { input: "79 666 777", expected: "+96179666777", description: "Touch 79 prefix" },
  { input: "76 888 999", expected: "+96176888999", description: "Alfa 76 prefix" },
  
  // Arabic digits
  { input: "٠٧٠١٢٣٤٥٦", expected: "+96170123456", description: "Arabic digits" },
  { input: "٠٧١١٢٣٤٥٦", expected: "+96171123456", description: "Arabic digits - Alfa" },
  { input: "+٩٦١٧٠١٢٣٤٥٦", expected: "+96170123456", description: "Arabic with +" },
  
  // Edge cases
  { input: "  70 123 456  ", expected: "+96170123456", description: "With whitespace" },
  { input: "(70) 123-456", expected: "+96170123456", description: "Mixed formatting" },
  { input: "+961(70)123-456", expected: "+96170123456", description: "Complex format" },
];

let passed = 0;
let failed = 0;

normalizationTests.forEach(({ input, expected, description }) => {
  const result = normalizeLebanesePhoneNumber(input);
  const status = result === expected ? "✅" : "❌";
  
  if (result === expected) {
    passed++;
    console.log(`${status} ${description}`);
  } else {
    failed++;
    console.log(`${status} ${description}`);
    console.log(`   Input: "${input}"`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Got: ${result}`);
  }
});

console.log(`\n📊 Normalization: ${passed}/${normalizationTests.length} passed\n`);

// ==========================================
// TEST SUITE 2: INVALID INPUTS
// ==========================================

console.log('📋 TEST SUITE 2: Invalid Inputs (should return null)\n');

const invalidTests = [
  { input: "12345", description: "Too short" },
  { input: "75123456", description: "Invalid operator prefix (75)" },
  { input: "65123456", description: "Invalid operator prefix (65)" },
  { input: "+1234567890", description: "Wrong country code" },
  { input: "", description: "Empty string" },
  { input: "abcdefgh", description: "Letters only" },
  { input: "12345678", description: "Invalid prefix (12)" },
  { input: "+96200123456", description: "Invalid operator (00)" },
  { input: "961", description: "Too short - just country code" },
  { input: "123456789", description: "9 digits - too long" },
];

let invalidPassed = 0;
let invalidFailed = 0;

invalidTests.forEach(({ input, description }) => {
  const result = normalizeLebanesePhoneNumber(input);
  const status = result === null ? "✅" : "❌";
  
  if (result === null) {
    invalidPassed++;
    console.log(`${status} ${description}`);
  } else {
    invalidFailed++;
    console.log(`${status} ${description} - Expected null, got: ${result}`);
  }
});

console.log(`\n📊 Invalid Inputs: ${invalidPassed}/${invalidTests.length} passed\n`);

// ==========================================
// TEST SUITE 3: VALIDATION FUNCTION
// ==========================================

console.log('📋 TEST SUITE 3: Validation Function\n');

const validationTests = [
  { input: "70 123 456", expected: true },
  { input: "+96170123456", expected: true },
  { input: "12345", expected: false },
  { input: "75123456", expected: false },
];

let validationPassed = 0;

validationTests.forEach(({ input, expected }) => {
  const result = isValidLebanesePhoneNumber(input);
  const status = result === expected ? "✅" : "❌";
  
  if (result === expected) {
    validationPassed++;
  }
  
  console.log(`${status} isValid("${input}") = ${result} (expected: ${expected})`);
});

console.log(`\n📊 Validation: ${validationPassed}/${validationTests.length} passed\n`);

// ==========================================
// TEST SUITE 4: FORMATTING
// ==========================================

console.log('📋 TEST SUITE 4: Phone Number Formatting\n');

const phone = "+96170123456";

console.log(`Original: ${phone}`);
console.log(`International: ${formatPhoneNumber(phone, 'international')}`);
console.log(`Local: ${formatPhoneNumber(phone, 'local')}`);
console.log(`Friendly: ${formatPhoneNumber(phone, 'friendly')}`);

// ==========================================
// TEST SUITE 5: OPERATOR DETECTION
// ==========================================

console.log('\n📋 TEST SUITE 5: Operator Detection\n');

const operatorTests = [
  { input: "70123456", expected: "Touch" },
  { input: "71123456", expected: "Alfa" },
  { input: "76123456", expected: "Alfa" },
  { input: "78123456", expected: "Touch" },
  { input: "79123456", expected: "Touch" },
  { input: "81123456", expected: "Alfa" },
];

let operatorPassed = 0;

operatorTests.forEach(({ input, expected }) => {
  const operator = getOperatorName(input);
  const status = operator === expected ? "✅" : "❌";
  
  if (operator === expected) {
    operatorPassed++;
  }
  
  console.log(`${status} ${input} → ${operator} (expected: ${expected})`);
});

console.log(`\n📊 Operator Detection: ${operatorPassed}/${operatorTests.length} passed\n`);

// ==========================================
// FINAL SUMMARY
// ==========================================

const totalTests = normalizationTests.length + invalidTests.length + validationTests.length + operatorTests.length;
const totalPassed = passed + invalidPassed + validationPassed + operatorPassed;
const totalFailed = failed + invalidFailed + (validationTests.length - validationPassed) + (operatorTests.length - operatorPassed);

console.log('═════════════════════════════════════════');
console.log(`✨ FINAL RESULTS: ${totalPassed}/${totalTests} tests passed`);
console.log(`   ✅ Passed: ${totalPassed}`);
console.log(`   ❌ Failed: ${totalFailed}`);
console.log('═════════════════════════════════════════\n');

if (totalFailed === 0) {
  console.log('🎉 All tests passed! Phone normalization is working correctly.');
} else {
  console.log(`⚠️  ${totalFailed} test(s) failed. Please review the output above.`);
}
