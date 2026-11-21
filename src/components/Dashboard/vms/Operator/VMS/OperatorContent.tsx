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
import FlipkartVMSOperator from "./components/FlipkartVMSOperator";
import { isFlipkartAccountName } from "../auth/components/OperatorLoginForm";

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

  const isFromOrderProcess = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const fromUrl = new URLSearchParams(window.location.search).get("from") === "order_process";
    const fromSession = sessionStorage.getItem("vms_from_order_process") === "true";
    const fromLocal = localStorage.getItem("vms_from_order_process") === "true";
    return Boolean(fromUrl || fromSession || fromLocal);
  }, []);

  const isFlipkartAutomated = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const isSourceFlipkart =
      /(flip|filp)[kc]art/i.test(sessionStorage.getItem("vms_source") || "") ||
      /(flip|filp)[kc]art/i.test(localStorage.getItem("vms_source") || "") ||
      /(flip|filp)[kc]art/i.test(window.location.search);

    const isFlipkartAccount = isFlipkartAccountName(selectedAccount?.accountName);

    // Flipkart Automated Order Process integration ONLY activates when navigating from Order Process
    return Boolean((isSourceFlipkart || isFlipkartAccount) && isFromOrderProcess);
  }, [selectedAccount, isFromOrderProcess]);

  if (isFlipkartAutomated) {
    return (
      <FlipkartVMSOperator
        camera={camera}
        recorder={recorder}
        scanner={scanner}
        onLogout={onLogout}
        operator={operator}
        selectedAccount={selectedAccount}
        isFromOrderProcess={isFromOrderProcess}
      />
    );
  }

  return (
    <>
      {/* <div className="mb-4 flex justify-between">
        <div className="w-full">
          <ScannerInput camera={camera} recorder={recorder} scanner={scanner} />
        </div>
      </div> */}
      <div className="mb-6 flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center">
        {/* Scanner */}
        <div className="flex-1 min-w-0">
          <ScannerInput camera={camera} recorder={recorder} scanner={scanner} />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <div className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 min-w-[120px] shadow-xs flex flex-col justify-center shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">Operator</p>
            <p className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white truncate leading-tight mt-0.5">
              {operator?.operatorName ?? "-"}
            </p>
          </div>

          <div className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 min-w-[120px] shadow-xs flex flex-col justify-center shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">Account</p>
            <p className="text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white truncate leading-tight mt-0.5">
              {selectedAccount?.accountName ?? "-"}
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (recorder?.isRecording) {
                recorder.stopRecording();
              }
              if (typeof window !== "undefined") {
                localStorage.removeItem("vms_source");
                localStorage.removeItem("vms_from_order_process");
                sessionStorage.removeItem("vms_source");
                sessionStorage.removeItem("vms_from_order_process");
                window.history.replaceState(null, "", window.location.pathname);
              }
              await onLogout();
            }}
            className="h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 shadow-xs transition-colors cursor-pointer shrink-0"
            title="Logout Operator"
          >
            <LogOut className="h-3.5 w-3.5" />
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
