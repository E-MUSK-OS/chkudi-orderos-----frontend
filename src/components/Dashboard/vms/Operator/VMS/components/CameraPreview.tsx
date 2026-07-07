"use client";

import { Camera } from "lucide-react";
import type { useCamera } from "../hooks/useCamera";
import type { useRecorder } from "../hooks/useRecorder";

interface CameraPreviewProps {
  camera: ReturnType<typeof useCamera>;
  recorder: ReturnType<typeof useRecorder>;
}

const CameraPreview = ({ camera, recorder }: CameraPreviewProps) => {
  // const { videoRef, devices, selectedCamera, setSelectedCamera } = useCamera();
  const { videoRef, devices, selectedCamera, setSelectedCamera } = camera;
  const { isRecording, duration } = recorder;
  return (
    <div className="overflow-hidden">
      {devices.length > 1 && (
        <select
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {devices.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label}
            </option>
          ))}
        </select>
      )}
      <div className="relative h-[650px] overflow-hidden bg-black">
        {isRecording && (
          <div className="absolute left-4 top-4 z-20 rounded-lg bg-black/70 px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />

              <span className="font-semibold text-white">Recording</span>
            </div>

            <p className="mt-1 text-lg font-bold text-white">{duration}s</p>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default CameraPreview;
