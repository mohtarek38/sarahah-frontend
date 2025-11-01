# Validation System

This directory contains a scalable validation system that mirrors the backend Joi validation schemas.

## Files Structure

```
utils/
├── validationConstants.js  - All validation constants (enums, limits, patterns)
├── validation.js           - Main validation functions
└── validators.js           - Legacy re-exports (for backwards compatibility)
```

## Usage Examples

### Individual Field Validation

```javascript
import { validateEmail, validatePassword, validateAge } from "./utils/validation";

// Validate email
const emailResult = validateEmail("user@example.com");
if (!emailResult.valid) {
  console.error(emailResult.error);
}

// Validate password
const passwordResult = validatePassword("MyP@ssw0rd");
if (!passwordResult.valid) {
  console.error(passwordResult.error);
}

// Validate age
const ageResult = validateAge(25);
if (!ageResult.valid) {
  console.error(ageResult.error);
}
```

### Form Validation

```javascript
import { validateSignupForm, validateLoginForm } from "./utils/validation";

// Validate entire signup form
const signupData = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "SecureP@ss123",
  confirmPassword: "SecureP@ss123",
  age: 25,
  gender: "male",
  phoneNumber: "12345678901",
};

const result = validateSignupForm(signupData);
if (!result.valid) {
  console.log("Validation errors:", result.errors);
  // errors = { firstName: 'error message', email: 'error message', ... }
}
```

### Generic Field Validator

```javascript
import { validateField } from "./utils/validation";

// Automatically routes to correct validator based on field name
const result = validateField("email", "user@example.com");
const result2 = validateField("age", 25);
const result3 = validateField("phoneNumber", "12345678901");
```

### Using Constants

```javascript
import { ageLimits, nameLimits, passwordLimits, genderEnum, phonePattern } from "./utils/validationConstants";

// Use in UI
<input type="number" min={ageLimits.MIN_AGE} max={ageLimits.MAX_AGE} />;

// Use in logic
if (age < ageLimits.MIN_AGE) {
  // handle error
}

// Check enum values
const validGenders = Object.values(genderEnum); // ['male', 'female']
```

## Backend Sync

These validators match the backend Joi schemas:

### Backend → Frontend Mapping

| Backend Schema      | Frontend Validator      |
| ------------------- | ----------------------- |
| `signUpSchema`      | `validateSignupForm()`  |
| `messageSchema`     | `validateMessage()`     |
| Email validation    | `validateEmail()`       |
| Password validation | `validatePassword()`    |
| Name validation     | `validateName()`        |
| Age validation      | `validateAge()`         |
| Gender validation   | `validateGender()`      |
| Phone validation    | `validatePhoneNumber()` |
| Bio validation      | `validateBio()`         |

### Constants Sync

| Backend Constant   | Frontend Constant                        |
| ------------------ | ---------------------------------------- |
| `ageLimits`        | `ageLimits`                              |
| `nameLimits`       | `nameLimits`                             |
| `bioLimits`        | `bioLimits`                              |
| `passwordLimits`   | `passwordLimits` (8-30 chars)            |
| `maxMessageLength` | `messageLimits.MAX_MESSAGE_LENGTH` (500) |
| `genderEnum`       | `genderEnum`                             |
| Phone pattern      | `phonePattern` (/^\d{11}$/)              |
| Password pattern   | `passwordPattern`                        |

## Available Validators

### `validateEmail(email)`

- Required
- Must be valid email format
- Automatically trimmed and lowercased

### `validatePassword(password)`

- Required
- 8-30 characters
- Must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%\*?&)

### `validateConfirmPassword(password, confirmPassword)`

- Must match original password

### `validateName(name, fieldName)`

- Required
- 3-30 characters
- Alphanumeric only (letters and numbers)
- `fieldName` parameter for custom error messages

### `validateAge(age)`

- Required
- Integer only
- Between 13-120

### `validateGender(gender)`

- Required
- Must be 'male' or 'female'

### `validatePhoneNumber(phoneNumber)`

- Required
- Exactly 11 digits

### `validateBio(bio)`

- Optional (empty is valid)
- Max 250 characters

### `validateMessage(content)`

- Required
- Max 500 characters

## Validation Result Format

All validators return:

```javascript
{
  valid: boolean,
  error?: string  // Only present if valid is false
}
```

Form validators return:

```javascript
{
  valid: boolean,
  errors: {
    fieldName: 'error message',
    // ... more fields
  }
}
```

## Adding New Validators

### Step 1: Add Constants

```javascript
// In validationConstants.js
export const newFieldLimits = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 100,
};
```

### Step 2: Create Validator

```javascript
// In validation.js
export const validateNewField = (value) => {
  if (!value || value.trim() === "") {
    return { valid: false, error: "Field is required" };
  }

  if (value.length < newFieldLimits.MIN_LENGTH) {
    return { valid: false, error: `Minimum ${newFieldLimits.MIN_LENGTH} characters` };
  }

  return { valid: true };
};
```

### Step 3: Add to Generic Validator

```javascript
// In validation.js - validateField() function
case "newField":
  return validateNewField(value);
```

### Step 4: Export from validators.js (if needed for backwards compatibility)

```javascript
// In validators.js
export { validateNewField } from "./validation";
```

## Integration with Existing Code

The validation system is already integrated with:

- ✅ `useProfile.js` hook - Uses `validateField()` for profile updates
- ✅ `EditableField` component - Uses validators for inline validation
- ✅ `config.js` - Re-exports all constants

To integrate with other components:

```javascript
import { validateField } from "../utils/validation";

const handleSubmit = () => {
  const result = validateField("email", emailValue);
  if (!result.valid) {
    setError(result.error);
    return;
  }
  // Proceed with submission
};
```

## Testing

Test validators match backend validation:

```javascript
import { validatePassword } from "./utils/validation";

// Should fail - no special character
expect(validatePassword("Password123")).toEqual({
  valid: false,
  error: expect.stringContaining("special character"),
});

// Should pass
expect(validatePassword("P@ssw0rd123")).toEqual({
  valid: true,
});
```

## Maintenance

When backend validation changes:

1. Update constants in `validationConstants.js`
2. Update corresponding validator in `validation.js`
3. Update this README
4. Test the changes match backend behavior
