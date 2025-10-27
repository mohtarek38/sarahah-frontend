/**
 * Centralized configuration for the application
 */

export const config = {
  apiBase: process.env.REACT_APP_API_BASE,
  pollingInterval: +process.env.POLLING_INTERVAL,
};

export default config;