/**
 * Legacy validators file - kept for backwards compatibility
 * New code should import from './validation.js' instead
 *
 * This file re-exports validators from the main validation module
 */

export {
  validateAge,
  validateName,
  validateBio,
  validateField,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateGender,
  validatePhoneNumber,
  validateMessage,
  validateSignupForm,
  validateLoginForm,
} from "./validation";
