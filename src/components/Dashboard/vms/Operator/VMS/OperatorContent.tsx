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
    const operatorData = localStorage.getItem("operator");
    const accountData = localStorage.getItem("selectedAccount");

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
      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Scanner */}
        <div className="flex-1">
          <ScannerInput camera={camera} recorder={recorder} scanner={scanner} />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <div className="rounded-2xl border border-[#E7E0D2] bg-white px-5 py-3.5 min-w-[140px] shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Operator</p>
            <p className="text-base sm:text-lg font-bold text-[#0A0E1A] truncate">
              {operator?.operatorName ?? "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E7E0D2] bg-white px-5 py-3.5 min-w-[140px] shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Account</p>
            <p className="text-base sm:text-lg font-bold text-[#0A0E1A] truncate">
              {selectedAccount?.accountName ?? "-"}
            </p>
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
