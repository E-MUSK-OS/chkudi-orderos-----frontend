"use client";

import axiosInstance from "@/services/axios";
import axios from "axios";

export interface CloudinaryUploadResult {
  videoUrl: string;

  thumbnailUrl: string;

  duration: number;

  bytes: number;

  publicId: string;
  version: number;
}

// const getSignature = async () => {
//   const response = await axiosInstance.post("/vms/signature");

//   return response.data.data;
// };

const getSignature = async (publicId: string) => {
  const response = await axiosInstance.post("/vms/signature", {
    publicId,
  });

  return response.data.data;
};

export const uploadVideoToCloudinary = async (
  trackingId: string,
  blob: Blob,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadResult> => {
  // Generate a unique public ID with timestamp
  const uniqueId = `${trackingId}_${Date.now()}`;
  const signature = await getSignature(uniqueId);

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("public_id", signature.publicId);
  formData.append("overwrite", "false");
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
    version: response.data.version,
  };
};
