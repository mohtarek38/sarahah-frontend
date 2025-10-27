/**
 * Centralized configuration for the application
 */

export const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

export const POLLING_INTERVAL = 10000; // 10 seconds

export const config = {
  apiBase: API_BASE,
  pollingInterval: POLLING_INTERVAL,
};

export default config;
