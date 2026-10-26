"use client";

import React from "react";

import {
  CameraPreview,
  ScannerInput,
  UploadQueue,
  RecentScans,
  SystemStatus,
} from "./components";

import { LogOut } from "lucide-react";
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
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 py-3.5 min-w-[140px] shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Operator</p>
            <p className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white truncate">
              {operator?.operatorName ?? "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 py-3.5 min-w-[140px] shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Account</p>
            <p className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white truncate">
              {selectedAccount?.accountName ?? "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-3.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 shadow-sm transition-colors cursor-pointer"
            title="Logout Operator"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <CameraPreview camera={camera} />

      <UploadQueue />

      <RecentScans scanner={scanner} />
    </>
  );
};

export default OperatorContent;
