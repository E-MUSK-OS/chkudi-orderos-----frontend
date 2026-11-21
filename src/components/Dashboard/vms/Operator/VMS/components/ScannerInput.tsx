"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, AlertTriangle, QrCode, X } from "lucide-react";
import { toast } from "sonner";
import type { useCamera } from "../hooks/useCamera";
import type { useRecorder } from "../hooks/useRecorder";
import type { useScanner } from "../hooks/useScanner";
import Input from "@/components/ui/Input";
import { useVMSStore } from "../store/vmsStore";
import { isQrCode } from "../utils/validateTracking";
import QrCodeModal from "./QrCodeModal";

interface ScannerInputProps {
  camera: ReturnType<typeof useCamera>;
  recorder: ReturnType<typeof useRecorder>;
  scanner: ReturnType<typeof useScanner>;
}

const ScannerInput = ({ camera, recorder, scanner }: ScannerInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    processScan,
    processKeyboardInput,
    isProcessing,
  } = scanner;
  const { streamRef } = camera;
  const {
    startRecording,
    stopRecording,
    isRecorderRunning,
    queueNextRecording,
    clearNextRecording,
    stoppingRef,
  } = recorder;
  const [trackingId, setTrackingId] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ open: boolean; value: string }>({
    open: false,
    value: "",
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const playWarningSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/warning.wav");
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const focusAndSelectInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(0, input.value.length);
  }, []);

  const handleInvalidScan = useCallback(
    (value: string, message = "Not valid QR code", isQr = true) => {
      playWarningSound();
      setScanError(message);

      if (isQr) {
        toast.error("Not valid QR code", {
          description: "QR codes are not supported. Please scan the linear Barcode / Tracking ID.",
          duration: 4000,
        });
        setQrModal({
          open: true,
          value,
        });
      } else {
        toast.error(message, { duration: 3500 });
      }

      setTrackingId("");
      requestAnimationFrame(() => {
        focusAndSelectInput();
      });
    },
    [playWarningSound, focusAndSelectInput],
  );

  const handleTrackingId = (id: string, fromScanner: boolean) => {
    if (isQrCode(id)) {
      handleInvalidScan(id, "Not valid QR code", true);
      return;
    }

    const stream = streamRef.current;

    if (!stream) {
      console.warn("Camera not ready");
      return;
    }

    if (stoppingRef.current) {
      if (fromScanner) {
        queueNextRecording(stream, id);
      } else {
        clearNextRecording();
      }

      return;
    }

    if (isRecorderRunning()) {
      if (fromScanner) {
        queueNextRecording(stream, id);
      } else {
        clearNextRecording();
      }

      stopRecording();

      return;
    }

    if (fromScanner) {
      startRecording(stream, id);
    }
  };

  const handleSubmit = async (value?: string) => {
    const id = (value ?? trackingId).trim();

    console.log("SUBMIT =>", id);

    if (!id || isProcessing) return;

    // Direct QR check
    if (isQrCode(id)) {
      handleInvalidScan(id, "Not valid QR code", true);
      return;
    }

    try {
      const result = await processScan(id);

      if (!result?.success) {
        handleInvalidScan(id, result?.message || "Invalid tracking ID", result?.isQr ?? false);
        return;
      }

      setScanError(null);
      setQrModal({ open: false, value: "" });
      handleTrackingId(result.trackingId, false);
      requestAnimationFrame(() => {
        focusAndSelectInput();
      });
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleManualTypingBlocked = useCallback(() => {
    toast.warning("Manual keyboard typing is disabled. Please use barcode scanner.", {
      id: "scanner-only-hint",
      duration: 2500,
    });
  }, []);

  const clearInput = useCallback(() => {
    setTrackingId("");
    setScanError(null);
    requestAnimationFrame(() => {
      focusAndSelectInput();
    });
  }, [focusAndSelectInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // If QR modal is open and user presses a key, auto-close modal to allow smooth continuous scanning
      if (qrModal.open && (event.key === "Escape" || event.key === "Enter" || event.key === " ")) {
        setQrModal({ open: false, value: "" });
      }

      if (document.activeElement === inputRef.current) {
        event.preventDefault();
      }

      processKeyboardInput(
        event.key,
        async (id) => {
          setTrackingId(id);

          // QR check
          if (isQrCode(id)) {
            handleInvalidScan(id, "Not valid QR code", true);
            return;
          }

          const result = await processScan(id);

          if (!result?.success) {
            handleInvalidScan(id, result?.message || "Invalid tracking ID", result?.isQr ?? false);
            return;
          }

          setScanError(null);
          setQrModal({ open: false, value: "" });
          handleTrackingId(result.trackingId, true);

          requestAnimationFrame(() => {
            focusAndSelectInput();
          });
        },
        handleManualTypingBlocked,
      );
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [processKeyboardInput, qrModal.open, handleInvalidScan, handleManualTypingBlocked]);

  return (
    <div className="">
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <Input
              ref={inputRef}
              type="text"
              readOnly={true}
              value={trackingId}
              rightIcon={
                trackingId ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearInput();
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    title="Clear Tracking ID"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : undefined
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmit();
                  return;
                }
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                handleManualTypingBlocked();
              }}
              onDrop={(e) => {
                e.preventDefault();
              }}
              disabled={isProcessing}
              autoComplete="off"
              spellCheck={false}
              floatingLabel={false}
              placeholder="Scan tracking ID with scanner (Manual typing disabled)..."
              containerClassName="space-y-0"
              className="!h-11 sm:!h-12 w-full px-3.5 sm:px-4 bg-white dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white font-mono font-bold text-xs sm:text-sm border-2 border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D] outline-none shadow-xs rounded-xl sm:rounded-2xl placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 cursor-default"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isProcessing || !trackingId.trim()}
            className="h-11 sm:h-12 shrink-0 flex items-center justify-center gap-2 bg-[#0A0E1A] dark:bg-[#080B11] hover:bg-[#161D2E] dark:hover:bg-[#131926] border border-[#0A0E1A] dark:border-white/[0.08] px-4 sm:px-5 font-semibold text-xs sm:text-sm text-white dark:text-[#E8C16D] transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs rounded-xl sm:rounded-2xl"
          >
            <span>Submit</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Inline Error Notice */}
        {scanError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-300 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <span>{scanError}</span>
          </div>
        )}

        {isProcessing && (
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 animate-pulse">Processing scan...</p>
        )}
      </div>

      {/* Dedicated QR Code Popup Modal */}
      <QrCodeModal
        open={qrModal.open}
        scannedValue={qrModal.value}
        onClose={() => {
          setQrModal({ open: false, value: "" });
          focusAndSelectInput();
        }}
      />
    </div>
  );
};

export default ScannerInput;
