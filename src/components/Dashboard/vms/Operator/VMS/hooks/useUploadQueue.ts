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
  const successSound = useRef<HTMLAudioElement | null>(null);
  const errorSound = useRef<HTMLAudioElement | null>(null);

  const uploadItem = async (item: UploadItem) => {
    console.log("UPLOAD =", item.trackingId);
    // console.log("UPLOAD ITEM", item);
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
      const userId = JSON.parse(localStorage.getItem("user") || "{}")?.id;
      const operatorId = JSON.parse(
        sessionStorage.getItem("operator") || "{}",
      )?.id;
      const accountId = JSON.parse(
        sessionStorage.getItem("selectedAccount") || "{}",
      )?.id;

      const response = await saveRecording({
        trackingId: item.trackingId,

        userId,

        operatorId,
        accountId,

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

      const successAudio = successSound.current;

      if (successAudio) {
        try {
          successAudio.pause();
          successAudio.currentTime = 0;

          await successAudio.play();
        } catch (error) {
          console.error("Success sound failed:", error);
        }
      }

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

        setTimeout(() => {
          void processQueue();
        }, 1000);

        return;
      }

      updateUpload(item.id, {
        status: "failed",
        progress: 0,
      });

      toast.error("Upload Failed", {
        description: `Tracking ID : ${item.trackingId} (Retry ${item.retryCount}/${SCANNER_CONFIG.MAX_RETRY})`,
      });

      const errorAudio = errorSound.current;

      if (errorAudio) {
        try {
          errorAudio.pause();
          errorAudio.currentTime = 0;

          await errorAudio.play();
        } catch (error) {
          console.error("Error sound failed:", error);
        }
      }
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
      // const pending = uploadQueue.filter((item) => item.status === "pending");
      const pending = useVMSStore
        .getState()
        .uploadQueue.filter((item) => item.status === "pending");

      for (const item of pending) {
        await uploadItem(item);
      }
    } finally {
      workerRunning.current = false;
    }
  };

  useEffect(() => {
    successSound.current = new Audio("/sounds/success.wav");
    errorSound.current = new Audio("/sounds/warning.wav");

    return () => {
      successSound.current = null;
      errorSound.current = null;
    };
  }, []);

  const retryUpload = async (id: string) => {
    const item = useVMSStore
      .getState()
      .uploadQueue.find((upload) => upload.id === id);

    if (!item) {
      return;
    }

    updateUpload(id, {
      status: "pending",
      progress: 0,
      retryCount: item.retryCount + 1,
    });

    await processQueue();
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
    retryUpload,
  };
};
