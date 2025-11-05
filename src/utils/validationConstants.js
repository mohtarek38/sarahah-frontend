/**
 * Validation constants matching backend validation rules
 * These should be kept in sync with backend Commons
 */

// Gender enum
export const genderEnum = {
  FEMALE: "female",
  MALE: "male",
};

// Age limits
export const ageLimits = {
  MIN_AGE: 13,
  MAX_AGE: 120,
};

// Name limits
export const nameLimits = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 30,
};

// Bio limits
export const bioLimits = {
  MAX_BIO_LENGTH: 250,
};

// Password limits
export const passwordLimits = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 30,
};

// Message limits
export const messageLimits = {
  MAX_MESSAGE_LENGTH: 500,
};

// Phone number pattern
export const phonePattern = /^\d{11}$/;

// Password pattern - must contain at least one uppercase, lowercase, number, and special character
export const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Email pattern (basic validation)
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gender options for UI dropdowns
export const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];
