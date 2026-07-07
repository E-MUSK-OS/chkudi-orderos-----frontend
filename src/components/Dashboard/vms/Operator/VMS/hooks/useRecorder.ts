"use client";

import { useCallback, useRef, useState } from "react";
import { useVMSStore } from "../store/vmsStore";
import { useUploadQueue } from "./useUploadQueue";

export const useRecorder = () => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const { addUpload } = useUploadQueue();

  const onStopCallback = useRef<(() => void) | null>(null);

  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

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

        if (timerRef.current) {
          clearInterval(timerRef.current);

          timerRef.current = null;
        }

        setIsRecording(false);

        if (onStopCallback.current) {
          onStopCallback.current();

          onStopCallback.current = null;
        }
      };

      recorder.start();

      setRecording({
        isRecording: true,
        trackingId,
      });

      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    },
    [setRecording],
  );

  const stopRecording = useCallback((callback?: () => void) => {
    if (callback) {
      onStopCallback.current = callback;
    }

    recorderRef.current?.stop();
  }, []);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
  };
};
