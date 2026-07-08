"use client";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import React from "react";
import { ScannerInput, CameraPreview, UploadQueue, RecentScans, SystemStatus } from "./components";
import { useCamera } from "./hooks/useCamera";
import { useRecorder } from "./hooks/useRecorder";
import { useScanner } from "./hooks/useScanner";

const OperatorVMS = () => {
  const camera = useCamera();
  const recorder = useRecorder();
  const scanner = useScanner();
  return (
    <DashboardLayout title="Operator VMS">
      <div>
        {/* <CameraPreview camera={camera} recorder={recorder} /> */}
        <SystemStatus />
        <CameraPreview camera={camera} />

        <ScannerInput camera={camera} recorder={recorder} scanner={scanner} />
        <UploadQueue />
        <RecentScans scanner={scanner} />
        {/* <VMSHeader /> */}

        {/* <SystemStatus /> */}

        {/* <RecordingStatus /> */}

        {/* <ManualTrackingInput /> */}

        {/* <CameraPreview camera={camera} />
        <ScannerInput camera={camera} recorder={recorder} scanner={scanner} /> */}

        {/* <SessionInfo /> */}

        {/* <UploadQueue /> */}

        {/* <RecentScans /> */}
      </div>
    </DashboardLayout>
  );
};

export default OperatorVMS;
