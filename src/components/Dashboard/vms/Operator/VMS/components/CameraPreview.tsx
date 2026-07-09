"use client";

import { Camera } from "lucide-react";
import type { useCamera } from "../hooks/useCamera";
import type { useRecorder } from "../hooks/useRecorder";
import { useVMSStore } from "../store/vmsStore";

// interface CameraPreviewProps {
//   camera: ReturnType<typeof useCamera>;
//   recorder: ReturnType<typeof useRecorder>;
// }

interface CameraPreviewProps {
  camera: ReturnType<typeof useCamera>;
}

const CameraPreview = ({ camera }: CameraPreviewProps) => {
  const { network, uploadQueue, camera: cameraState } = useVMSStore();
  // const { videoRef, devices, selectedCamera, setSelectedCamera } = useCamera();
  const { videoRef, devices, selectedCamera, setSelectedCamera } = camera;
  // const { isRecording, duration } = recorder;
  const recording = useVMSStore((state) => state.recording);
  const { isRecording, duration } = recording;

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);

    const sec = seconds % 60;

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const currentUpload = uploadQueue.find(
    (item) => item.trackingId === recording.trackingId,
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);

    const s = seconds % 60;

    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  console.log("CameraPreview", {
    isRecording,
    duration,
  });
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
        {/* {isRecording && (
          <div className="absolute left-4 top-4 z-20 rounded-lg bg-black/70 px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />

              <span className="font-semibold text-white">Recording</span>
            </div>

            <p>{formatDuration(duration)}</p>
          </div>
        )} */}

        {recording.isRecording && (
          <div className="absolute left-4 top-4 z-20 w-80 rounded-xl bg-black/70 p-4 text-white backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />

                <span className="font-semibold">REC</span>
              </div>

              <span className="font-mono text-lg">
                {formatTime(recording.duration)}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Tracking</span>

                <span>{recording.trackingId}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">Camera</span>

                <span>{cameraState.deviceName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">Upload</span>

                <span>
                  {currentUpload
                    ? `${currentUpload.status} (${currentUpload.progress}%)`
                    : "-"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">Network</span>

                <span
                  className={network.online ? "text-green-400" : "text-red-400"}
                >
                  {network.online ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          disablePictureInPicture
          className="h-full w-full object-cover"
          style={{
            willChange: "transform",
          }}
        />
      </div>
    </div>
  );
};

export default CameraPreview;
