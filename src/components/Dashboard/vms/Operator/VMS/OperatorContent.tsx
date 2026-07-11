"use client";

import React from "react";

import {
  CameraPreview,
  ScannerInput,
  UploadQueue,
  RecentScans,
  SystemStatus,
} from "./components";

import { useCamera } from "./hooks/useCamera";
import { useRecorder } from "./hooks/useRecorder";
import { useScanner } from "./hooks/useScanner";
import { useHeartbeat } from "../auth/hooks/useHeartbeat";
import { useVMSStore } from "./store/vmsStore";

interface OperatorContentProps {
  onLogout: () => void;
}

const OperatorContent = ({ onLogout }: OperatorContentProps) => {
  useHeartbeat();
  const { session, setSession } = useVMSStore();

  const camera = useCamera();
  const recorder = useRecorder();
  const scanner = useScanner();

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={onLogout}
          className="bg-[#0A0E1A] px-5 py-3 text-white text-lg"
        >
          Operato Logout
        </button>
      </div>

      {!session.isActive ? (
        <button
          onClick={() =>
            setSession({
              isActive: true,
            })
          }
        >
          Start Session
        </button>
      ) : (
        <button onClick={handleStopSession}>Stop Session</button>
      )}

      {/* <SystemStatus /> */}

      <CameraPreview camera={camera} />

      <ScannerInput camera={camera} recorder={recorder} scanner={scanner} />

      <UploadQueue />

      <RecentScans scanner={scanner} />
    </>
  );
};

export default OperatorContent;
