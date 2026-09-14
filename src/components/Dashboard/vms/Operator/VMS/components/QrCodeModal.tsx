"use client";

import React, { useEffect } from "react";
import { AlertTriangle, QrCode, X, Check } from "lucide-react";
import Button from "@/components/ui/Button";

interface QrCodeModalProps {
  open: boolean;
  scannedValue?: string;
  onClose: () => void;
}

export default function QrCodeModal({
  open,
  scannedValue = "",
  onClose,
}: QrCodeModalProps) {
  // Auto-dismiss after 3.5 seconds so operator's flow is uninterrupted
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3500);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Enter, Space, Escape, or any next scan key
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-red-500 bg-white shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          title="Close (or press Enter/Escape)"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-8 text-center">
          {/* Animated Warning Icon */}
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 border-4 border-red-50 shadow-inner">
            <div className="relative flex items-center justify-center">
              <QrCode className="h-10 w-10 text-red-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-1.5 rotate-45 rounded-full bg-red-600 ring-2 ring-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A0E1A] tracking-tight">
            Not Valid QR Code
          </h2>

          <p className="mt-2 text-sm sm:text-base font-semibold text-red-600">
            QR codes cannot be used for VMS recording.
          </p>

          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Please scan the package's <span className="font-bold text-slate-800">Linear Barcode (Tracking ID / AWB)</span>, not the QR code.
          </p>

          {/* Scanned Value Preview */}
          {scannedValue && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">
                  Scanned Value (QR Payload)
                </span>
                <span className="text-[10px] font-semibold text-red-500">
                  {scannedValue.length} characters
                </span>
              </div>
              <p className="font-mono text-xs font-semibold text-red-900 break-all line-clamp-3 select-all">
                {scannedValue}
              </p>
            </div>
          )}

          {/* Helper Advice Banner */}
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 text-left flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold">Tip:</span> Point the red scanner beam directly at the long 1D barcode on the shipping label.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <Button
              fullWidth
              size="md"
              onClick={onClose}
              className="bg-[#0A0E1A] hover:bg-[#161D2E] text-white font-bold py-3.5 shadow-md rounded-xl"
            >
              <Check className="h-5 w-5 mr-1" />
              OK / Scan Again
            </Button>
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-slate-600 font-mono">Enter</kbd>, <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-slate-600 font-mono">Space</kbd>, or scan next barcode to dismiss
          </p>
        </div>
      </div>
    </div>
  );
}
