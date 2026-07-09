"use client";

import { useCallback, useRef, useState } from "react";
import { useVMSStore } from "../store/vmsStore";
import { useUploadQueue } from "./useUploadQueue";

export const useRecorder = () => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const { addUpload } = useUploadQueue();

  // const onStopCallback = useRef<(() => void) | null>(null);

  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const pendingRecordingRef = useRef<{
    stream: MediaStream;
    trackingId: string;
  } | null>(null);

  // const [isRecording, setIsRecording] = useState(false);
  // const [duration, setDuration] = useState(0);

  // const { setRecording } = useVMSStore();
  const {
    recording,

    setRecording,
  } = useVMSStore();

  const updateDuration = () => {
    const { recording, setRecording } = useVMSStore.getState();

    if (!recording.startedAt) return;

    setRecording({
      duration: Math.floor((Date.now() - recording.startedAt) / 1000),
    });
  };

  const startRecording = useCallback(
    (stream: MediaStream, trackingId: string) => {
      console.log("RECORDER START =>", trackingId);
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // console.log("Recorder stopped");
        console.log("MEDIA RECORDER ONSTOP");
        const blob = new Blob(chunksRef.current, {
          type: "video/webm",
        });
        console.log("ADDING TO QUEUE", trackingId);

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
          updateDuration();

          timerRef.current = null;
        }

        setRecording({
          isRecording: false,

          trackingId: null,

          duration: 0,

          startedAt: null,
        });

        // if (onStopCallback.current) {
        //   onStopCallback.current();

        //   onStopCallback.current = null;
        // }

        const pending = pendingRecordingRef.current;

        if (pending) {
          pendingRecordingRef.current = null;

          startRecording(pending.stream, pending.trackingId);
        }
      };

      recorder.start();
      console.log("Recording Started");

      setRecording({
        isRecording: true,

        trackingId,

        duration: 0,

        startedAt: Date.now(),
      });

      // timerRef.current = setInterval(() => {
      //   const startedAt = useVMSStore.getState().recording.startedAt;

      //   if (!startedAt) return;

      //   const seconds = Math.floor((Date.now() - startedAt) / 1000);

      //   useVMSStore.getState().setRecording({
      //     duration: seconds,
      //   });
      // }, 1000);
      updateDuration();

      timerRef.current = setInterval(updateDuration, 1000);
    },
    [setRecording],
  );

  // const stopRecording = useCallback((callback?: () => void) => {
  //   console.log("STOP RECORDING");
  //   if (callback) {
  //     console.log("SAVE CALLBACK");
  //     onStopCallback.current = callback;
  //   }

  //   recorderRef.current?.stop();
  // }, []);

  const stopRecording = useCallback(() => {
    console.log("STOP RECORDING");

    recorderRef.current?.stop();
  }, []);

  const isRecorderRunning = () => {
    return recorderRef.current?.state === "recording";
  };

  const queueNextRecording = (stream: MediaStream, trackingId: string) => {
    pendingRecordingRef.current = {
      stream,
      trackingId,
    };
  };

  return {
    isRecording: recording.isRecording,

    duration: recording.duration,

    startRecording,
    queueNextRecording,

    stopRecording,
    isRecorderRunning,
  };
};
