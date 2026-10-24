"use client";

import { useEffect, useRef, useCallback } from "react";
import { Barcode, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
  message?: string;
}

export default function TrackingScanner({
  value,
  onChange,
  onScan,
  message,
}: Props) {
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
      requestAnimationFrame(() => {
        focusAndSelectInput();
      });
      const t = setTimeout(() => {
        focusAndSelectInput();
      }, 30);
      return () => clearTimeout(t);
    }
  }, [message, focusAndSelectInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!value.trim()) return;
      onScan();
      setTimeout(() => {
        focusAndSelectInput();
      }, 30);
    }
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    onScan();
    setTimeout(() => {
      focusAndSelectInput();
    }, 30);
  };

  const isSuccess =
    message &&
    (message.toLowerCase().includes("success") ||
      message.toLowerCase().includes("verified"));
  const isWarning =
    message && message.toLowerCase().includes("already scanned");
  const isError = message && !isSuccess && !isWarning;

  return (
    <div className="rounded-3xl border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm mb-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-[#0A0E1A]">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF9EC] border border-[#E8C16D]/30 text-[#B88728] shrink-0">
                <Barcode className="h-4 w-4" />
              </div>
              <span>Scan Tracking ID</span>
            </label>
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
              className="
                h-12 sm:h-13
                w-full
                rounded-2xl
                border-2
                border-[#E8C16D]/70
                bg-[#FFFDF5]
                focus:bg-white
                px-4
                pr-28
                text-sm sm:text-base
                font-mono
                font-bold
                text-[#0A0E1A]
                placeholder:text-slate-400
                placeholder:font-normal
                outline-none
                transition
                focus:border-[#E8C16D]
                focus:ring-2
                focus:ring-[#E8C16D]/30
              "
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
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                : isWarning
                ? "border-amber-200 bg-amber-50/80 text-amber-900"
                : "border-red-200 bg-red-50/80 text-red-900"
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
    </div>
  );
}
