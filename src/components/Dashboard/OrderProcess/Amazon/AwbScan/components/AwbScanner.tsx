"use client";

import { useEffect, useRef, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Barcode } from "lucide-react";
import { ScanFeedbackMessage } from "../hooks/useAwbScanner";

interface Props {
  value: string;
  onChange: (val: string) => void;
  onScan: () => void;
  isScanning?: boolean;
  message?: ScanFeedbackMessage | null;
}

export default function AwbScanner({
  value,
  onChange,
  onScan,
  isScanning,
  message,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusAndSelectInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(0, input.value.length);
  }, []);

  // Initial focus and select on mount
  useEffect(() => {
    focusAndSelectInput();
  }, [focusAndSelectInput]);

  // When message updates (scan completed / error / warning), keep cursor and select text
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

  // Global keydown fallback: if user clicks outside accidentally, refocus input on typing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || tagName === "select") {
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!value.trim()) return;
      onScan();
      requestAnimationFrame(() => {
        focusAndSelectInput();
      });
      setTimeout(() => {
        focusAndSelectInput();
      }, 30);
    }
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    onScan();
    requestAnimationFrame(() => {
      focusAndSelectInput();
    });
    setTimeout(() => {
      focusAndSelectInput();
    });
  };

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#FFF9EC] dark:bg-[#E8C16D]/10 border border-[#E8C16D]/30 dark:border-[#E8C16D]/20 text-[#B88728] dark:text-[#F5C451] shrink-0">
                <Barcode className="h-4 w-4" />
              </div>
              <span>Scan Amazon AWB Tracking Barcode</span>
            </label>
            <span className="rounded-md bg-[#0A0E1A] dark:bg-[#131926] px-2 py-0.5 text-[11px] font-bold text-[#E8C16D] dark:text-[#F5C451]">
              AWB Only
            </span>
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
              placeholder="Scan Amazon AWB tracking barcode only..."
              autoComplete="off"
              spellCheck={false}
              className="
                h-12 sm:h-13
                w-full
                rounded-2xl
                border-2
                border-[#E8C16D]/70
                bg-[#FFFDF5] dark:bg-[#131926]
                focus:bg-white dark:focus:bg-[#131926]
                px-4
                pr-28
                text-sm sm:text-base
                font-mono
                font-bold
                text-[#0A0E1A] dark:text-white
                placeholder:text-slate-400 dark:placeholder:text-slate-500
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
              {isScanning ? "Scanning..." : "Submit"}
            </button>
          </div>
          <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Only the shipping AWB tracking barcode is valid.
          </p>
        </div>

        {/* Live Feedback Banner */}
        {message && (
          <div
            className={`rounded-2xl border p-3.5 sm:p-4 text-xs sm:text-sm font-semibold transition-all ${
              message.type === "success"
                ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300"
                : message.type === "warning"
                ? "border-amber-200 dark:border-amber-500/20 bg-amber-50/80 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300"
                : "border-red-200 dark:border-red-500/20 bg-red-50/80 dark:bg-red-500/10 text-red-900 dark:text-red-300"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : message.type === "warning" ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="leading-snug">{message.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
