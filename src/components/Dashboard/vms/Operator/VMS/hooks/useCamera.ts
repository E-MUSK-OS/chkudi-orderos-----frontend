"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVMSStore } from "../store/vmsStore";
import { CameraDevice } from "../types/vms.types";

const constraints: MediaStreamConstraints = {
  video: {
    width: {
      ideal: 1920,
      max: 1920,
    },
    height: {
      ideal: 1080,
      max: 1080,
    },
    frameRate: {
      ideal: 30,
      max: 30,
    },
    facingMode: "environment",
  },
  audio: false,
};

export const useCamera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const streamRef = useRef<MediaStream | null>(null);

  const [loading, setLoading] = useState(false);

  const { setCamera } = useVMSStore();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState("");

  const loadDevices = async () => {
    const deviceList = await navigator.mediaDevices.enumerateDevices();

    const cameras = deviceList
      .filter((device) => device.kind === "videoinput")
      .map((device) => ({
        id: device.deviceId,
        label: device.label || "Camera",
      }));

    setDevices(cameras);

    if (cameras.length > 0) {
      setSelectedCamera(cameras[0].id);
    }
  };

  const startCamera = useCallback(async () => {
    try {
      setLoading(true);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;
      setStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const track = stream.getVideoTracks()[0];
      await loadDevices();

      setCamera({
        connected: true,
        permission: true,
        deviceName: track.label,
      });
    } catch (error) {
      console.error(error);

      setCamera({
        connected: false,
        permission: false,
        deviceName: "",
      });
    } finally {
      setLoading(false);
    }
  }, [setCamera]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;
    setStream(null);

    setCamera({
      connected: false,
    });
  }, [setCamera]);

  useEffect(() => {
    const init = async () => {
      await startCamera();
    };

    init();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return {
    videoRef,
    loading,
    startCamera,
    stopCamera,
    devices,
    selectedCamera,
    setSelectedCamera,
    stream,
    streamRef,
  };
};
