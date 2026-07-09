"use client";

import { useCallback, useRef, useState } from "react";
import { useVMSStore } from "../store/vmsStore";
import { useUploadQueue } from "./useUploadQueue";

export const useRecorder = () => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const { addUpload } = useUploadQueue();
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRecordingRef = useRef<{
    stream: MediaStream;
    trackingId: string;
  } | null>(null);

  const { recording, setRecording } = useVMSStore();

  const updateDuration = () => {
    const { recording, setRecording } = useVMSStore.getState();
    if (!recording.startedAt) return;
    setRecording({
      duration: Math.floor((Date.now() - recording.startedAt) / 1000),
    });
  };

  const startRecording = useCallback(
    (stream: MediaStream, trackingId: string) => {
      console.log("START RECORDING =>", trackingId);

      // Clear any pending recording first
      pendingRecordingRef.current = null;

      chunksRef.current = [];

      let mimeType = "";

      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        mimeType = "video/webm;codecs=vp8";
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm";
      }

      console.log("Using mimeType", mimeType);
      console.log(
        "Supports video/webm:",
        MediaRecorder.isTypeSupported("video/webm"),
      );
      console.log(
        "Supports VP8:",
        MediaRecorder.isTypeSupported("video/webm;codecs=vp8"),
      );
      console.log(
        "Supports VP9:",
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9"),
      );

      const recorder = new MediaRecorder(stream, {
        mimeType,
      });

      console.log("Recorder mimeType:", recorder.mimeType);

      // const recorder = new MediaRecorder(stream, {
      //   mimeType: "video/webm;codecs=vp9,opus",
      // });

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log("MEDIA RECORDER ONSTOP");
        const blob = new Blob(chunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);

        window.open(url, "_blank");
        console.log("Blob", blob);
        console.log("Blob size", blob.size);
        console.log("Blob type", blob.type);

        // Get the tracking ID from the current recording state
        const currentTrackingId = useVMSStore.getState().recording.trackingId;
        console.log("ADDING TO QUEUE", currentTrackingId);

        if (blob.size > 0 && currentTrackingId) {
          addUpload({
            id: crypto.randomUUID(),
            trackingId: currentTrackingId,
            blob,
            status: "pending",
            progress: 0,
            retryCount: 0,
            createdAt: Date.now(),
          });
        }

        setRecording({
          isRecording: false,
          trackingId: null,
          blob,
          duration: 0,
          startedAt: null,
        });

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Check for pending recording
        const pending = pendingRecordingRef.current;
        if (pending) {
          console.log("Starting pending recording:", pending.trackingId);
          pendingRecordingRef.current = null;
          // Update the tracking ID in store before starting
          setRecording({
            trackingId: pending.trackingId,
          });
          startRecording(pending.stream, pending.trackingId);
        }
      };

      // Update store with new tracking ID before starting
      setRecording({
        isRecording: true,
        trackingId: trackingId,
        duration: 0,
        startedAt: Date.now(),
      });

      recorder.start(1000); // Collect data every second
      console.log("Recording Started for:", trackingId);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(updateDuration, 1000);
    },
    [setRecording, addUpload],
  );

  const stopRecording = useCallback(() => {
    console.log("STOP RECORDING");
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  const isRecorderRunning = useCallback(() => {
    return recorderRef.current?.state === "recording";
  }, []);

  const queueNextRecording = useCallback(
    (stream: MediaStream, trackingId: string) => {
      console.log("Queue next recording:", trackingId);
      pendingRecordingRef.current = {
        stream,
        trackingId,
      };
    },
    [],
  );

  return {
    isRecording: recording.isRecording,
    duration: recording.duration,
    startRecording,
    queueNextRecording,
    stopRecording,
    isRecorderRunning,
  };
};
