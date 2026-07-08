"use client";

import axiosInstance from "@/services/axios";
import axios from "axios";

export interface CloudinaryUploadResult {
  videoUrl: string;

  thumbnailUrl: string;

  duration: number;
}

const getSignature = async () => {
  const response = await axiosInstance.post("/vms/signature");

  return response.data.data;
};

export const uploadVideoToCloudinary = async (
  blob: Blob,
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
  );

  console.log(response.data);

  throw new Error("STOP");
};
