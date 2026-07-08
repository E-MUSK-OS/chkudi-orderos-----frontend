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
  //   const uniqueId = `${trackingId}_${Date.now()}`;
  const signature = await getSignature(trackingId);

  console.log("Signature Response", signature);

  console.log("Uploading with", {
    public_id: signature.publicId,
    folder: signature.folder,
    timestamp: signature.timestamp,
    signature: signature.signature,
    apiKey: signature.apiKey,
  });

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("public_id", signature.publicId);
  formData.append("overwrite", "false");
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  try {
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
  } catch (err: any) {
    console.log("FULL ERROR", err);
    console.log("STATUS", err.response?.status);
    console.log("DATA", err.response?.data);
    console.dir(err.response?.data);
    console.log("MESSAGE", err.response?.data?.error?.message);

    alert(err.response?.data?.error?.message);

    throw err;
  }
};
