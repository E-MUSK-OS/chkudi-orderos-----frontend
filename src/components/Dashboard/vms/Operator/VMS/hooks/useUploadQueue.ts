"use client";

import { useVMSStore } from "../store/vmsStore";
import { uploadRecording } from "../services/vms.service";
import { UploadItem } from "../types/vms.types";
import { useEffect } from "react";

export const useUploadQueue = () => {
  const { uploadQueue, addUpload, updateUpload, removeUpload } = useVMSStore();

  const uploadItem = async (item: UploadItem) => {
    try {
      updateUpload(item.id, {
        status: "uploading",
        progress: 0,
      });

      await uploadRecording({
        trackingId: item.trackingId,
        blob: item.blob,
      });

      updateUpload(item.id, {
        status: "completed",
        progress: 100,
      });
    } catch (error) {
      console.error(error);

      updateUpload(item.id, {
        status: "failed",
      });
    }
  };

  const processQueue = async () => {
    const pending = uploadQueue.filter((item) => item.status === "pending");

    for (const item of pending) {
      await uploadItem(item);
    }
  };

  useEffect(() => {
    processQueue();
  }, [uploadQueue]);

  return {
    uploadQueue,
    addUpload,
    updateUpload,
    removeUpload,
    processQueue,
  };
};
