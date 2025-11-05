import { useState, useCallback } from "react";
import { fetchWithAuth, apiPatch, apiPost } from "../utils/api";
import { API_BASE } from "../config/config";
import { validateField } from "../utils/validators";

/**
 * Custom hook for managing user profile data and operations
 * @returns {Object} Profile state and functions
 */
export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [hiddenFields, setHiddenFields] = useState([]);

  const fetchProfile = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const profileRes = await fetchWithAuth(`${API_BASE}/users/me`, { signal });
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p.user || p);
        setHiddenFields(p.user?.hiddenFields || p.hiddenFields || []);
      } else if (profileRes.status === 404) {
        setError("Profile endpoint not implemented on backend (GET /api/users/me).");
      } else {
        const t = await profileRes.json().catch(() => ({}));
        setError(t.message || "Failed to fetch profile");
      }
    } catch (err) {
      // Ignore abort errors
      if (err.name === "AbortError") return;

      console.error(err);
      setError("Network error while fetching profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (fieldName, value) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Not authenticated");
      return { success: false };
    }

    // Validate field
    const validation = validateField(fieldName, value);
    if (!validation.valid) {
      setError(validation.error);
      return { success: false };
    }

    // Prepare payload
    const payload = {};
    payload[fieldName] = fieldName === "age" ? Number(value) || 0 : value;

    try {
      const res = await apiPatch(`/users/me/updateprofile`, payload);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Failed to update profile");
        return { success: false };
      }

      // Update local state
      setProfile((prev) => ({ ...prev, [fieldName]: payload[fieldName] }));
      setUpdateSuccess("Profile updated successfully!");
      setTimeout(() => setUpdateSuccess(""), 3000);
      return { success: true };
    } catch (err) {
      console.error(err);
      setError("Network error while updating profile");
      return { success: false };
    }
  }, []);

  const toggleFieldVisibility = useCallback(async (fieldName) => {
    try {
      const res = await apiPatch(`/users/me/toggle-field-visibility`, { field: fieldName });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Failed to toggle field visibility:", json.message);
        return;
      }

      setHiddenFields(json.hiddenFields || []);
      setUpdateSuccess(`Field visibility updated`);
      setTimeout(() => setUpdateSuccess(""), 2000);
    } catch (err) {
      console.error("Error toggling field visibility:", err);
    }
  }, []);

  const updateProfileImage = useCallback((profileImage) => {
    setProfile((prev) => ({ ...prev, profileImage }));
    setUpdateSuccess("Profile image uploaded successfully!");
    setTimeout(() => setUpdateSuccess(""), 3000);
  }, []);

  const removeProfileImage = useCallback(() => {
    setProfile((prev) => {
      const updated = { ...prev };
      delete updated.profileImage;
      return updated;
    });
    setUpdateSuccess("Profile image removed successfully!");
    setTimeout(() => setUpdateSuccess(""), 3000);
  }, []);

  const logout = useCallback(async (onLogout) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      try {
        await apiPost(`/auth/logout`, {});
      } catch (err) {
        console.error("Logout error:", err);
      }
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    if (onLogout) onLogout();
    window.location.href = "/login";
  }, []);

  return {
    profile,
    loading,
    error,
    updateSuccess,
    hiddenFields,
    fetchProfile,
    updateProfile,
    toggleFieldVisibility,
    updateProfileImage,
    removeProfileImage,
    logout,
  };
};
