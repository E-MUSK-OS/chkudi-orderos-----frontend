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

interface OperatorContentProps {
  onLogout: () => void;
}

const OperatorContent = ({ onLogout }: OperatorContentProps) => {
  useHeartbeat();
  
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

      {/* <SystemStatus /> */}

      <CameraPreview camera={camera} />

      <ScannerInput camera={camera} recorder={recorder} scanner={scanner} />

      <UploadQueue />

      <RecentScans scanner={scanner} />
    </>
  );
};

export default OperatorContent;
