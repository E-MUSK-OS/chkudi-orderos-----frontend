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
    <div className="border border-[#E7E0D2] bg-white p-5 sm:p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <label className="mb-2 flex items-center gap-2 text-base sm:text-lg font-bold text-[#0A0E1A]">
            <Barcode className="h-5 w-5 text-[#B88728]" />
            <span>Scan Amazon AWB Tracking Barcode</span>
          </label>

          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={focusAndSelectInput}
              onClick={focusAndSelectInput}
              placeholder="Scan AWB barcode or enter tracking ID..."
              autoComplete="off"
              spellCheck={false}
              className="
                h-12 sm:h-14
                w-full
                border-2
                border-[#E8C16D]
                bg-[#FFF9EC]
                px-4
                pr-28
                text-sm sm:text-base
                font-mono
                font-bold
                text-[#0A0E1A]
                placeholder:text-slate-500
                placeholder:font-normal
                outline-none
                transition
                focus:ring-2
                focus:ring-[#E8C16D]
              "
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="
                absolute
                right-2
                h-9 sm:h-10
                bg-[#E8C16D]
                px-4 sm:px-5
                text-xs sm:text-sm
                font-bold
                text-[#0A0E1A]
                transition
                hover:bg-[#d4a849]
                disabled:opacity-40
                disabled:cursor-not-allowed
                cursor-pointer
                shadow-xs
              "
            >
              {isScanning ? "Scanning..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Live Feedback Banner */}
        {message && (
          <div
            className={`border p-3.5 text-xs sm:text-sm font-medium transition-all ${
              message.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : message.type === "warning"
                ? "border-amber-300 bg-amber-50 text-amber-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              ) : message.type === "warning" ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
              )}
              <div className="leading-snug">{message.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
