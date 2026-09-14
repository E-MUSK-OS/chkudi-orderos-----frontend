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
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="w-[85%]">
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
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                    title="Clear Tracking ID"
                  >
                    <X className="h-4 w-4" />
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
              placeholder="Scan barcode with scanner (Manual typing disabled)..."
              className="flex-1 px-4 py-3 w-full bg-white text-[#0A0E1A] font-mono font-bold text-sm sm:text-base border-2 border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D] outline-none shadow-xs rounded-lg placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 cursor-default"
            />
          </div>

          <div className="w-[15%]">
            <button
              onClick={() => handleSubmit()}
              disabled={isProcessing || !trackingId.trim()}
              className="w-full h-full flex gap-3 justify-center items-center bg-[#0A0E1A] hover:bg-[#161D2E] px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm rounded-lg"
            >
              Submit
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Inline Error Notice */}
        {scanError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 animate-in fade-in slide-in-from-top-1">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <span>{scanError}</span>
          </div>
        )}

        {isProcessing && (
          <p className="text-sm font-semibold text-blue-600 animate-pulse">Processing scan...</p>
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
