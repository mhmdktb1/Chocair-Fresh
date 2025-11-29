/**
 * ==========================================
 * PHONE UTILS TEST (Backend)
 * ==========================================
 * 
 * Run: node backend/test-phone-normalization.js
 */

import { normalizeLebanesePhoneNumber, isValidLebanesePhoneNumber } from './utils/phoneUtils.js';

console.log('🧪 Testing Lebanese Phone Number Normalization (Backend)\n');
console.log('═══════════════════════════════════════════════════════\n');

// Test cases
const tests = [
  // Standard formats
  { input: "70 123 456", expected: "+96170123456", desc: "Spaced format" },
  { input: "70123456", expected: "+96170123456", desc: "Compact 8 digits" },
  { input: "70-123-456", expected: "+96170123456", desc: "Dashed format" },
  { input: "70.123.456", expected: "+96170123456", desc: "Dotted format" },
  { input: "(70)123456", expected: "+96170123456", desc: "Parentheses" },
  { input: "(70) 123-456", expected: "+96170123456", desc: "Mixed symbols" },
  
  // International formats
  { input: "+96170123456", expected: "+96170123456", desc: "Already normalized" },
  { input: "+961 70 123456", expected: "+96170123456", desc: "International + spaces" },
  { input: "+961-70-123-456", expected: "+96170123456", desc: "International + dashes" },
  { input: "+961(70)123456", expected: "+96170123456", desc: "International + parens" },
  { input: "(+961) 70 123 456", expected: "+96170123456", desc: "Fancy international" },
  
  // 00961 format
  { input: "0096170123456", expected: "+96170123456", desc: "00961 prefix" },
  { input: "00961 70 123456", expected: "+96170123456", desc: "00961 with spaces" },
  { input: "00961-70-123-456", expected: "+96170123456", desc: "00961 with dashes" },
  
  // 961 without + or 00
  { input: "96170123456", expected: "+96170123456", desc: "961 without +" },
  { input: "961 70 123 456", expected: "+96170123456", desc: "961 with spaces" },
  
  // Local format with leading 0
  { input: "070123456", expected: "+96170123456", desc: "Local 070 format" },
  { input: "071123456", expected: "+96171123456", desc: "Local 071 format" },
  { input: "076888999", expected: "+96176888999", desc: "Local 076 format" },
  { input: "078555444", expected: "+96178555444", desc: "Local 078 format" },
  { input: "079666777", expected: "+96179666777", desc: "Local 079 format" },
  { input: "081999888", expected: "+96181999888", desc: "Local 081 format" },
  
  // Arabic digits
  { input: "٠٧٠١٢٣٤٥٦", expected: "+96170123456", desc: "Arabic digits" },
  { input: "٠٧١١٢٣٤٥٦", expected: "+96171123456", desc: "Arabic Alfa" },
  { input: "+٩٦١٧٠١٢٣٤٥٦", expected: "+96170123456", desc: "Arabic with +" },
  
  // Edge cases with whitespace
  { input: "  70 123 456  ", expected: "+96170123456", desc: "Extra whitespace" },
  { input: "\t70123456\n", expected: "+96170123456", desc: "Tabs and newlines" },
  
  // Invalid cases (should return null)
  { input: "12345", expected: null, desc: "Too short" },
  { input: "75123456", expected: null, desc: "Invalid prefix 75" },
  { input: "65123456", expected: null, desc: "Invalid prefix 65" },
  { input: "12345678", expected: null, desc: "Invalid prefix 12" },
  { input: "+1234567890", expected: null, desc: "Wrong country code" },
  { input: "", expected: null, desc: "Empty string" },
  { input: "abcdefgh", expected: null, desc: "Letters" },
  { input: "123456789", expected: null, desc: "9 digits invalid" },
  { input: "961", expected: null, desc: "Just country code" },
  { input: "+96200123456", expected: null, desc: "Invalid operator 00" },
];

let passed = 0;
let failed = 0;
const failures = [];

console.log('📋 Running Normalization Tests:\n');

tests.forEach(({ input, expected, desc }, index) => {
  const result = normalizeLebanesePhoneNumber(input);
  const isPass = result === expected;
  
  if (isPass) {
    passed++;
    console.log(`✅ Test ${index + 1}: ${desc}`);
    if (expected !== null) {
      console.log(`   Input: "${input}" → Output: "${result}"`);
    }
  } else {
    failed++;
    failures.push({ input, expected, result, desc });
    console.log(`❌ Test ${index + 1}: ${desc}`);
    console.log(`   Input: "${input}"`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Got: ${result}`);
  }
  console.log('');
});

// Test validation function
console.log('\n📋 Testing Validation Function:\n');

const validationTests = [
  { input: "70 123 456", expected: true },
  { input: "+96170123456", expected: true },
  { input: "071123456", expected: true },
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

// Summary
console.log('\n═══════════════════════════════════════════════════════');
console.log(`\n📊 RESULTS:`);
console.log(`   Normalization: ${passed}/${tests.length} passed`);
console.log(`   Validation: ${validationPassed}/${validationTests.length} passed`);
console.log(`   Total: ${passed + validationPassed}/${tests.length + validationTests.length} passed`);
console.log(`   Failed: ${failed + (validationTests.length - validationPassed)}`);

if (failures.length > 0) {
  console.log('\n❌ Failed Tests:');
  failures.forEach(({ input, expected, result, desc }) => {
    console.log(`   - ${desc}: "${input}"`);
    console.log(`     Expected: ${expected}, Got: ${result}`);
  });
}

if (failed === 0 && validationPassed === validationTests.length) {
  console.log('\n🎉 All tests passed! Phone normalization is working perfectly.');
} else {
  console.log(`\n⚠️  ${failed + (validationTests.length - validationPassed)} test(s) failed.`);
}

console.log('\n═══════════════════════════════════════════════════════\n');

// Example usage
console.log('💡 Example Usage:\n');
console.log('const normalized = normalizeLebanesePhoneNumber("70 123 456");');
console.log(`Result: ${normalizeLebanesePhoneNumber("70 123 456")}\n`);

console.log('const isValid = isValidLebanesePhoneNumber("75 123 456");');
console.log(`Result: ${isValidLebanesePhoneNumber("75 123 456")} (invalid prefix)\n`);

console.log('const isValid2 = isValidLebanesePhoneNumber("+961 70 123 456");');
console.log(`Result: ${isValidLebanesePhoneNumber("+961 70 123 456")} (valid)\n`);
