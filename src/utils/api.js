/**
 * API utility with automatic token refresh handling
 */

import { API_BASE } from "../config/config";

let isRefreshing = false;
let refreshSubscribers = [];

/**
 * Subscribe to token refresh completion
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token is refreshed
 */
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

/**
 * Refresh the access token using refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshtoken: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to refresh token");
    }

    // Save new access token
    if (data.accesstoken) {
      localStorage.setItem("accessToken", data.accesstoken);
      return data.accesstoken;
    }

    throw new Error("No access token in response");
  } catch (error) {
    // Clear tokens if refresh fails
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    // Redirect to login
    window.location.href = "/login";
    throw error;
  }
};

/**
 * Fetch with automatic token refresh on 401
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("accessToken");

  // Add authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  // Make the initial request
  let response = await fetch(url, { ...options, headers });

  // If 401 and we have a refresh token, try to refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      // No refresh token, redirect to login
      window.location.href = "/login";
      throw new Error("Unauthorized - please log in");
    }

    // Handle concurrent requests during token refresh
    if (isRefreshing) {
      // Wait for the ongoing refresh to complete
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          // Retry the original request with new token
          headers.Authorization = `Bearer ${newToken}`;
          resolve(fetch(url, { ...options, headers }));
        });
      });
    }

    isRefreshing = true;

    try {
      // Refresh the token
      const newToken = await refreshAccessToken();

      // Notify all waiting requests
      onTokenRefreshed(newToken);

      // Retry the original request with new token
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return response;
};

/**
 * Convenience method for authenticated GET requests
 */
export const apiGet = async (endpoint) => {
  return fetchWithAuth(`${API_BASE}${endpoint}`);
};

/**
 * Convenience method for authenticated POST requests
 */
export const apiPost = async (endpoint, data) => {
  return fetchWithAuth(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * Convenience method for authenticated PATCH requests
 */
export const apiPatch = async (endpoint, data) => {
  return fetchWithAuth(`${API_BASE}${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

/**
 * Convenience method for authenticated DELETE requests
 */
export const apiDelete = async (endpoint) => {
  return fetchWithAuth(`${API_BASE}${endpoint}`, {
    method: "DELETE",
  });
};

const apiUtils = {
  fetchWithAuth,
  refreshAccessToken,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
};

export default apiUtils;
