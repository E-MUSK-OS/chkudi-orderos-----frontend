"use client";

import { Camera } from "lucide-react";
import type { useCamera } from "../hooks/useCamera";

interface CameraPreviewProps {
  camera: ReturnType<typeof useCamera>;
}

const CameraPreview = ({ camera }: CameraPreviewProps) => {
  // const { videoRef, devices, selectedCamera, setSelectedCamera } = useCamera();
  const { videoRef, devices, selectedCamera, setSelectedCamera } = camera;
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
      <div className="h-[650px] overflow-hidden bg-black">
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
