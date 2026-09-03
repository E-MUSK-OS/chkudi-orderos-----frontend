"use client";

import axiosInstance from "@/services/axios";

export const uploadRecording = async (formData: FormData, onProgress?: (progress: number) => void) => {
  const response = await axiosInstance.post("/vms/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "ngrok-skip-browser-warning": "true",
    },
    onUploadProgress: (event) => {
      if (!event.total) return;
      const progress = Math.round((event.loaded * 100) / event.total);
      onProgress?.(progress);
    },
  });

  return response.data;
};
