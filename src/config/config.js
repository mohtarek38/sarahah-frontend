/**
 * Centralized configuration for the application
 */

export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";
export const POLLING_INTERVAL = +process.env.REACT_APP_POLLING_INTERVAL || 10000;
export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

export const ageLimits = {
  MIN_AGE: 13,
  MAX_AGE: 120,
};

export const nameLimits = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 30,
};

export const bioLimits = {
  MAX_BIO_LENGTH: 250,
};

export const config = {
  apiBase: API_BASE,
  pollingInterval: POLLING_INTERVAL,
  googleClientId: GOOGLE_CLIENT_ID,
};

export default config;
