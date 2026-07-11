"use client";

// import { api } from "@/services/api";
import axiosInstance from "@/services/axios";

export interface UploadRecordingPayload {
  trackingId: string;
  blob: Blob;
  operatorId?: string;
  cameraName?: string;
}

// export const uploadRecording = async ({
//   trackingId,
//   blob,
//   operatorId,
//   cameraName,
// }: UploadRecordingPayload) => {
//   const formData = new FormData();

//   formData.append("trackingId", trackingId);

//   formData.append("video", blob, `${trackingId}.webm`);

//   if (operatorId) {
//     formData.append("operatorId", operatorId);
//   }

//   if (cameraName) {
//     formData.append("cameraName", cameraName);
//   }

//   return api.post("/vms/upload", formData);
// };

// export const uploadRecording = async (
//   payload: UploadRecordingPayload,
//   onProgress?: (progress: number) => void,
// ) => {
//   console.log("API START");
//   const formData = new FormData();

//   formData.append("trackingId", payload.trackingId);

//   formData.append("video", payload.blob, `${payload.trackingId}.webm`);

//   if (payload.operatorId) {
//     formData.append("operatorId", payload.operatorId);
//   }

//   if (payload.cameraName) {
//     formData.append("cameraName", payload.cameraName);
//   }

//   const response = await axiosInstance.post("/vms/upload", formData, {
//     headers: {
//       "Content-Type": "multipart/form-data",
//     },

//     onUploadProgress: (event) => {
//       if (!event.total) return;

//       const progress = Math.round((event.loaded * 100) / event.total);

//       onProgress?.(progress);
//     },
//   });

//   return response.data;
// };

export interface SaveRecordingPayload {
  trackingId: string;

  userId: string;

  videoUrl: string;

  thumbnailUrl: string;

  duration: number;

  bytes: number;

  publicId: string;

  version: number;

  operatorId?: string;

  cameraName?: string;
}

export const saveRecording = async (payload: SaveRecordingPayload) => {
  const response = await axiosInstance.post("/vms/save", payload);

  return response.data;
};
