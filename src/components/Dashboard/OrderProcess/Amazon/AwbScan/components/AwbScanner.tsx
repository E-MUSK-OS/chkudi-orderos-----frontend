"use client";

import { useEffect, useRef, useCallback } from "react";
import { Barcode, CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from "lucide-react";
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
    }, 30);
  };

  return (
    <div className="border border-slate-700 bg-[#0F172A] p-5">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-lg font-medium text-white">
            Scan Amazon AWB Tracking Barcode
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
                h-12
                w-full
                border
                border-slate-700
                bg-[#111827]
                px-4
                pr-24
                text-sm sm:text-base
                font-mono
                text-white
                placeholder:text-slate-500
                outline-none
                transition
                focus:border-[#E8C16D]
              "
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim()}
              className="
                absolute
                right-2
                h-8
                bg-[#E8C16D]
                px-3.5
                text-xs
                font-black
                text-[#0A0E1A]
                transition
                hover:bg-[#d4a849]
                disabled:opacity-40
                disabled:cursor-not-allowed
                cursor-pointer
              "
            >
              {isScanning ? "Scanning..." : "Submit"}
            </button>
          </div>
        </div>

        {/* Live Feedback Banner */}
        {message && (
          <div
            className={`border p-3.5 text-sm font-medium transition-all ${
              message.type === "success"
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                : message.type === "warning"
                ? "border-amber-500/40 bg-amber-950/40 text-amber-300"
                : "border-rose-500/40 bg-rose-950/40 text-rose-300"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {message.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              ) : message.type === "warning" ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="leading-snug">{message.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
