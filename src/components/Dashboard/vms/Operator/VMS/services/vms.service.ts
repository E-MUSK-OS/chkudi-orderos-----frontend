"use client";

import { api } from "@/services/api";

export interface UploadRecordingPayload {
  trackingId: string;
  blob: Blob;
  operatorId?: string;
  cameraName?: string;
}

export const uploadRecording = async ({
  trackingId,
  blob,
  operatorId,
  cameraName,
}: UploadRecordingPayload) => {
  const formData = new FormData();

  formData.append("trackingId", trackingId);

  formData.append("video", blob, `${trackingId}.webm`);

  if (operatorId) {
    formData.append("operatorId", operatorId);
  }

  if (cameraName) {
    formData.append("cameraName", cameraName);
  }

  return api.post("/vms/upload", formData);
};
