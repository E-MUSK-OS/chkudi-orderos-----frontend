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

  const [operator, setOperator] = React.useState<{
    operatorName: string;
  } | null>(null);

  const [selectedAccount, setSelectedAccount] = React.useState<{
    accountName: string;
  } | null>(null);

  React.useEffect(() => {
    const operatorData = sessionStorage.getItem("operator");
    const accountData = sessionStorage.getItem("selectedAccount");

    if (operatorData) {
      setOperator(JSON.parse(operatorData));
    }

    if (accountData) {
      setSelectedAccount(JSON.parse(accountData));
    }
  }, []);

  return (
    <>
      {/* <div className="mb-4 flex justify-between">
        <div className="w-full">
          <ScannerInput camera={camera} recorder={recorder} scanner={scanner} />
        </div>
      </div> */}
      <div className="mb-4 flex gap-4">
        {/* Scanner */}
        <div className="flex-1">
          <ScannerInput camera={camera} recorder={recorder} scanner={scanner} />
        </div>

        <div className="w-80">

          <div className="flex gap-3">
            <div className="border px-5 py-3 w-40">
              <p className="text-sm text-gray-500">Operator</p>
              <p className=" text-gray-900 text-lg">
                {operator?.operatorName ?? "-"}
              </p>
            </div>

            <div className="border px-5 py-3 w-40">
              <p className="text-sm text-gray-500">Account</p>
              <p className="text-gray-900 text-lg">
                {selectedAccount?.accountName ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CameraPreview camera={camera} />

      <UploadQueue />

      <RecentScans scanner={scanner} />
    </>
  );
};

export default OperatorContent;
