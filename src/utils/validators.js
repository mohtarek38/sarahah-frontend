import { ageLimits, nameLimits, bioLimits } from "../config/config";

/**
 * Validate age field
 * @param {string|number} value - The age value to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export const validateAge = (value) => {
  const ageNum = Number(value);
  if (isNaN(ageNum) || ageNum < ageLimits.MIN_AGE || ageNum > ageLimits.MAX_AGE) {
    return {
      valid: false,
      error: `Please enter a valid age between ${ageLimits.MIN_AGE} and ${ageLimits.MAX_AGE}`,
    };
  }
  return { valid: true };
};

/**
 * Validate name field (firstName or lastName)
 * @param {string} value - The name value to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export const validateName = (value) => {
  const trimmedValue = value.trim();
  if (trimmedValue.length < nameLimits.MIN_NAME_LENGTH || trimmedValue.length > nameLimits.MAX_NAME_LENGTH) {
    return {
      valid: false,
      error: `Name must be between ${nameLimits.MIN_NAME_LENGTH} and ${nameLimits.MAX_NAME_LENGTH} characters`,
    };
  }
  return { valid: true };
};

/**
 * Validate bio field
 * @param {string} value - The bio value to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export const validateBio = (value) => {
  if (value.length > bioLimits.MAX_BIO_LENGTH) {
    return {
      valid: false,
      error: `Bio must be ${bioLimits.MAX_BIO_LENGTH} characters or less`,
    };
  }
  return { valid: true };
};

/**
 * Validate field based on field type
 * @param {string} fieldName - The field name (age, firstName, lastName, bio, etc.)
 * @param {any} value - The value to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case "age":
      return validateAge(value);
    case "firstName":
    case "lastName":
      return validateName(value);
    case "bio":
      return validateBio(value);
    default:
      return { valid: true };
  }
};
