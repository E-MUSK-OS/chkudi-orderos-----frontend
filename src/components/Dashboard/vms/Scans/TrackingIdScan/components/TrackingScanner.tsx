"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Barcode, CheckCircle2, AlertTriangle, AlertCircle, Camera } from "lucide-react";
import MobileCameraScanner from "./MobileCameraScanner";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
  onCameraScan?: (code: string) => void;
  message?: string;
}

export default function TrackingScanner({
  value,
  onChange,
  onScan,
  onCameraScan,
  message,
}: Props) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanActive, setIsScanActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusAndSelectInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(0, input.value.length);
  }, []);

  useEffect(() => {
    focusAndSelectInput();
  }, [focusAndSelectInput]);

  useEffect(() => {
    if (message) {
      setIsScanActive(true);
      const timer = setTimeout(() => setIsScanActive(false), 350);
      requestAnimationFrame(() => {
        focusAndSelectInput();
      });
      const t = setTimeout(() => {
        focusAndSelectInput();
      }, 30);
      return () => {
        clearTimeout(t);
        clearTimeout(timer);
      };
    }
  }, [message, focusAndSelectInput]);

  const triggerScan = useCallback(() => {
    // Strip hidden scanner prefix/suffix control characters
    const cleanValue = value.replace(/[\x00-\x1F\x7F]/g, "").trim();
    if (!cleanValue) return;

    if (cleanValue !== value) {
      onChange(cleanValue);
    }

    setIsScanActive(true);
    setTimeout(() => setIsScanActive(false), 350);

    onScan();
    setTimeout(() => {
      focusAndSelectInput();
    }, 30);
  }, [value, onChange, onScan, focusAndSelectInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Hardware handheld scanners typically emit Enter or Tab after reading
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      triggerScan();
    }
  };

  const handleSubmit = () => {
    triggerScan();
  };

  const isSuccess =
    message &&
    (message.toLowerCase().includes("success") ||
      message.toLowerCase().includes("verified"));
  const isWarning =
    message && message.toLowerCase().includes("already scanned");
  const isError = message && !isSuccess && !isWarning;

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-sm mb-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
              <div
                className={`grid h-7 w-7 place-items-center rounded-lg border transition-all duration-200 shrink-0 ${
                  isScanActive
                    ? "bg-[#E8C16D] border-[#E8C16D] text-[#0A0E1A] scale-110 shadow-[0_0_12px_#E8C16D]"
                    : "bg-[#FFF9EC] dark:bg-[#1A160E] border-[#E8C16D]/30 text-[#B88728] dark:text-[#E8C16D]"
                }`}
              >
                <Barcode className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span>Scan Tracking ID</span>
                <span className="text-[10px] font-normal text-slate-400 hidden sm:inline">
                  (Supports all USB/Bluetooth scanners & Mobile Camera)
                </span>
              </div>
            </label>

            {/* Mobile-Only: Camera Scanner Button (Hidden on tablet, laptop & desktop) */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#252014] text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Camera size={14} />
              <span>Camera Scan</span>
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={focusAndSelectInput}
              onClick={focusAndSelectInput}
              placeholder="Scan barcode or enter tracking ID..."
              autoComplete="off"
              spellCheck={false}
              className={`
                h-12 sm:h-13
                w-full
                rounded-2xl
                border-2
                bg-[#FFFDF5] dark:bg-[#080B11]
                focus:bg-white dark:focus:bg-[#0B0F17]
                px-4
                pr-28
                text-sm sm:text-base
                font-mono
                font-bold
                text-[#0A0E1A] dark:text-white
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                placeholder:font-normal
                outline-none
                transition-all
                duration-150
                ${
                  isScanActive
                    ? "border-emerald-400 ring-4 ring-emerald-400/25 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    : "border-[#E8C16D]/70 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
                }
              `}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="
                absolute
                right-2
                h-9 sm:h-9.5
                rounded-xl
                bg-[#E8C16D]
                px-4 sm:px-5
                text-xs sm:text-sm
                font-bold
                text-[#0A0E1A]
                transition
                hover:bg-[#d4af5a]
                active:scale-[0.98]
                disabled:opacity-40
                disabled:cursor-not-allowed
                cursor-pointer
                shadow-xs
              "
            >
              Submit
            </button>
          </div>
        </div>

        {/* Live Feedback Banner */}
        {message && (
          <div
            className={`rounded-2xl border p-3.5 sm:p-4 text-xs sm:text-sm font-semibold transition-all ${
              isSuccess
                ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300"
                : isWarning
                ? "border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300"
                : "border-red-200 dark:border-red-900/40 bg-red-50/80 dark:bg-red-950/40 text-red-900 dark:text-red-300"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {isSuccess ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              ) : isWarning ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              )}
              <div className="leading-snug">{message}</div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-Only: Camera Barcode Viewfinder Modal */}
      <MobileCameraScanner
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          setTimeout(() => focusAndSelectInput(), 50);
        }}
        onScan={(code) => {
          if (onCameraScan) {
            onCameraScan(code);
          } else {
            onChange(code);
            onScan();
          }
        }}
        message={message}
      />
    </div>
  );
}
