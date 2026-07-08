"use client";

import axiosInstance from "@/services/axios";
import axios from "axios";

export interface CloudinaryUploadResult {
  videoUrl: string;

  thumbnailUrl: string;

  duration: number;

  bytes: number;

  publicId: string;
}

const getSignature = async () => {
  const response = await axiosInstance.post("/vms/signature");

  return response.data.data;
};

export const uploadVideoToCloudinary = async (
  blob: Blob,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadResult> => {
  const signature = await getSignature();

  const formData = new FormData();

  formData.append("file", blob);

  formData.append("api_key", signature.apiKey);

  formData.append("timestamp", String(signature.timestamp));

  formData.append("signature", signature.signature);

  formData.append("folder", signature.folder);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`,
    formData,
    {
      onUploadProgress: (event) => {
        if (!event.total) return;

        const progress = Math.round((event.loaded * 100) / event.total);

        onProgress?.(progress);
      },
    },
  );

  return {
    videoUrl: response.data.secure_url,

    thumbnailUrl: response.data.secure_url
      .replace("/upload/", "/upload/so_1/")
      .replace(".webm", ".jpg"),

    duration: Math.round(response.data.duration),

    bytes: response.data.bytes,

    publicId: response.data.public_id,
  };
};
