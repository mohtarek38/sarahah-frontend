/**
 * Centralized configuration for the application
 */

// API Configuration
export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// Re-export validation constants from centralized location
export {
  ageLimits,
  nameLimits,
  bioLimits,
  passwordLimits,
  messageLimits,
  genderEnum,
  phonePattern,
  passwordPattern,
  emailPattern,
} from "../utils/validationConstants";

export const config = {
  apiBase: API_BASE,
  googleClientId: GOOGLE_CLIENT_ID,
};

export default config;
