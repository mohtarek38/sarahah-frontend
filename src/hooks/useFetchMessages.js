import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../utils/api";
import { API_BASE } from "../config/config";

/**
 * Custom hook for fetching messages
 * @param {string} userId - User ID to fetch messages for
 * @param {boolean} isPublic - Whether to fetch public messages only
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Object} Messages state and functions
 */
export const useFetchMessages = (userId, isPublic = false, requiresAuth = true) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(
    async (signal) => {
      if (!userId && isPublic) return;

      setLoading(true);
      setError(null);

      try {
        const endpoint = isPublic ? `/messages/public/${userId}` : `/messages/inbox`;
        let response;

        if (requiresAuth) {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            setLoading(false);
            return;
          }
          response = await apiGet(endpoint);
        } else {
          response = await fetch(`${API_BASE}${endpoint}`, { signal });
        }

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.data) && data.data.length > 0) {
            setMessages(data.data);
          } else if (data.message && data.message.toLowerCase().includes("no")) {
            setMessages([]);
          } else if (Array.isArray(data)) {
            setMessages(data);
          } else {
            setMessages([]);
          }
        } else if (response.status === 404 || response.status === 200) {
          setMessages([]);
        }
      } catch (err) {
        // Ignore abort errors
        if (err.name === "AbortError") return;

        console.error("Error fetching messages:", err);
        setError(err.message || "Failed to fetch messages");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [userId, isPublic, requiresAuth]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchMessages(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchMessages]);

  return {
    messages,
    setMessages,
    loading,
    error,
    refetch: () => fetchMessages(),
  };
};
