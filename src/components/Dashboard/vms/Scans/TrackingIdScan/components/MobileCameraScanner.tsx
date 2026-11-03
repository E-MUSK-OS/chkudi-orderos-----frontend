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
  Barcode,
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

// Default "normal" pacing hold time (350ms hold to confirm)
const NORMAL_HOLD_MS = 350;

// ALL Barcode Formats (1D Linear Barcodes + 2D/Stacked Barcodes like PDF417, Data Matrix, Aztec)
// QR CODES ARE STRICTLY EXCLUDED & BLOCKED
const ALL_BARCODE_FORMATS: BarcodeFormat[] = [
  BarcodeFormat.CODE_128, // Courier & tracking standard (Flipkart, Delhivery, Amazon, Ekart, Bluedart, etc.)
  BarcodeFormat.CODE_39, // Industrial & warehouse tracking
  BarcodeFormat.CODE_93, // High density alphanumeric
  BarcodeFormat.CODABAR, // Airway bills & postal
  BarcodeFormat.EAN_13, // Standard retail packages
  BarcodeFormat.EAN_8, // Small packages
  BarcodeFormat.ITF, // Interleaved 2 of 5 / master shipping cartons
  BarcodeFormat.UPC_A, // Retail standard
  BarcodeFormat.UPC_E, // Compact UPC
  BarcodeFormat.PDF_417, // 2D stacked shipping & logistics barcode
  BarcodeFormat.DATA_MATRIX, // 2D matrix inventory barcode
  BarcodeFormat.AZTEC, // 2D logistics barcode
  BarcodeFormat.MAXICODE, // Logistics parcel barcode
  BarcodeFormat.RSS_14, // GS1 DataBar
  BarcodeFormat.RSS_EXPANDED,
  BarcodeFormat.UPC_EAN_EXTENSION,
];

const NATIVE_BARCODE_FORMATS = [
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "ean_13",
  "ean_8",
  "itf",
  "upc_a",
  "upc_e",
  "pdf417",
  "data_matrix",
  "aztec",
];

/**
 * Validates that detected code is a barcode and NOT a QR code.
 * Strictly blocks all QR code types, QR variants, and URL/UPI QR payloads.
 */
function isValidBarcode(rawText: string, format?: any): boolean {
  if (!rawText) return false;
  const text = rawText.trim();
  if (text.length < 3) return false;

  // 1. Strictly block ANY and ALL QR code formats reported by barcode engines
  if (format !== undefined && format !== null) {
    if (format === BarcodeFormat.QR_CODE) {
      return false;
    }
    const formatStr = (
      typeof format === "number" && BarcodeFormat[format]
        ? BarcodeFormat[format]
        : String(format)
    ).toLowerCase();

    if (formatStr.includes("qr")) {
      return false;
    }
  }

  // 2. Reject payloads characteristic of QR codes (URLs, UPI payment links, Wi-Fi, vCard, JSON, etc.)
  if (
    /^https?:\/\//i.test(text) ||
    /^upi:\/\//i.test(text) ||
    /^wifi:/i.test(text) ||
    /^matmsg:/i.test(text) ||
    /^begin:vcard/i.test(text) ||
    /^tel:/i.test(text) ||
    /^mailto:/i.test(text) ||
    (text.startsWith("{") && text.endsWith("}")) ||
    (text.startsWith("[") && text.endsWith("]")) ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return false;
  }

  return true;
}

interface ScanZoneCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Calculates the bounding box of the visual scan reticle in video pixel coordinates.
 * Takes into account object-fit: cover and CSS transforms.
 */
function getScanZoneInVideoCoords(
  videoEl: HTMLVideoElement | null,
  scanZoneEl: HTMLElement | null
): ScanZoneCoords | null {
  if (!videoEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
    return null;
  }

  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;

  // Fallback to center 75% x 45% of camera frame if DOM element is not mounted yet
  if (!scanZoneEl) {
    const defaultW = vw * 0.75;
    const defaultH = vh * 0.45;
    const defX1 = (vw - defaultW) / 2;
    const defY1 = (vh - defaultH) / 2;
    return {
      x1: defX1,
      y1: defY1,
      x2: defX1 + defaultW,
      y2: defY1 + defaultH,
    };
  }

  const videoRect = videoEl.getBoundingClientRect();
  const zoneRect = scanZoneEl.getBoundingClientRect();

  if (videoRect.width === 0 || videoRect.height === 0) {
    return null;
  }

  // Account for object-fit: cover uniform scaling
  const scale = Math.max(videoRect.width / vw, videoRect.height / vh);
  const renderedWidth = vw * scale;
  const renderedHeight = vh * scale;

  // Offset of rendered video relative to element bounding box
  const offsetX = (videoRect.width - renderedWidth) / 2;
  const offsetY = (videoRect.height - renderedHeight) / 2;

  const videoContentLeft = videoRect.left + offsetX;
  const videoContentTop = videoRect.top + offsetY;

  // Convert zoneRect (screen client coords) to video pixel coords
  const x1 = Math.max(0, (zoneRect.left - videoContentLeft) / scale);
  const y1 = Math.max(0, (zoneRect.top - videoContentTop) / scale);
  const x2 = Math.min(vw, (zoneRect.right - videoContentLeft) / scale);
  const y2 = Math.min(vh, (zoneRect.bottom - videoContentTop) / scale);

  if (x2 <= x1 || y2 <= y1) {
    return null;
  }

  return { x1, y1, x2, y2 };
}

/**
 * Computes the center coordinates of a detected barcode from its corner points or bounding box.
 */
function getBarcodeCenter(barcode: any): { x: number; y: number } {
  if (Array.isArray(barcode.cornerPoints) && barcode.cornerPoints.length > 0) {
    const sum = barcode.cornerPoints.reduce(
      (acc: { x: number; y: number }, pt: { x: number; y: number }) => ({
        x: acc.x + (pt.x || 0),
        y: acc.y + (pt.y || 0),
      }),
      { x: 0, y: 0 }
    );
    return {
      x: sum.x / barcode.cornerPoints.length,
      y: sum.y / barcode.cornerPoints.length,
    };
  }

  const bb = barcode.boundingBox;
  if (bb) {
    const left = bb.x ?? bb.left ?? 0;
    const top = bb.y ?? bb.top ?? 0;
    const width = bb.width ?? 0;
    const height = bb.height ?? 0;
    return {
      x: left + width / 2,
      y: top + height / 2,
    };
  }

  return { x: 0, y: 0 };
}

/**
 * Checks if a detected barcode falls strictly inside the visible scan reticle area.
 */
function isBarcodeInsideZone(barcode: any, zone: ScanZoneCoords): boolean {
  const center = getBarcodeCenter(barcode);

  // Allow a small 6% margin to account for slight border touches, but strictly reject external barcodes
  const marginX = (zone.x2 - zone.x1) * 0.06;
  const marginY = (zone.y2 - zone.y1) * 0.06;

  const inX = center.x >= zone.x1 - marginX && center.x <= zone.x2 + marginX;
  const inY = center.y >= zone.y1 - marginY && center.y <= zone.y2 + marginY;

  if (!inX || !inY) return false;

  const bb = barcode.boundingBox;
  if (bb) {
    const bbX1 = bb.x ?? bb.left ?? 0;
    const bbY1 = bb.y ?? bb.top ?? 0;
    const bbX2 = bbX1 + (bb.width ?? 0);
    const bbY2 = bbY1 + (bb.height ?? 0);

    const hasOverlap =
      bbX1 < zone.x2 + marginX &&
      bbX2 > zone.x1 - marginX &&
      bbY1 < zone.y2 + marginY &&
      bbY2 > zone.y1 - marginY;

    if (!hasOverlap) return false;
  }

  return true;
}

/**
 * Calculates Euclidean distance between barcode center and scan zone center.
 */
function getDistanceToZoneCenter(barcode: any, zone: ScanZoneCoords): number {
  const center = getBarcodeCenter(barcode);
  const zoneCenterX = (zone.x1 + zone.x2) / 2;
  const zoneCenterY = (zone.y1 + zone.y2) / 2;
  const dx = center.x - zoneCenterX;
  const dy = center.y - zoneCenterY;
  return Math.sqrt(dx * dx + dy * dy);
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
  const rafIdRef = useRef<number | null>(null);
  const isStoppingRef = useRef(false);
  const scanZoneRef = useRef<HTMLDivElement>(null);
  const zxingTimeoutRef = useRef<any>(null);

  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("checking");
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Aim & Hold Confirmation State (Fixed accurate 350ms hold)
  const targetingRef = useRef<{
    code: string;
    firstSeenAt: number;
    lastSeenAt: number;
  } | null>(null);
  const [targetingProgress, setTargetingProgress] = useState(0); // 0 to 100%
  const [targetedCode, setTargetedCode] = useState<string | null>(null);

  // Active reading / catching feedback animation state
  const [isReading, setIsReading] = useState(false);
  const [readingCode, setReadingCode] = useState<string | null>(null);

  // Anti-duplicate debounce ref: 2000ms cooldown for identical barcode
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

    if (zxingTimeoutRef.current !== null) {
      clearTimeout(zxingTimeoutRef.current);
      zxingTimeoutRef.current = null;
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

    targetingRef.current = null;
    setTargetingProgress(0);
    setTargetedCode(null);
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
      // Ignore duplicate reads of identical barcode within 2000ms
      if (lastScannedTimeRef.current.code === code && now - lastScannedTimeRef.current.time < 2000) {
        return;
      }

      lastScannedTimeRef.current = { code, time: now };
      setLastScannedCode(code);
      setReadingCode(code);

      // Acoustic & tactile confirmation on successful capture
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
      }, 500);
    },
    [onScan, playBeepSound]
  );

  const handleNoBarcodeInFrame = useCallback(() => {
    if (targetingRef.current) {
      // Drop target if no barcode was seen for > 160ms (avoids flicker on minor hand tremor)
      if (Date.now() - targetingRef.current.lastSeenAt > 160) {
        targetingRef.current = null;
        setTargetingProgress(0);
        setTargetedCode(null);
      }
    }
  }, []);

  const processCandidateBarcode = useCallback(
    (rawCode: string, format?: any) => {
      // 1. Strict validation: only barcodes, completely block QR codes & URLs
      if (!isValidBarcode(rawCode, format)) {
        handleNoBarcodeInFrame();
        return;
      }

      const code = rawCode.replace(/[\x00-\x1F\x7F]/g, "").trim();
      if (!code) return;

      const now = Date.now();
      // Anti-duplicate cooldown: ignore identical barcode if scanned recently (< 2000ms)
      if (
        lastScannedTimeRef.current.code === code &&
        now - lastScannedTimeRef.current.time < 2000
      ) {
        handleNoBarcodeInFrame();
        return;
      }

      const requiredHoldMs = NORMAL_HOLD_MS; // Default normal hold: 350ms

      // Check if this matches candidate currently being aimed at
      if (!targetingRef.current || targetingRef.current.code !== code) {
        // Start fresh steady aiming window
        targetingRef.current = {
          code,
          firstSeenAt: now,
          lastSeenAt: now,
        };
        setTargetedCode(code);
        setTargetingProgress(15);
      } else {
        // Continue aiming lock
        targetingRef.current.lastSeenAt = now;
        const elapsed = now - targetingRef.current.firstSeenAt;
        const progress = Math.min(100, Math.round((elapsed / requiredHoldMs) * 100));
        setTargetingProgress(progress);

        if (elapsed >= requiredHoldMs) {
          // Steady hold threshold achieved! Confirm and capture barcode!
          targetingRef.current = null;
          setTargetingProgress(0);
          setTargetedCode(null);
          handleBarcodeFound(code);
        }
      }
    },
    [handleBarcodeFound, handleNoBarcodeInFrame]
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

  // Multi-tier progressive camera acquisition to guarantee preview works on ANY low-end phone
  const acquireCameraStream = async (): Promise<MediaStream> => {
    // Tier 1: Ideal 720p environment camera (modern and mid-range devices)
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1) {
      console.warn("Tier 1 constraint failed, falling back to basic environment:", err1);
    }

    // Tier 2: Flexible environment camera without fixed resolutions (low-end phones)
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
    } catch (err2) {
      console.warn("Tier 2 constraint failed, falling back to default camera:", err2);
    }

    // Tier 3: Universal fallback - ANY available camera (100% device compatibility)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  };

  const startStreamWithScanner = useCallback(
    async (stream: MediaStream) => {
      streamRef.current = stream;
      isStoppingRef.current = false;

      const videoEl = videoRef.current;
      if (!videoEl) {
        setIsLoading(false);
        return;
      }

      // CRITICAL: Attach media stream to video element immediately so preview is NEVER black
      try {
        videoEl.srcObject = stream;
        videoEl.setAttribute("playsinline", "true");
        videoEl.setAttribute("webkit-playsinline", "true");
        videoEl.setAttribute("autoplay", "true");
        videoEl.muted = true;
        await videoEl.play();
      } catch (playErr) {
        console.warn("Video play error:", playErr);
      }

      // Check camera capabilities (torch, hardware zoom, autofocus)
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

      // 1. ENGINE: Native BarcodeDetector if available (Runs on GPU/NPU)
      let nativeDetectorStarted = false;
      if (typeof window !== "undefined" && "BarcodeDetector" in window) {
        try {
          const BarcodeDetectorClass = (window as any).BarcodeDetector;
          const supported: string[] =
            (await BarcodeDetectorClass.getSupportedFormats?.()) || [];
          const activeFormats = NATIVE_BARCODE_FORMATS.filter(
            (f) => supported.length === 0 || supported.includes(f)
          );

          if (activeFormats.length > 0) {
            const nativeDetector = new BarcodeDetectorClass({ formats: activeFormats });
            let isDetecting = false;
            let lastScanTime = 0;
            const NATIVE_SCAN_INTERVAL = 50; // High precision sampling for exact 350ms hold confirmation

            const scanNativeLoop = async (nowTimestamp?: number) => {
              if (isStoppingRef.current) return;
              if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
                rafIdRef.current = requestAnimationFrame(scanNativeLoop);
                return;
              }

              const now = typeof nowTimestamp === "number" ? nowTimestamp : performance.now();
              if (!isDetecting && now - lastScanTime >= NATIVE_SCAN_INTERVAL) {
                lastScanTime = now;
                isDetecting = true;
                try {
                  const barcodes = await nativeDetector.detect(videoEl);
                  if (barcodes && barcodes.length > 0) {
                    const zone = getScanZoneInVideoCoords(videoEl, scanZoneRef.current);
                    if (zone) {
                      // Filter: strictly keep only genuine barcodes inside the reticle (QR codes blocked)
                      const validBarcodes = barcodes.filter(
                        (b: any) =>
                          isBarcodeInsideZone(b, zone) && isValidBarcode(b.rawValue, b.format)
                      );

                      if (validBarcodes.length > 0) {
                        // Prioritize barcode closest to the center crosshairs
                        validBarcodes.sort(
                          (a: any, b: any) =>
                            getDistanceToZoneCenter(a, zone) - getDistanceToZoneCenter(b, zone)
                        );

                        const primary = validBarcodes[0];
                        if (primary && primary.rawValue) {
                          processCandidateBarcode(primary.rawValue, primary.format);
                        }
                      } else {
                        handleNoBarcodeInFrame();
                      }
                    } else {
                      handleNoBarcodeInFrame();
                    }
                  } else {
                    handleNoBarcodeInFrame();
                  }
                } catch {
                  // Ignore transient frame read error
                  handleNoBarcodeInFrame();
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
          }
        } catch (e) {
          console.warn("Native BarcodeDetector init failed, will use ZXing fallback:", e);
        }
      }

      // 2. FALLBACK ENGINE: Lightweight ZXing cropped strictly to the viewfinder reticle (All Barcodes, QR Blocked)
      if (!nativeDetectorStarted) {
        try {
          const hints = new Map<DecodeHintType, any>();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, ALL_BARCODE_FORMATS);

          const codeReader = new BrowserMultiFormatReader(hints, {
            delayBetweenScanAttempts: 50,
            delayBetweenScanSuccess: 600,
          });

          // Offscreen cropped canvas: only captures pixels inside the reticle
          const cropCanvas = document.createElement("canvas");
          const cropCtx = cropCanvas.getContext("2d", { willReadFrequently: true });
          let isZxingDecoding = false;

          const scanZxingLoop = () => {
            if (isStoppingRef.current) return;
            if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
              zxingTimeoutRef.current = setTimeout(scanZxingLoop, 50);
              return;
            }

            if (!isZxingDecoding) {
              isZxingDecoding = true;
              try {
                const zone = getScanZoneInVideoCoords(videoEl, scanZoneRef.current);
                if (zone && cropCtx) {
                  const targetW = Math.round(zone.x2 - zone.x1);
                  const targetH = Math.round(zone.y2 - zone.y1);

                  if (targetW > 10 && targetH > 10) {
                    if (cropCanvas.width !== targetW || cropCanvas.height !== targetH) {
                      cropCanvas.width = targetW;
                      cropCanvas.height = targetH;
                    }

                    // Crop video frame strictly to the reticle coordinates
                    cropCtx.drawImage(
                      videoEl,
                      zone.x1,
                      zone.y1,
                      targetW,
                      targetH,
                      0,
                      0,
                      targetW,
                      targetH
                    );

                    const result = codeReader.decodeFromCanvas(cropCanvas);
                    if (result && result.getText()) {
                      const raw = result.getText();
                      const fmt = result.getBarcodeFormat();
                      if (isValidBarcode(raw, fmt)) {
                        processCandidateBarcode(raw, fmt);
                      } else {
                        handleNoBarcodeInFrame();
                      }
                    } else {
                      handleNoBarcodeInFrame();
                    }
                  }
                }
              } catch {
                // NotFoundException is thrown when no barcode is in reticle
                handleNoBarcodeInFrame();
              } finally {
                isZxingDecoding = false;
              }
            }

            if (!isStoppingRef.current) {
              zxingTimeoutRef.current = setTimeout(scanZxingLoop, 50);
            }
          };

          controlsRef.current = {
            stop: () => {
              if (zxingTimeoutRef.current !== null) {
                clearTimeout(zxingTimeoutRef.current);
                zxingTimeoutRef.current = null;
              }
            },
          } as any;

          zxingTimeoutRef.current = setTimeout(scanZxingLoop, 100);
        } catch (err) {
          console.warn("ZXing fallback decode error:", err);
        }
      }

      setIsLoading(false);
    },
    [processCandidateBarcode, handleNoBarcodeInFrame]
  );

  const requestPermissionAndStart = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus("unsupported");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const stream = await acquireCameraStream();
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

  // Mobile Back Button / Gesture Navigation & ESC Handler:
  // When camera opens on mobile, push a dummy history state so pressing "Back" or swiping back
  // closes the camera modal and keeps the user on the Tracking ID Scan page instead of navigating away.
  useEffect(() => {
    if (!isOpen) return;

    let historyPushed = false;
    let isBackNav = false;

    try {
      window.history.pushState({ vmsCameraScannerModal: true }, "", window.location.href);
      historyPushed = true;
    } catch (err) {
      console.warn("Could not push history state for camera modal:", err);
    }

    const handlePopState = () => {
      isBackNav = true;
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);

      // If closed via UI (e.g. close 'X' button) instead of the browser back button,
      // cleanly revert the pushed state to keep history stack clean.
      if (historyPushed && !isBackNav) {
        try {
          window.history.back();
        } catch (err) {
          console.warn("Could not revert history state:", err);
        }
      }
    };
  }, [isOpen, onClose]);

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
      <div className="relative z-30 flex items-center justify-between px-3 sm:px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="grid h-8.5 w-8.5 place-items-center rounded-xl bg-[#E8C16D] text-[#0A0E1A] shadow-md shadow-[#E8C16D]/20 shrink-0">
            <Barcode className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold leading-tight">Barcode Scanner</h3>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Barcodes Only
              </span>
            </div>
            <p className="text-[10px] text-emerald-400/90 flex items-center gap-1">
              <ShieldCheck size={11} />
              <span>• All Barcodes Supported</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {hasTorch && permissionStatus === "granted" && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
                isTorchOn
                  ? "bg-[#E8C16D] text-[#0A0E1A] border-[#E8C16D]"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
              title={isTorchOn ? "Turn Flash Off" : "Turn Flash On"}
            >
              {isTorchOn ? <Zap size={16} /> : <ZapOff size={16} />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 transition active:scale-95 cursor-pointer"
            title="Close Camera"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* TOP Scan Result Banner (Success / Not Found / Already Scanned / Error) */}
      {message && (
        <div className="relative z-30 px-3 sm:px-4 py-2.5 bg-black/90 backdrop-blur-md border-b border-white/15 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`rounded-2xl border p-2.5 sm:p-3 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xl ${
              isSuccess
                ? "border-emerald-500/60 bg-emerald-950/90 text-emerald-200 shadow-emerald-950/40"
                : isWarning
                ? "border-amber-500/60 bg-amber-950/90 text-amber-200 shadow-amber-950/40"
                : "border-red-500/60 bg-red-950/90 text-red-200 shadow-red-950/40"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {isSuccess ? (
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              ) : isWarning ? (
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              ) : (
                <div className="grid h-6 w-6 place-items-center rounded-lg bg-red-500/20 text-red-400 shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm truncate leading-snug">{message}</p>
                {lastScannedCode && (
                  <p className="text-[10px] font-mono text-slate-300 opacity-90 truncate">
                    Code: {lastScannedCode}
                  </p>
                )}
              </div>
            </div>

            <span
              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                isSuccess
                  ? "bg-emerald-500/30 text-emerald-300 border-emerald-500/40"
                  : isWarning
                  ? "bg-amber-500/30 text-amber-300 border-amber-500/40"
                  : "bg-red-500/30 text-red-300 border-red-500/40"
              }`}
            >
              {isSuccess ? "Verified" : isWarning ? "Duplicate" : "Not Found"}
            </span>
          </div>
        </div>
      )}

      {/* Main Viewport Area */}
      <div className="relative flex-1 min-h-0 w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {/* Real-time Camera Preview Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: !hasHardwareZoom && currentZoom > 1 ? `scale(${currentZoom})` : "none",
            transformOrigin: "center center",
            transition: "transform 0.2s ease-out",
          }}
          className={`absolute inset-0 transition-opacity duration-300 ${
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
              ref={scanZoneRef}
              className={`relative w-[88%] max-w-[360px] h-52 sm:h-56 rounded-2xl overflow-hidden transition-all duration-200 ${
                isReading
                  ? "border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65),0_0_35px_#10b981,inset_0_0_25px_rgba(16,185,129,0.35)]"
                  : targetingProgress > 0
                  ? "border-2 border-[#E8C16D] shadow-[0_0_0_9999px_rgba(0,0,0,0.65),0_0_30px_rgba(232,193,109,0.5),inset_0_0_20px_rgba(232,193,109,0.2)]"
                  : "border-2 border-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              }`}
            >
              {/* 4 Glowing Corner Accents */}
              <div
                className={`absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 rounded-tl-lg transition-colors duration-150 ${
                  isReading
                    ? "border-emerald-400 shadow-[0_0_15px_#10b981]"
                    : targetingProgress > 0
                    ? "border-amber-400 shadow-[0_0_15px_#fbbf24]"
                    : "border-[#E8C16D] shadow-[0_0_10px_#E8C16D]"
                }`}
              />
              <div
                className={`absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 rounded-tr-lg transition-colors duration-150 ${
                  isReading
                    ? "border-emerald-400 shadow-[0_0_15px_#10b981]"
                    : targetingProgress > 0
                    ? "border-amber-400 shadow-[0_0_15px_#fbbf24]"
                    : "border-[#E8C16D] shadow-[0_0_10px_#E8C16D]"
                }`}
              />
              <div
                className={`absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 rounded-bl-lg transition-colors duration-150 ${
                  isReading
                    ? "border-emerald-400 shadow-[0_0_15px_#10b981]"
                    : targetingProgress > 0
                    ? "border-amber-400 shadow-[0_0_15px_#fbbf24]"
                    : "border-[#E8C16D] shadow-[0_0_10px_#E8C16D]"
                }`}
              />
              <div
                className={`absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 rounded-br-lg transition-colors duration-150 ${
                  isReading
                    ? "border-emerald-400 shadow-[0_0_15px_#10b981]"
                    : targetingProgress > 0
                    ? "border-amber-400 shadow-[0_0_15px_#fbbf24]"
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

            {/* Barcodes Only Status Pill */}
            <div className="mt-2.5 flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 border border-white/15 text-[10px] font-semibold text-white/90 backdrop-blur-md shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>All Barcodes Supported • QR Codes Blocked</span>
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

      {/* Bottom Status Bar */}
      <div className="relative z-30 px-4 py-3 bg-black/75 backdrop-blur-md border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
        <span className="text-slate-400">
          {permissionStatus === "granted"
            ? "Point camera at barcode to scan"
            : "Allow camera permission to begin scanning"}
        </span>
        {lastScannedCode && (
          <span className="font-mono text-xs text-[#E8C16D] font-bold truncate max-w-[170px]">
            {lastScannedCode}
          </span>
        )}
      </div>
    </div>
  );
}


