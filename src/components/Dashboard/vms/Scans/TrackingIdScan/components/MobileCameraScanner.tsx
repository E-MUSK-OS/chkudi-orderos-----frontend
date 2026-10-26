"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Zap,
  ZapOff,
  Camera,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Scan,
  ZoomIn,
} from "lucide-react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface MobileCameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  message?: string;
}

type PermissionStatus = "checking" | "prompt" | "granted" | "denied" | "unsupported";

// Logistics and courier barcode formats prioritized for instant matching
const FAST_BARCODE_FORMATS: BarcodeFormat[] = [
  BarcodeFormat.CODE_128, // Flipkart, Delhivery, Amazon, Ekart, Bluedart, Myntra, etc.
  BarcodeFormat.CODE_39, // Industrial & warehouse inventory
  BarcodeFormat.QR_CODE, // 2D QR tracking labels
  BarcodeFormat.EAN_13, // Standard retail packages
  BarcodeFormat.DATA_MATRIX, // 2D courier & pharmaceutical tags
  BarcodeFormat.ITF, // Interleaved 2 of 5 / shipping master cartons
  BarcodeFormat.UPC_A, // Retail standard
  BarcodeFormat.PDF_417, // Airway bills & postal barcodes
  BarcodeFormat.CODE_93, // High density alphanumeric
  BarcodeFormat.CODABAR, // Courier airway bills
  BarcodeFormat.EAN_8, // Small retail items
  BarcodeFormat.UPC_E, // Compact UPC
];

const NATIVE_FORMATS = [
  "code_128",
  "code_39",
  "qr_code",
  "ean_13",
  "data_matrix",
  "itf",
  "upc_a",
  "pdf417",
  "code_93",
  "codabar",
  "ean_8",
  "upc_e",
];

export default function MobileCameraScanner({
  isOpen,
  onClose,
  onScan,
  message,
}: MobileCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isStoppingRef = useRef(false);

  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("checking");
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Active reading / catching feedback animation state
  const [isReading, setIsReading] = useState(false);
  const [readingCode, setReadingCode] = useState<string | null>(null);

  // Anti-duplicate debounce ref: 1200ms cooldown for identical barcode, 0ms for new barcode
  const lastScannedTimeRef = useRef<{ code: string; time: number }>({ code: "", time: 0 });

  // Native Web Audio API scanner beep for instant acoustic confirmation (1800Hz, 80ms)
  const playBeepSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Safe ignore
    }
  }, []);

  const stopCamera = useCallback(() => {
    isStoppingRef.current = true;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

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
    setHasHardwareZoom(false);
    setCurrentZoom(1);
    setIsLoading(false);
    setIsReading(false);
  }, []);

  const handleBarcodeFound = useCallback(
    (rawCode: string) => {
      // Clean extracted barcode: strip control characters, whitespace, or carriage returns
      const code = rawCode.replace(/[\x00-\x1F\x7F]/g, "").trim();
      if (!code) return;

      const now = Date.now();
      // Ignore duplicate reads of identical barcode within 1200ms
      if (lastScannedTimeRef.current.code === code && now - lastScannedTimeRef.current.time < 1200) {
        return;
      }

      lastScannedTimeRef.current = { code, time: now };
      setLastScannedCode(code);
      setReadingCode(code);

      // Instant 0ms acoustic & tactile feedback
      playBeepSound();
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([60, 40, 60]);
        } catch {
          // Safe ignore
        }
      }

      // Trigger vibrant "Reading / Barcode Caught" animation
      setIsReading(true);

      onScan(code);

      setTimeout(() => {
        setIsReading(false);
      }, 450);
    },
    [onScan, playBeepSound]
  );

  const applyZoom = useCallback(async (newZoom: number) => {
    setCurrentZoom(newZoom);
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = (track as any).getCapabilities?.();
      if (capabilities && "zoom" in capabilities) {
        const minZ = capabilities.zoom.min || 1;
        const maxZ = capabilities.zoom.max || 10;
        const clampedZoom = Math.min(Math.max(newZoom, minZ), maxZ);
        await (track as any).applyConstraints({
          advanced: [{ zoom: clampedZoom }],
        });
      }
    } catch (err) {
      console.warn("Hardware zoom error, using digital zoom fallback:", err);
    }
  }, []);

  const startStreamWithScanner = useCallback(
    async (stream: MediaStream) => {
      streamRef.current = stream;
      isStoppingRef.current = false;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack as any).getCapabilities?.();
        if (capabilities) {
          if (capabilities.torch) {
            setHasTorch(true);
          }
          if ("zoom" in capabilities) {
            setHasHardwareZoom(true);
          }
          // Enable continuous autofocus for sharp barcode lines
          if (capabilities.focusMode && capabilities.focusMode.includes("continuous")) {
            try {
              await (videoTrack as any).applyConstraints({
                advanced: [{ focusMode: "continuous" }],
              });
            } catch {
              // Ignore focus constraint failure
            }
          }
        }
      }

      const videoEl = videoRef.current;
      if (!videoEl) {
        setIsLoading(false);
        return;
      }

      // Check if native BarcodeDetector is supported (Runs in C++ on GPU/NPU at 60 FPS)
      let nativeDetectorStarted = false;
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const BarcodeDetectorClass = (window as any).BarcodeDetector;
          const supported: string[] =
            (await BarcodeDetectorClass.getSupportedFormats?.()) || [];
          const activeFormats = NATIVE_FORMATS.filter(
            (f) => supported.length === 0 || supported.includes(f)
          );

          const nativeDetector = new BarcodeDetectorClass({ formats: activeFormats });

          // Non-blocking concurrency lock to prevent promise queue congestion
          let isDetecting = false;

          const scanNativeLoop = async () => {
            if (isStoppingRef.current) return;
            if (!videoEl || videoEl.readyState < 2) {
              rafIdRef.current = requestAnimationFrame(scanNativeLoop);
              return;
            }

            if (!isDetecting) {
              isDetecting = true;
              try {
                const barcodes = await nativeDetector.detect(videoEl);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleBarcodeFound(barcodes[0].rawValue);
                }
              } catch {
                // Ignore transient frame read error
              } finally {
                isDetecting = false;
              }
            }

            if (!isStoppingRef.current) {
              rafIdRef.current = requestAnimationFrame(scanNativeLoop);
            }
          };

          nativeDetectorStarted = true;
          rafIdRef.current = requestAnimationFrame(scanNativeLoop);
        } catch (e) {
          console.warn("Native BarcodeDetector init failed, will use ZXing fallback:", e);
        }
      }

      // If native BarcodeDetector is NOT active, run optimized ZXing fallback
      // (Do NOT run both simultaneously to avoid CPU starvation and GC stutters)
      if (!nativeDetectorStarted) {
        try {
          const hints = new Map<DecodeHintType, any>();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, FAST_BARCODE_FORMATS);

          const codeReader = new BrowserMultiFormatReader(hints, {
            delayBetweenScanAttempts: 40,
            delayBetweenScanSuccess: 450,
          });

          const controls = await codeReader.decodeFromStream(
            stream,
            videoEl,
            (result, _error) => {
              if (result) {
                handleBarcodeFound(result.getText());
              }
            }
          );
          controlsRef.current = controls;
        } catch (err) {
          console.warn("ZXing fallback decode error:", err);
        }
      }

      setIsLoading(false);
    },
    [handleBarcodeFound]
  );

  const requestPermissionAndStart = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus("unsupported");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Request Full HD 1080p resolution so barcodes at a distance have crisp pixel definition
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { min: 1280, ideal: 1920, max: 3840 },
          height: { min: 720, ideal: 1080, max: 2160 },
          frameRate: { ideal: 60, min: 30 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      sessionStorage.setItem("vms_camera_permission_granted", "true");
      setPermissionStatus("granted");
      await startStreamWithScanner(stream);
    } catch (err: any) {
      console.error("Camera permission / startup error:", err);
      setIsLoading(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionStatus("denied");
        setErrorMsg("Camera permission was denied. Please allow camera access in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setPermissionStatus("unsupported");
        setErrorMsg("No suitable camera found on this device.");
      } else {
        setErrorMsg(err.message || "Unable to access camera.");
      }
    }
  }, [startStreamWithScanner]);

  const checkInitialPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus("unsupported");
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const status = await navigator.permissions.query({ name: "camera" as PermissionName });
        if (status.state === "granted") {
          setPermissionStatus("granted");
          requestPermissionAndStart();
          return;
        } else if (status.state === "denied") {
          setPermissionStatus("denied");
          return;
        } else {
          setPermissionStatus("prompt");
          return;
        }
      } catch {
        // Fallback for browsers where camera query throws
      }
    }

    const sessionGranted =
      typeof window !== "undefined" &&
      sessionStorage.getItem("vms_camera_permission_granted") === "true";

    if (sessionGranted) {
      requestPermissionAndStart();
    } else {
      setPermissionStatus("prompt");
    }
  }, [requestPermissionAndStart]);

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
      checkInitialPermission();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, checkInitialPermission, stopCamera]);

  if (!isOpen) return null;

  const isSuccess =
    message &&
    (message.toLowerCase().includes("success") || message.toLowerCase().includes("verified"));
  const isWarning = message && message.toLowerCase().includes("already scanned");

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between overflow-hidden animate-in fade-in duration-150">
      {/* 60FPS CSS Scanning & Reading Keyframes */}
      <style>{`
        @keyframes laserSweepAnim {
          0% {
            top: 4%;
            opacity: 0.85;
          }
          50% {
            top: 92%;
            opacity: 1;
          }
          100% {
            top: 4%;
            opacity: 0.85;
          }
        }
        @keyframes sweepAuraAnim {
          0% {
            top: 0%;
            opacity: 0.35;
          }
          50% {
            top: 70%;
            opacity: 0.65;
          }
          100% {
            top: 0%;
            opacity: 0.35;
          }
        }
      `}</style>

      {/* Top Header Bar */}
      <div className="relative z-30 flex items-center justify-between px-4 py-3 bg-black/75 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8.5 w-8.5 place-items-center rounded-xl bg-[#E8C16D] text-[#0A0E1A] shadow-md shadow-[#E8C16D]/20">
            <Scan className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold leading-tight">Ultra Barcode Scanner</h3>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                1080p Turbo
              </span>
            </div>
            <p className="text-[10px] text-slate-300">Long-Distance & All Barcodes Active</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && permissionStatus === "granted" && (
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

      {/* Main Viewport Area */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {/* Video stream with digital zoom scaling support */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            transform: !hasHardwareZoom && currentZoom > 1 ? `scale(${currentZoom})` : "none",
            transformOrigin: "center center",
            transition: "transform 0.2s ease-out",
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            permissionStatus === "granted" ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* 1. STATE: Checking Permissions */}
        {permissionStatus === "checking" && (
          <div className="relative z-20 flex flex-col items-center justify-center gap-3 text-white">
            <RefreshCw className="h-8 w-8 animate-spin text-[#E8C16D]" />
            <p className="text-xs font-semibold text-slate-300">Checking camera permissions...</p>
          </div>
        )}

        {/* 2. STATE: Prompt for Camera Permission */}
        {permissionStatus === "prompt" && (
          <div className="relative z-20 flex flex-col items-center justify-center px-6 max-w-sm mx-auto text-center text-white animate-in zoom-in-95 duration-200">
            <div className="relative mb-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#E8C16D]/20 border border-[#E8C16D]/40 text-[#E8C16D] shadow-lg shadow-[#E8C16D]/10">
                <Camera size={32} />
              </div>
              <div className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-[#E8C16D] text-[#0A0E1A]">
                <ShieldCheck size={14} />
              </div>
            </div>

            <h4 className="text-lg font-bold text-white mb-2">Camera Access Required</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              OrderOS needs access to your device camera to quickly scan package Tracking ID
              barcodes from any distance without manual typing.
            </p>

            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={requestPermissionAndStart}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#E8C16D] text-[#0A0E1A] font-bold text-sm hover:bg-[#d4af5a] transition active:scale-[0.98] shadow-lg shadow-[#E8C16D]/20 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Requesting access...</span>
                  </>
                ) : (
                  <>
                    <Camera size={18} />
                    <span>Allow Camera Access</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel / Enter Manually
              </button>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/5 border border-white/10 rounded-full px-3 py-1">
              <Lock size={12} className="text-[#E8C16D]" />
              <span>Camera feed is processed locally in your browser</span>
            </div>
          </div>
        )}

        {/* 3. STATE: Permission Denied / Blocked */}
        {permissionStatus === "denied" && (
          <div className="relative z-20 flex flex-col items-center justify-center px-6 max-w-sm mx-auto text-center text-white animate-in zoom-in-95 duration-200">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 mb-4 shadow-lg shadow-red-500/10">
              <ShieldAlert size={32} />
            </div>

            <h4 className="text-lg font-bold text-red-400 mb-2">Camera Access Blocked</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Your browser has blocked camera permissions for OrderOS. To enable scanning:
            </p>

            <div className="w-full rounded-2xl bg-[#0F1626]/90 border border-white/10 p-3.5 text-left mb-6 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#E8C16D] text-[#0A0E1A] text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>Tap the 🔒 lock / tune icon in your mobile browser address bar.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#E8C16D] text-[#0A0E1A] text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>Select <strong>Permissions</strong> or <strong>Camera</strong> and toggle to <strong>Allow</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-[#E8C16D] text-[#0A0E1A] text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>Tap the <strong>Try Again</strong> button below.</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={requestPermissionAndStart}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#E8C16D] text-[#0A0E1A] font-bold text-sm hover:bg-[#d4af5a] transition active:scale-[0.98] shadow-lg shadow-[#E8C16D]/20 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Retrying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    <span>Try Again</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* 4. STATE: Camera Unsupported */}
        {permissionStatus === "unsupported" && (
          <div className="relative z-20 flex flex-col items-center justify-center px-6 max-w-sm mx-auto text-center text-white animate-in zoom-in-95 duration-200">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
              <AlertTriangle size={32} />
            </div>

            <h4 className="text-lg font-bold text-amber-400 mb-2">Camera Not Available</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {errorMsg ||
                "Camera access is not supported on this browser or connection. Please ensure you are connected securely via HTTPS."}
            </p>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* 5. STATE: Granted - Dynamic Animated Viewfinder Reticle */}
        {permissionStatus === "granted" && (
          <div className="relative z-10 flex flex-col items-center pointer-events-none px-4 w-full">
            {/* Viewfinder Targeting Box - Wider reticle for wide 1D barcodes from distance */}
            <div
              className={`relative w-[88%] max-w-[360px] h-52 sm:h-56 rounded-2xl overflow-hidden transition-all duration-200 ${
                isReading
                  ? "border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65),0_0_35px_#10b981,inset_0_0_25px_rgba(16,185,129,0.35)]"
                  : "border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              }`}
            >
              {/* 4 Glowing Corner Accents */}
              <div
                className={`absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 rounded-tl-lg transition-colors duration-150 ${
                  isReading
                    ? "border-emerald-400 shadow-[0_0_15px_#10b981]"
                    : "border-[#E8C16D] shadow-[0_0_10px_#E8C16D]"
                }`}
              />
              <div
                className={`absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 rounded-tr-lg transition-colors duration-150 ${
                  isReading
                    ? "border-emerald-400 shadow-[0_0_15px_#10b981]"
                    : "border-[#E8C16D] shadow-[0_0_10px_#E8C16D]"
                }`}
              />
              <div
                className={`absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 rounded-bl-lg transition-colors duration-150 ${
                  isReading
                    ? "border-emerald-400 shadow-[0_0_15px_#10b981]"
                    : "border-[#E8C16D] shadow-[0_0_10px_#E8C16D]"
                }`}
              />
              <div
                className={`absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 rounded-br-lg transition-colors duration-150 ${
                  isReading
                    ? "border-emerald-400 shadow-[0_0_15px_#10b981]"
                    : "border-[#E8C16D] shadow-[0_0_10px_#E8C16D]"
                }`}
              />

              {/* Dynamic Scanning Laser Beam & Sweep Aura */}
              {!isReading ? (
                <>
                  {/* Trailing Sweep Aura */}
                  <div
                    className="absolute inset-x-0 h-20 bg-gradient-to-b from-[#E8C16D]/25 via-[#E8C16D]/5 to-transparent pointer-events-none"
                    style={{ animation: "sweepAuraAnim 2.2s ease-in-out infinite" }}
                  />

                  {/* High-Tech Animated Laser Line */}
                  <div
                    className="absolute inset-x-1 h-1 bg-gradient-to-r from-transparent via-[#E8C16D] to-transparent shadow-[0_0_14px_#E8C16D,0_0_28px_#E8C16D] pointer-events-none"
                    style={{ animation: "laserSweepAnim 2.2s ease-in-out infinite" }}
                  />
                </>
              ) : (
                /* Instant "Barcode Caught" Flash Line */
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_30px_#10b981] animate-in fade-in zoom-in-95 duration-150" />
              )}

              {/* Center Barcode Detected / Caught HUD Overlay */}
              {isReading && (
                <div className="absolute inset-0 flex items-center justify-center p-3 animate-in zoom-in-90 fade-in duration-150">
                  <div className="px-4 py-2 rounded-2xl bg-emerald-500 text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.9)] border border-emerald-300">
                    <CheckCircle2 size={18} className="stroke-[3]" />
                    <span className="truncate max-w-[220px]">CAUGHT: {readingCode}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Distance Zoom Controls (1x, 1.5x, 2x, 3x) */}
            <div className="mt-4 flex items-center gap-2 pointer-events-auto">
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/15 rounded-full p-1 shadow-xl">
                <div className="pl-2 pr-1 text-slate-400">
                  <ZoomIn size={13} />
                </div>
                {[1, 1.5, 2, 3].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => applyZoom(z)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      currentZoom === z
                        ? "bg-[#E8C16D] text-[#0A0E1A] shadow-md shadow-[#E8C16D]/30"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {z}x
                  </button>
                ))}
              </div>
            </div>

            {/* High-Speed Multi-Format Status Pill */}
            <div className="mt-2.5 flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 border border-white/15 text-[10px] font-semibold text-white/90 backdrop-blur-md shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Ultra-Fast 0ms Detection • Long Distance Enabled</span>
            </div>
          </div>
        )}

        {/* Loading Spinner during video stream initialization */}
        {isLoading && permissionStatus === "granted" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 gap-3 text-white">
            <RefreshCw className="h-8 w-8 animate-spin text-[#E8C16D]" />
            <p className="text-sm font-bold">Starting camera...</p>
          </div>
        )}
      </div>

      {/* Bottom Live Feedback Bar */}
      <div className="relative z-30 p-4 bg-black/75 backdrop-blur-md border-t border-white/10 space-y-2">
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
            {permissionStatus === "granted"
              ? "Scanning active. Tap 2x or 3x zoom for distant barcodes."
              : "Allow camera permission to begin scanning."}
          </p>
        )}
      </div>
    </div>
  );
}

