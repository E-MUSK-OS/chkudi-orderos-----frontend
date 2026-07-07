"use client";

import { useCallback, useRef, useState } from "react";
import { useVMSStore } from "../store/vmsStore";
import { useUploadQueue } from "./useUploadQueue";

export const useRecorder = () => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const { addUpload } = useUploadQueue();

  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);

  const { setRecording } = useVMSStore();

  const startRecording = useCallback(
    (stream: MediaStream, trackingId: string) => {
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log("Recorder stopped");
        const blob = new Blob(chunksRef.current, {
          type: "video/webm",
        });

        addUpload({
          id: crypto.randomUUID(),

          trackingId,

          blob,

          status: "pending",

          progress: 0,

          retryCount: 0,

          createdAt: Date.now(),
        });

        setRecording({
          isRecording: false,
          trackingId: null,
          blob,
        });

        setIsRecording(false);
      };

      recorder.start();

      setRecording({
        isRecording: true,
        trackingId,
      });

      setIsRecording(true);
    },
    [setRecording],
  );

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};
