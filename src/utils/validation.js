/**
 * Scalable validation utility matching backend Joi schemas
 * Provides client-side validation before API calls
 */

import {
  ageLimits,
  nameLimits,
  bioLimits,
  passwordLimits,
  messageLimits,
  genderEnum,
  phonePattern,
  passwordPattern,
  emailPattern,
} from "./validationConstants";

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string} [error] - Error message if validation failed
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {ValidationResult}
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === "") {
    return { valid: false, error: "Email is required" };
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (!emailPattern.test(trimmedEmail)) {
    return { valid: false, error: "Please enter a valid email address" };
  }

  return { valid: true };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {ValidationResult}
 */
export const validatePassword = (password) => {
  if (!password || password === "") {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < passwordLimits.MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${passwordLimits.MIN_LENGTH} characters long` };
  }

  if (password.length > passwordLimits.MAX_LENGTH) {
    return { valid: false, error: `Password must not exceed ${passwordLimits.MAX_LENGTH} characters` };
  }

  if (!passwordPattern.test(password)) {
    return {
      valid: false,
      error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    };
  }

  return { valid: true };
};

/**
 * Validate confirm password
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {ValidationResult}
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword === "") {
    return { valid: false, error: "Please confirm your password" };
  }

  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match" };
  }

  return { valid: true };
};

/**
 * Validate name (firstName or lastName)
 * @param {string} name - Name to validate
 * @param {string} fieldName - Field name for error messages (e.g., "First name", "Last name")
 * @returns {ValidationResult}
 */
export const validateName = (name, fieldName = "Name") => {
  if (!name || name.trim() === "") {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmedName = name.trim();

  if (trimmedName.length < nameLimits.MIN_NAME_LENGTH) {
    return { valid: false, error: `${fieldName} must be at least ${nameLimits.MIN_NAME_LENGTH} characters` };
  }

  if (trimmedName.length > nameLimits.MAX_NAME_LENGTH) {
    return { valid: false, error: `${fieldName} must not exceed ${nameLimits.MAX_NAME_LENGTH} characters` };
  }

  // Check if alphanumeric only (matching backend .alphanum())
  if (!/^[a-zA-Z0-9]+$/.test(trimmedName)) {
    return { valid: false, error: `${fieldName} must contain only letters and numbers` };
  }

  return { valid: true };
};

/**
 * Validate age
 * @param {number|string} age - Age to validate
 * @returns {ValidationResult}
 */
export const validateAge = (age) => {
  if (!age && age !== 0) {
    return { valid: false, error: "Age is required" };
  }

  const ageNum = Number(age);

  if (isNaN(ageNum)) {
    return { valid: false, error: "Age must be a valid number" };
  }

  if (!Number.isInteger(ageNum)) {
    return { valid: false, error: "Age must be a whole number" };
  }

  if (ageNum < ageLimits.MIN_AGE) {
    return { valid: false, error: `You must be at least ${ageLimits.MIN_AGE} years old` };
  }

  if (ageNum > ageLimits.MAX_AGE) {
    return { valid: false, error: `Age must not exceed ${ageLimits.MAX_AGE}` };
  }

  return { valid: true };
};

/**
 * Validate gender
 * @param {string} gender - Gender to validate
 * @returns {ValidationResult}
 */
export const validateGender = (gender) => {
  if (!gender || gender.trim() === "") {
    return { valid: false, error: "Gender is required" };
  }

  const validGenders = Object.values(genderEnum);
  if (!validGenders.includes(gender)) {
    return { valid: false, error: `Gender must be one of: ${validGenders.join(", ")}` };
  }

  return { valid: true };
};

/**
 * Validate phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {ValidationResult}
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return { valid: false, error: "Phone number is required" };
  }

  if (!phonePattern.test(phoneNumber)) {
    return { valid: false, error: "Phone number must be exactly 11 digits" };
  }

  return { valid: true };
};

/**
 * Validate bio
 * @param {string} bio - Bio to validate
 * @returns {ValidationResult}
 */
export const validateBio = (bio) => {
  // Bio is optional, so empty is valid
  if (!bio || bio.trim() === "") {
    return { valid: true };
  }

  if (bio.length > bioLimits.MAX_BIO_LENGTH) {
    return { valid: false, error: `Bio must not exceed ${bioLimits.MAX_BIO_LENGTH} characters` };
  }

  return { valid: true };
};

/**
 * Validate message content
 * @param {string} content - Message content to validate
 * @returns {ValidationResult}
 */
export const validateMessage = (content) => {
  if (!content || content.trim() === "") {
    return { valid: false, error: "Message cannot be empty" };
  }

  if (content.length > messageLimits.MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Message must not exceed ${messageLimits.MAX_MESSAGE_LENGTH} characters` };
  }

  return { valid: true };
};

/**
 * Validate signup form data (matches backend signUpSchema)
 * @param {Object} formData - Form data object
 * @returns {Object} { valid: boolean, errors: Object }
 */
export const validateSignupForm = (formData) => {
  const errors = {};

  // Validate first name
  const firstNameResult = validateName(formData.firstName, "First name");
  if (!firstNameResult.valid) errors.firstName = firstNameResult.error;

  // Validate last name
  const lastNameResult = validateName(formData.lastName, "Last name");
  if (!lastNameResult.valid) errors.lastName = lastNameResult.error;

  // Validate email
  const emailResult = validateEmail(formData.email);
  if (!emailResult.valid) errors.email = emailResult.error;

  // Validate password
  const passwordResult = validatePassword(formData.password);
  if (!passwordResult.valid) errors.password = passwordResult.error;

  // Validate confirm password
  const confirmPasswordResult = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (!confirmPasswordResult.valid) errors.confirmPassword = confirmPasswordResult.error;

  // Validate age
  const ageResult = validateAge(formData.age);
  if (!ageResult.valid) errors.age = ageResult.error;

  // Validate gender
  const genderResult = validateGender(formData.gender);
  if (!genderResult.valid) errors.gender = genderResult.error;

  // Validate phone number
  const phoneResult = validatePhoneNumber(formData.phoneNumber);
  if (!phoneResult.valid) errors.phoneNumber = phoneResult.error;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate login form data
 * @param {Object} formData - Form data object
 * @returns {Object} { valid: boolean, errors: Object }
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  // Validate email
  const emailResult = validateEmail(formData.email);
  if (!emailResult.valid) errors.email = emailResult.error;

  // Validate password (just check if it exists for login)
  if (!formData.password || formData.password === "") {
    errors.password = "Password is required";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Generic field validator - routes to appropriate validator based on field name
 * @param {string} fieldName - Name of the field to validate
 * @param {any} value - Value to validate
 * @returns {ValidationResult}
 */
export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case "email":
      return validateEmail(value);
    case "password":
      return validatePassword(value);
    case "firstName":
      return validateName(value, "First name");
    case "lastName":
      return validateName(value, "Last name");
    case "age":
      return validateAge(value);
    case "gender":
      return validateGender(value);
    case "phoneNumber":
      return validatePhoneNumber(value);
    case "bio":
      return validateBio(value);
    case "message":
    case "content":
      return validateMessage(value);
    default:
      return { valid: true }; // Unknown fields pass validation
  }
};
