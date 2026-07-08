"use client";

import { useVMSStore } from "../store/vmsStore";

interface Props {
  totalScans?: number;
}
interface CardProps {
  title: string;
  value: string;
  online?: boolean;
}

const StatusCard = ({ title, value, online }: CardProps) => {
  return (
    <div className="border border-[#C89B3C] p-5 shadow-sm">
      <p className="text-lg text-gray-500">{title}</p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg ">{value}</span>

        {online !== undefined && (
          <span
            className={`h-3 w-3 rounded-full ${
              online ? "bg-green-500" : "bg-red-500"
            }`}
          />
        )}
      </div>
    </div>
  );
};

const SystemStatus = ({ totalScans = 0 }: Props) => {
  const { camera, recording, network, scanner, uploadQueue } = useVMSStore();

  const pendingUploads = uploadQueue.filter(
    (item) => item.status === "pending" || item.status === "uploading",
  ).length;

  return (
    <>
      <div className="grid grid-cols-6 gap-2 pb-5">
        <StatusCard
          title="Camera"
          value={
            camera.connected ? camera.deviceName || "Connected" : "Disconnected"
          }
          online={camera.connected}
        />

        <StatusCard
          title="Recording"
          value={recording.isRecording ? "Recording" : "Idle"}
          online={recording.isRecording}
        />

        <StatusCard
          title="Network"
          value={network.online ? "Online" : "Offline"}
          online={network.online}
        />

        <StatusCard
          title="Scanner"
          value={scanner.connected ? "Connected" : "Waiting"}
          online={scanner.connected}
        />

        <StatusCard title="Upload Queue" value={`${pendingUploads} Pending`} />

        <StatusCard title="Today Scans" value={String(totalScans)} />
      </div>
    </>
  );
};

export default SystemStatus;
