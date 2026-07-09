"use client";

import { useCallback, useRef, useState } from "react";
import { useVMSStore } from "../store/vmsStore";
import { useUploadQueue } from "./useUploadQueue";

export const useRecorder = () => {
  // const { processQueue } = useUploadQueue();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const addUpload = useVMSStore((state) => state.addUpload);

  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // const pendingRecordingRef = useRef<
  //   {
  //     stream: MediaStream;
  //     trackingId: string;
  //   }[]
  // >([]);
  const nextRecordingRef = useRef<{
    stream: MediaStream;
    trackingId: string;
  } | null>(null);
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
      console.log("START =", trackingId);
      console.log("RECORDER START =>", trackingId);
      console.log("START TIME =", Date.now());
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log("MEDIA RECORDER ONSTOP");
        console.log("STOP =", trackingId);

        console.log("STOP TRACKING =", trackingId);
        console.log("STOP TIME =", Date.now());
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

        // processQueue();

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
        // console.log("PENDING =", pendingRecordingRef.current);

        // const pending = pendingRecordingRef.current.shift();

        // if (pending) {
        //   console.log("START NEXT =", pending.trackingId);

        //   startRecording(pending.stream, pending.trackingId);
        // }

        const next = nextRecordingRef.current;

        nextRecordingRef.current = null;

        if (next) {
          console.log("START NEXT =", next.trackingId);

          startRecording(next.stream, next.trackingId);
        }

        stoppingRef.current = false;
      };

      recorder.start();
      console.log("Recording Started");

      setRecording({
        isRecording: true,

        trackingId,

        duration: 0,

        startedAt: Date.now(),
      });
      updateDuration();

      timerRef.current = setInterval(updateDuration, 1000);
    },
    [setRecording],
  );
  const stoppingRef = useRef(false);

  // const stopRecording = useCallback(() => {
  //   if (!recorderRef.current) return;

  //   if (recorderRef.current.state !== "recording") return;

  //   stoppingRef.current = true;

  //   console.log("STOP RECORDING");

  //   recorderRef.current.stop();
  // }, []);

  const stopRecording = useCallback(() => {
    if (!recorderRef.current) return;

    if (recorderRef.current.state !== "recording") return;

    if (stoppingRef.current) return;

    stoppingRef.current = true;

    recorderRef.current.stop();
  }, []);

  const isRecorderRunning = () => {
    return recorderRef.current?.state === "recording";
  };

  // const queueNextRecording = (stream: MediaStream, trackingId: string) => {
  //   pendingRecordingRef.current.push({
  //     stream,
  //     trackingId,
  //   });

  //   console.log("QUEUE SIZE =", pendingRecordingRef.current.length);
  // };

  const queueNextRecording = (stream: MediaStream, trackingId: string) => {
    nextRecordingRef.current = {
      stream,
      trackingId,
    };

    console.log("NEXT =", trackingId);
  };
  return {
    isRecording: recording.isRecording,

    duration: recording.duration,

    startRecording,
    queueNextRecording,

    stopRecording,
    isRecorderRunning,

    stoppingRef,
  };
};
