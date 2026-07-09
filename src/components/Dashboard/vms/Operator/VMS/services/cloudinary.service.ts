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
  const signature = await getSignature(trackingId);

  console.log("========== CLOUDINARY SIGNATURE ==========");
  console.log(signature);

  console.log("========== BLOB ==========");
  console.log("Size:", blob.size);
  console.log("Type:", blob.type);

  const file = new File([blob], `${trackingId}.webm`, {
    type: blob.type || "video/webm",
  });

  console.log("========== FILE ==========");
  console.log(file);

  const formData = new FormData();

  formData.append("file", file);
  formData.append("public_id", signature.publicId);
  formData.append("folder", signature.folder);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("overwrite", "false");

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`,
      formData,
      {
        onUploadProgress: (event) => {
          if (!event.total) return;

          const progress = Math.round(
            (event.loaded * 100) / event.total,
          );

          onProgress?.(progress);
        },
      },
    );

    console.log("========== CLOUDINARY SUCCESS ==========");
    console.log(response.data);

    return {
      videoUrl: response.data.secure_url,

      thumbnailUrl: response.data.secure_url
        .replace("/video/upload/", "/video/upload/so_1/")
        .replace(/\.(webm|mp4|mov|avi)$/i, ".jpg"),

      duration: Math.round(response.data.duration),

      bytes: response.data.bytes,

      publicId: response.data.public_id,

      version: response.data.version,
    };
  } catch (err: any) {
    console.log("========== CLOUDINARY ERROR ==========");
    console.log("Status:", err.response?.status);
    console.log("Data:", err.response?.data);
    console.log("Message:", err.response?.data?.error?.message);

    throw err;
  }
};