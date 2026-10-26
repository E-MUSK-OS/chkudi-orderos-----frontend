"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Zap, ZapOff, Camera, AlertCircle, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";

interface MobileCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  message?: string;
}

export default function MobileCameraScanner({
  isOpen,
  onClose,
  onScan,
  message,
}: MobileCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Anti-duplicate debounce ref: 1.5s cooldown for identical barcode, 0ms for new barcode
  const lastScannedTimeRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  const stopCamera = useCallback(() => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping scanner controls:", e);
    }

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    } catch (e) {
      console.warn("Error stopping media tracks:", e);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  const handleBarcodeFound = useCallback((rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const now = Date.now();
    // Ignore duplicate reads of the exact same code within 1500ms
    if (lastScannedTimeRef.current.code === code && now - lastScannedTimeRef.current.time < 1500) {
      return;
    }

    lastScannedTimeRef.current = { code, time: now };
    setLastScannedCode(code);

    // Haptic vibration feedback on mobile
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(100);
      } catch {
        // Safe ignore
      }
    }

    onScan(code);
  }, [onScan]);

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const codeReader = new BrowserMultiFormatReader();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const controls = await codeReader.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleBarcodeFound(result.getText());
          }
        }
      );

      controlsRef.current = controls;

      // Extract active video track to inspect torch capability
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        streamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack as any).getCapabilities?.();
          if (capabilities && capabilities.torch) {
            setHasTorch(true);
          }
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("Camera scanner startup error:", err);
      setIsLoading(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Camera permission was denied. Please allow camera access in your browser settings to scan tracking IDs.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("No suitable camera found on this device.");
      } else {
        setErrorMsg(err.message || "Unable to start camera. Please ensure you are on HTTPS or localhost.");
      }
    }
  }, [handleBarcodeFound]);

  const toggleTorch = async () => {
    if (!streamRef.current || !hasTorch) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextState = !isTorchOn;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error("Error toggling torch:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  const isSuccess =
    message &&
    (message.toLowerCase().includes("success") || message.toLowerCase().includes("verified"));
  const isWarning = message && message.toLowerCase().includes("already scanned");
  const isError = message && !isSuccess && !isWarning;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between overflow-hidden animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#E8C16D] text-[#0A0E1A]">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Camera Barcode Scanner</h3>
            <p className="text-[10px] text-slate-300">Point at Tracking ID barcode</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2.5 rounded-xl border transition active:scale-95 cursor-pointer ${
                isTorchOn
                  ? "bg-[#E8C16D] text-[#0A0E1A] border-[#E8C16D]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
              title={isTorchOn ? "Turn Flash Off" : "Turn Flash On"}
            >
              {isTorchOn ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition active:scale-95 cursor-pointer"
            title="Close Camera"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Camera Viewport & Overlay */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Viewfinder Target Reticle */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-72 h-44 sm:w-80 sm:h-52 rounded-2xl border-2 border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] overflow-hidden">
            {/* 4 Corner Accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#E8C16D] rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#E8C16D] rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#E8C16D] rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#E8C16D] rounded-br-lg" />

            {/* Red Laser Scanner Line */}
            <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
          </div>

          <p className="mt-4 text-xs font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
            Align barcode within frame
          </p>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-3 text-white">
            <RefreshCw className="h-8 w-8 animate-spin text-[#E8C16D]" />
            <p className="text-sm font-bold">Starting camera...</p>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="absolute inset-4 z-30 flex flex-col items-center justify-center rounded-3xl bg-[#0F1626] border border-red-500/30 p-6 text-center text-white gap-4 max-w-sm mx-auto my-auto shadow-2xl">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/20 text-red-400">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="text-base font-bold text-red-400 mb-1">Camera Error</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={startCamera}
              className="px-5 py-2.5 rounded-xl bg-[#E8C16D] text-[#0A0E1A] font-bold text-xs hover:bg-[#d4af5a] transition active:scale-95 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Bottom Live Feedback Bar */}
      <div className="relative z-10 p-4 bg-black/75 backdrop-blur-md border-t border-white/10 space-y-2">
        {lastScannedCode && (
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 px-1">
            <span>Last Scanned:</span>
            <span className="font-bold text-[#E8C16D] text-sm break-all">{lastScannedCode}</span>
          </div>
        )}

        {message ? (
          <div
            className={`rounded-xl border p-2.5 text-xs font-semibold flex items-center gap-2 ${
              isSuccess
                ? "border-emerald-500/40 bg-emerald-950/60 text-emerald-300"
                : isWarning
                ? "border-amber-500/40 bg-amber-950/60 text-amber-300"
                : "border-red-500/40 bg-red-950/60 text-red-300"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : isWarning ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span className="truncate">{message}</span>
          </div>
        ) : (
          <p className="text-center text-[11px] text-slate-400">
            Scanning active. Results will update in real time.
          </p>
        )}
      </div>
    </div>
  );
}
