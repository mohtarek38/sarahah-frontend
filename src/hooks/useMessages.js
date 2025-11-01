import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "../utils/api";
import { API_BASE, POLLING_INTERVAL } from "../config/config";

/**
 * Custom hook for managing message inbox with polling
 * @returns {Object} Messages state and functions
 */
export const useMessages = () => {
  const [messages, setMessages] = useState([]);

  const fetchInbox = useCallback(async (signal) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const inboxRes = await fetchWithAuth(`${API_BASE}/messages/inbox`, { signal });
      if (inboxRes.ok) {
        const json = await inboxRes.json();
        // Backend may return:
        // - { message: 'Messages fetched successfully', data: [ ... ] }
        // - OR when empty: { message: 'No messages found' }
        if (Array.isArray(json.data) && json.data.length > 0) {
          setMessages(json.data);
        } else if (json.message && json.message.toLowerCase().includes("no messages")) {
          setMessages([]);
        } else if (Array.isArray(json)) {
          setMessages(json);
        } else {
          setMessages([]);
        }
      } else if (inboxRes.status === 404) {
        setMessages([]);
      } else if (inboxRes.status === 401) {
        console.warn("Auth error in fetchInbox, user may need to re-login");
      }
    } catch (err) {
      // Ignore AbortError when request is cancelled
      if (err.name === "AbortError") {
        console.log("Fetch inbox aborted");
        return;
      }
      console.error("Error fetching inbox:", err);
    }
  }, []);

  // Set up polling
  useEffect(() => {
    const controller = new AbortController();

    // Initial fetch
    fetchInbox(controller.signal);

    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchInbox(controller.signal);
    }, POLLING_INTERVAL);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [fetchInbox]);

  return { messages, fetchInbox };
};
