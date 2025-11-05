import { useState, useCallback } from "react";
import { API_BASE } from "../config/config";

/**
 * Custom hook for managing profile image upload and deletion
 * @returns {Object} Image upload state and functions
 */
export const useImageUpload = () => {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");

  const handleImageUpload = useCallback(async (event, onSuccess) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (1MB limit as per backend)
    if (file.size > 1 * 1024 * 1024) {
      setImageUploadError("File size must be less than 1MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageUploadError("Please select a valid image file");
      return;
    }

    setUploadingImage(true);
    setImageUploadError("");

    try {
      const formData = new FormData();
      formData.append("profile", file);

      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/users/me/upload-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setImageUploadError(json.message || "Failed to upload image");
        setUploadingImage(false);
        return;
      }

      // Call success callback with new image data
      if (json.user?.profileImage && onSuccess) {
        onSuccess(json.user.profileImage);
      }
    } catch (err) {
      console.error(err);
      setImageUploadError("Network error while uploading image");
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = "";
    }
  }, []);

  const handleImageDelete = useCallback((onSuccess, onConfirm) => {
    const executeDelete = async () => {
      setUploadingImage(true);
      setImageUploadError("");

      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE}/users/me/delete-profile-image`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setImageUploadError(json.message || "Failed to delete image");
          setUploadingImage(false);
          return;
        }

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } catch (err) {
        console.error(err);
        setImageUploadError("Network error while deleting image");
      } finally {
        setUploadingImage(false);
      }
    };

    // If onConfirm callback provided, call it to show modal
    // Otherwise fall back to window.confirm for backwards compatibility
    if (onConfirm) {
      onConfirm(executeDelete);
      return;
    }

    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    executeDelete();
  }, []);

  return {
    uploadingImage,
    imageUploadError,
    handleImageUpload,
    handleImageDelete,
    setImageUploadError,
  };
};
