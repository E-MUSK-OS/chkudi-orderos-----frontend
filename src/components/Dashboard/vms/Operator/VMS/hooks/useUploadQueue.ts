"use client";

import { useVMSStore } from "../store/vmsStore";
import { uploadVideoToCloudinary } from "../services/cloudinary.service";
import { saveRecording } from "../services/vms.service";
import { UploadItem } from "../types/vms.types";
import { useEffect } from "react";
import { useRef } from "react";
import { SCANNER_CONFIG } from "../utils/scanner.constants";
import { toast } from "sonner";

export const useUploadQueue = () => {
   console.log("UPLOAD QUEUE HOOK MOUNTED");
  const { uploadQueue, addUpload, updateUpload, removeUpload, setNetwork } =
    useVMSStore();
  const workerRunning = useRef(false);

  const uploadItem = async (item: UploadItem) => {
    console.log("UPLOAD ITEM", item);
    try {
      updateUpload(item.id, {
        status: "uploading",
        progress: 0,
      });

      // await uploadRecording({
      //   trackingId: item.trackingId,
      //   blob: item.blob,
      // });

      // await uploadRecording(
      //   {
      //     trackingId: item.trackingId,
      //     blob: item.blob,
      //   },
      //   (progress) => {
      //     updateUpload(item.id, {
      //       progress,
      //     });
      //   },
      // );
      const cloudinary = await uploadVideoToCloudinary(
        item.trackingId,
        item.blob,
        (progress) => {
          updateUpload(item.id, {
            progress,
          });
        },
      );

      const response = await saveRecording({
        trackingId: item.trackingId,

        videoUrl: cloudinary.videoUrl,

        thumbnailUrl: cloudinary.thumbnailUrl,

        duration: cloudinary.duration,

        bytes: cloudinary.bytes,

        publicId: cloudinary.publicId,

        version: cloudinary.version,
      });

      updateUpload(item.id, {
        status: "completed",

        progress: 100,

        videoUrl: cloudinary.videoUrl,

        thumbnailUrl: cloudinary.thumbnailUrl,
      });

      toast.success("Upload Completed", {
        description: `${item.trackingId} uploaded successfully.`,
      });

      setTimeout(() => {
        removeUpload(item.id);
      }, 5000);
    } catch (error) {
      console.error(error);

      if (item.retryCount < SCANNER_CONFIG.MAX_RETRY) {
        toast.warning("Retrying Upload", {
          description: `${item.trackingId}
Retry ${item.retryCount + 1}/${SCANNER_CONFIG.MAX_RETRY}`,
        });
        updateUpload(item.id, {
          status: "pending",

          retryCount: item.retryCount + 1,

          progress: 0,
        });

        return;
      }

      updateUpload(item.id, {
        status: "failed",
        progress: 0,
      });
      toast.error("Upload Failed", {
        description: `Tracking ID : ${item.trackingId} (Retry ${item.retryCount}/${SCANNER_CONFIG.MAX_RETRY})`,
      });
    }
  };

  // const processQueue = async () => {
  //   const pending = uploadQueue.filter((item) => item.status === "pending");

  //   for (const item of pending) {
  //     await uploadItem(item);
  //   }
  // };

  // useEffect(() => {
  //   processQueue();
  // }, [uploadQueue]);

  useEffect(() => {
    const handleOnline = () => {
      console.log("Internet Online");

      setNetwork({
        online: true,
      });

      void processQueue();

      // processQueue();
    };

    const handleOffline = () => {
      console.log("Internet Offline");

      setNetwork({
        online: false,
      });
    };

    window.addEventListener("online", handleOnline);

    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);

      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const processQueue = async () => {
    console.log("PROCESS QUEUE");
    if (!navigator.onLine) {
      return;
    }
    if (workerRunning.current) {
      return;
    }

    workerRunning.current = true;

    try {
      const pending = uploadQueue.filter((item) => item.status === "pending");

      for (const item of pending) {
        await uploadItem(item);
      }
    } finally {
      workerRunning.current = false;
    }
  };

  useEffect(() => {
    processQueue();
  }, [uploadQueue]);

  useEffect(() => {
    console.log("Upload Queue Changed:", uploadQueue);
  }, [uploadQueue]);

  return {
    uploadQueue,
    addUpload,
    updateUpload,
    removeUpload,
    processQueue,
  };
};
