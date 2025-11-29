# Lebanese Phone Number Normalization System

## Overview

This system provides comprehensive support for Lebanese phone numbers in the Chocair Fresh application, accepting **all common Lebanese phone number formats** and automatically normalizing them to the international standard format `+961XXXXXXXX`.

## Supported Formats

The system accepts and normalizes the following formats:

### Standard Local Formats
```javascript
"70 123 456"        // Spaced
"70123456"          // Compact
"70-123-456"        // Dashed
"70.123.456"        // Dotted
"(70)123456"        // Parentheses
"(70) 123-456"      // Mixed symbols
```

### Local Format with Leading Zero
```javascript
"070123456"         // Touch operator
"071123456"         // Alfa operator
"076888999"         // Alfa operator
"078555444"         // Touch operator
"079666777"         // Touch operator
"081999888"         // Alfa operator
```

### International Formats
```javascript
"+96170123456"           // Standard international
"+961 70 123456"         // International with spaces
"+961-70-123-456"        // International with dashes
"+961(70)123456"         // International with parentheses
"(+961) 70 123 456"      // Fancy international format
```

### 00961 Prefix Format
```javascript
"0096170123456"          // Double-zero prefix
"00961 70 123456"        // Double-zero with spaces
"00961-70-123-456"       // Double-zero with dashes
```

### 961 Without Prefix
```javascript
"96170123456"            // Country code without +
"961 70 123 456"         // Country code with spaces
```

### Arabic Digits (٠-٩)
```javascript
"٠٧٠١٢٣٤٥٦"           // Arabic digits
"٠٧١١٢٣٤٥٦"           // Arabic Alfa number
"+٩٦١٧٠١٢٣٤٥٦"       // Arabic with +
```

**All formats above normalize to:** `+96170123456`

## Valid Operator Prefixes

Only the following Lebanese mobile operator prefixes are accepted:

| Prefix | Operator | Network  |
|--------|----------|----------|
| 70     | Touch    | Mobile   |
| 71     | Alfa     | Mobile   |
| 76     | Alfa     | Mobile   |
| 78     | Touch    | Mobile   |
| 79     | Touch    | Mobile   |
| 81     | Alfa     | Mobile   |

Numbers with other prefixes (e.g., 75, 65, 12) will be rejected.

## Implementation

### Frontend (React)

**File:** `src/utils/phoneUtils.js`

```javascript
import { normalizeLebanesePhoneNumber, formatPhoneNumber } from '../utils/phoneUtils';

// Normalize user input
const normalized = normalizeLebanesePhoneNumber("70 123 456");
// Returns: "+96170123456" or null if invalid

// Format for display
const friendly = formatPhoneNumber("+96170123456", "friendly");
// Returns: "(70) 123-456"
```

**Key Functions:**

1. **`normalizeLebanesePhoneNumber(input)`**
   - Accepts any supported format
   - Returns `+961XXXXXXXX` or `null` if invalid
   - Handles Arabic digits, spaces, symbols

2. **`isValidLebanesePhoneNumber(input)`**
   - Returns `true` if valid Lebanese number
   - Returns `false` otherwise

3. **`formatPhoneNumber(normalizedPhone, format)`**
   - `'international'` → `+961 70 123 456`
   - `'local'` → `070 123 456`
   - `'friendly'` → `(70) 123-456`

4. **`getOperatorName(phoneNumber)`**
   - Returns `'Touch'` or `'Alfa'`

### Backend (Node.js)

**File:** `backend/utils/phoneUtils.js`

```javascript
import { normalizeLebanesePhoneNumber } from './utils/phoneUtils.js';

// In controller
export const sendPhoneOTP = asyncHandler(async (req, res) => {
  let { phone } = req.body;
  
  // Normalize before processing
  const normalizedPhone = normalizeLebanesePhoneNumber(phone);
  
  if (!normalizedPhone) {
    res.status(400);
    throw new Error('Please provide a valid Lebanese mobile number');
  }
  
  phone = normalizedPhone;
  // Continue with normalized phone...
});
```

## Integration Points

### 1. LoginPhone Component (`src/pages/LoginPhone.jsx`)

The phone input automatically normalizes user input before sending to backend:

```javascript
const handlePhoneSubmit = async (e) => {
  e.preventDefault();
  
  // Normalize Lebanese phone number
  const normalizedPhone = normalizeLebanesePhoneNumber(phone);
  
  if (!normalizedPhone) {
    setError('Please enter a valid Lebanese mobile number (e.g., 70 123 456)');
    return;
  }
  
  // Use normalized phone
  await sendPhoneOTP(normalizedPhone);
};
```

### 2. Backend Controllers (`backend/controllers/userController.js`)

All phone verification endpoints normalize input:

- `sendPhoneOTP()` - Send OTP
- `verifyPhoneOTP()` - Verify OTP and login
- `resendOTP()` - Resend OTP

### 3. User Model (`backend/models/userModel.js`)

Phone field configuration:

```javascript
phone: {
  type: String,
  required: function() {
    return !this.email;  // Required if no email
  },
  unique: true,
  sparse: true,  // Allow multiple null values
  trim: true
}
```

## Testing

### Frontend Tests

**File:** `src/utils/phoneUtils.test.js`

Run in browser console:
```javascript
import { testPhoneNormalization } from './utils/phoneUtils';
testPhoneNormalization();
```

### Backend Tests

**File:** `backend/test-phone-normalization.js`

```bash
node backend/test-phone-normalization.js
```

**Expected Output:**
```
🎉 All tests passed! Phone normalization is working perfectly.
📊 RESULTS:
   Normalization: 37/37 passed
   Validation: 5/5 passed
   Total: 42/42 passed
```

### Integration Tests

**File:** `backend/test-phone-auth.js`

```bash
node backend/test-phone-auth.js
```

Tests complete OTP flow with normalized numbers.

## Examples

### Valid Inputs

All these inputs produce `+96170123456`:

```javascript
normalizeLebanesePhoneNumber("70 123 456");          // ✅ +96170123456
normalizeLebanesePhoneNumber("70123456");            // ✅ +96170123456
normalizeLebanesePhoneNumber("+961 70 123456");      // ✅ +96170123456
normalizeLebanesePhoneNumber("0096170123456");       // ✅ +96170123456
normalizeLebanesePhoneNumber("(70) 123-456");        // ✅ +96170123456
normalizeLebanesePhoneNumber("٠٧٠١٢٣٤٥٦");         // ✅ +96170123456
```

### Invalid Inputs

These return `null`:

```javascript
normalizeLebanesePhoneNumber("12345");               // ❌ Too short
normalizeLebanesePhoneNumber("75123456");            // ❌ Invalid prefix
normalizeLebanesePhoneNumber("+1234567890");         // ❌ Wrong country
normalizeLebanesePhoneNumber("abcdefgh");            // ❌ Not a number
```

## User Experience

### Phone Input Field

The UI provides helpful guidance:

```jsx
<input
  type="tel"
  placeholder="70 123 456 or +961 70 123 456"
/>
<small className="input-hint">
  Accepts: 70 123 456, +96170123456, 00961 70 123456, etc.
</small>
```

### Error Messages

Clear validation feedback:

- **Valid input:** `OTP sent to (70) 123-456`
- **Invalid format:** `Please enter a valid Lebanese mobile number (e.g., 70 123 456)`
- **Invalid prefix:** `Invalid operator prefix. Must be 70, 71, 76, 78, 79, or 81`

## Algorithm Details

### Normalization Process

1. **Clean Input**
   - Convert Arabic digits (٠-٩) to Western (0-9)
   - Remove all non-digit characters except leading `+`
   - Trim whitespace

2. **Detect Format**
   - `00961XXXXXXXX` → Strip `00961`, keep 8 digits
   - `961XXXXXXXX` → Strip `961`, keep 8 digits
   - `+961XXXXXXXX` → Strip `+961`, keep 8 digits
   - `0XXXXXXXX` → Strip `0`, keep 8 digits (local format)
   - `XXXXXXXX` → Use as-is (8 digits)

3. **Validate**
   - Ensure exactly 8 digits
   - Check operator prefix (70, 71, 76, 78, 79, 81)
   - All digits must be numeric

4. **Return**
   - Success: `+961XXXXXXXX`
   - Failure: `null`

## Production Considerations

### Remove Development Features

Before production, remove OTP display:

```javascript
// In backend/controllers/userController.js
res.status(200).json({
  success: true,
  data: {
    phone,
    expiresIn: 300,
    // REMOVE THIS LINE IN PRODUCTION:
    otp: process.env.NODE_ENV === 'development' ? otp : undefined
  }
});
```

### Implement Real SMS

Replace simulation with actual SMS service:

```javascript
// Using Twilio, AWS SNS, or similar
import twilioClient from './config/twilio';

await twilioClient.messages.create({
  body: `Your Chocair Fresh verification code is: ${otp}`,
  to: phone,
  from: process.env.TWILIO_PHONE_NUMBER
});
```

### Add Rate Limiting

Protect against abuse:

```javascript
// Using express-rate-limit
import rateLimit from 'express-rate-limit';

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many OTP requests. Please try again later.'
});

router.post('/verify-phone', otpLimiter, sendPhoneOTP);
```

### Use Redis for OTP Storage

Replace in-memory Map:

```javascript
import redis from 'redis';
const redisClient = redis.createClient();

// Store OTP
await redisClient.setEx(`otp:${phone}`, 300, JSON.stringify(otpData));

// Retrieve OTP
const otpData = JSON.parse(await redisClient.get(`otp:${phone}`));
```

## Troubleshooting

### Issue: "Invalid Lebanese mobile number"

**Cause:** Number doesn't match any supported format or has invalid prefix

**Solution:** 
- Check operator prefix (must be 70, 71, 76, 78, 79, 81)
- Ensure 8 digits after country code
- Remove any letters or invalid characters

### Issue: "OTP not found or expired"

**Cause:** OTP expired (5 minute limit) or never generated

**Solution:**
- Click "Resend OTP"
- Ensure phone number is the same
- Check server logs for OTP generation

### Issue: Phone number not normalizing

**Cause:** Utility functions not imported correctly

**Solution:**
```javascript
// Correct import
import { normalizeLebanesePhoneNumber } from '../utils/phoneUtils';

// NOT
import normalizeLebanesePhoneNumber from '../utils/phoneUtils';
```

## API Reference

### Frontend API

```typescript
// Normalize phone number
normalizeLebanesePhoneNumber(input: string): string | null

// Validate phone number
isValidLebanesePhoneNumber(input: string): boolean

// Format for display
formatPhoneNumber(
  normalizedPhone: string,
  format: 'international' | 'local' | 'friendly'
): string

// Get operator name
getOperatorName(phoneNumber: string): 'Touch' | 'Alfa' | null

// Run test suite
testPhoneNormalization(): { passed: number, failed: number, total: number }
```

### Backend API

```typescript
// Normalize phone number (backend)
normalizeLebanesePhoneNumber(input: string): string | null

// Validate phone number (backend)
isValidLebanesePhoneNumber(input: string): boolean
```

## References

- [Lebanese Telephone Numbers (Wikipedia)](https://en.wikipedia.org/wiki/Telephone_numbers_in_Lebanon)
- [ITU E.164 Standard](https://www.itu.int/rec/T-REC-E.164/)
- Lebanon Country Code: +961
- Mobile Operators: Touch (MIC1), Alfa (MIC2)

## Version History

- **v1.0.0** (2025-11-07)
  - Initial implementation
  - Support for all Lebanese mobile formats
  - Arabic digit conversion
  - Operator prefix validation
  - Full test coverage (42 tests)
  - Frontend and backend integration

---

**Maintained by:** Chocair Fresh Development Team  
**Last Updated:** November 7, 2025
