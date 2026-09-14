"use client";

import { useCallback, useRef, useState } from "react";
import { ScanHistoryItem } from "../types/vms.types";
import { SCANNER_CONFIG } from "../utils/scanner.constants";
import type { ScannerResult, ScannerStatus } from "../types/vms.types";
import { validateTrackingId as validateTrackingHelper, isQrCode } from "../utils/validateTracking";

export const useScanner = () => {
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const lastScanTime = useRef(0);
  const lastTrackingId = useRef("");

  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>({
    connected: false,
    type: "manual",
    lastActivity: 0,
  });

  const scanBuffer = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimer = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTime = useRef(0);
  const isHumanTyping = useRef(false);

  const validateTrackingId = useCallback((trackingId: string) => {
    const res = validateTrackingHelper(trackingId, SCANNER_CONFIG.MIN_LENGTH);
    return {
      success: res.isValid,
      isQr: res.isQr,
      message: res.message,
    };
  }, []);
  const isDuplicate = useCallback((trackingId: string) => {
    const now = Date.now();

    if (
      trackingId === lastTrackingId.current &&
      now - lastScanTime.current < SCANNER_CONFIG.DUPLICATE_DELAY
    ) {
      return true;
    }

    lastTrackingId.current = trackingId;

    lastScanTime.current = now;

    return false;
  }, []);

  const processScan = useCallback(
    async (trackingId: string): Promise<ScannerResult | null> => {
      console.log("PROCESS SCAN =>", trackingId);
      if (isProcessing) {
        return {
          success: false,
          trackingId,
          message: "Scanner is busy.",
        };
      }

      setIsProcessing(true);

      try {
        const validation = validateTrackingId(trackingId);

        if (!validation.success) {
          return {
            success: false,
            isQr: validation.isQr,
            trackingId,
            message: validation.message,
          };
        }

        if (isDuplicate(trackingId)) {
          return {
            success: false,
            trackingId,
            message: "Duplicate scan ignored.",
          };
        }

        setLastScan(trackingId);

        setScanHistory((prev: ScanHistoryItem[]) =>
          [
            {
              trackingId,
              scannedAt: Date.now(),
              source: "scanner" as const,
            },
            ...prev,
          ].slice(0, 100),
        );

        return {
          success: true,
          trackingId,
          message: "Tracking scanned successfully.",
        };
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, validateTrackingId, isDuplicate],
  );

  const detectScanner = useCallback(() => {
    const now = Date.now();

    const diff = now - lastKeyTime.current;

    lastKeyTime.current = now;

    return diff < 30;
  }, []);

  const updateScannerStatus = useCallback((type: ScannerStatus["type"]) => {
    setScannerStatus({
      connected: true,
      type,
      lastActivity: Date.now(),
    });
  }, []);

  const resetScannerTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setScannerStatus((prev) => ({
        ...prev,
        connected: false,
      }));
    }, 5000);
  }, []);

  const isScannerInput = useCallback(() => {
    const now = Date.now();

    const diff = now - lastKeyTime.current;

    lastKeyTime.current = now;

    return diff < 30;
  }, []);

  const resetTimer = useCallback((callback: () => void) => {
    if (scanTimer.current) {
      clearTimeout(scanTimer.current);
    }

    scanTimer.current = setTimeout(callback, SCANNER_CONFIG.SCAN_TIMEOUT);
  }, []);

  const processKeyboardInput = useCallback(
    (
      key: string,
      onComplete: (trackingId: string) => void,
      onManualTypingAttempt?: () => void,
    ) => {
      // Barcode scanners send keys in rapid bursts (10-35ms).
      // Any delay > 60ms between consecutive keys indicates manual human typing.
      const MAX_SCANNER_INTERVAL = 60; // ms
      const SCAN_FINISH_TIMEOUT = 120; // ms: timeout to complete if scanner has no Enter suffix

      if (key === "Enter") {
        const now = Date.now();
        const diff = lastKeyTime.current ? now - lastKeyTime.current : 999;
        const code = scanBuffer.current.trim();
        const wasHuman = isHumanTyping.current;

        // Reset buffer and states
        scanBuffer.current = "";
        isHumanTyping.current = false;
        lastKeyTime.current = 0;
        if (scanTimer.current) {
          clearTimeout(scanTimer.current);
          scanTimer.current = null;
        }

        // If manual typing was detected, or buffer is too short, or Enter was pressed slowly (> 80ms after last char)
        if (wasHuman || code.length < SCANNER_CONFIG.MIN_LENGTH || diff > 80) {
          if (wasHuman || code.length > 0) {
            onManualTypingAttempt?.();
          }
          return;
        }

        // Valid hardware barcode scanner input
        updateScannerStatus("usb");
        resetScannerTimeout();
        onComplete(code);
        return;
      }

      // Ignore non-character keys (Shift, Control, Alt, CapsLock, Tab, Arrow keys, etc.)
      if (key.length !== 1) {
        return;
      }

      const now = Date.now();
      const diff = lastKeyTime.current ? now - lastKeyTime.current : 0;
      lastKeyTime.current = now;

      // First character of a scan sequence
      if (scanBuffer.current === "") {
        isHumanTyping.current = false;
        scanBuffer.current = key;

        if (scanTimer.current) clearTimeout(scanTimer.current);
        scanTimer.current = setTimeout(() => {
          const finalCode = scanBuffer.current.trim();
          const wasHuman = isHumanTyping.current;
          scanBuffer.current = "";
          isHumanTyping.current = false;
          lastKeyTime.current = 0;

          // If scanner without Enter suffix (fast burst and >= MIN_LENGTH)
          if (!wasHuman && finalCode.length >= SCANNER_CONFIG.MIN_LENGTH) {
            updateScannerStatus("usb");
            resetScannerTimeout();
            onComplete(finalCode);
          } else if (finalCode.length > 0) {
            onManualTypingAttempt?.();
          }
        }, SCAN_FINISH_TIMEOUT);
        return;
      }

      // 2nd, 3rd, 4th... characters:
      // If gap between consecutive keys exceeds MAX_SCANNER_INTERVAL, it's manual human typing!
      if (diff > MAX_SCANNER_INTERVAL) {
        isHumanTyping.current = true;
        scanBuffer.current = ""; // Wipe buffer immediately
        lastKeyTime.current = 0;
        if (scanTimer.current) {
          clearTimeout(scanTimer.current);
          scanTimer.current = null;
        }
        onManualTypingAttempt?.();
        return;
      }

      // Fast keystrokes from barcode scanner
      scanBuffer.current += key;

      if (scanTimer.current) clearTimeout(scanTimer.current);
      scanTimer.current = setTimeout(() => {
        const finalCode = scanBuffer.current.trim();
        const wasHuman = isHumanTyping.current;
        scanBuffer.current = "";
        isHumanTyping.current = false;
        lastKeyTime.current = 0;

        if (!wasHuman && finalCode.length >= SCANNER_CONFIG.MIN_LENGTH) {
          updateScannerStatus("usb");
          resetScannerTimeout();
          onComplete(finalCode);
        }
      }, SCAN_FINISH_TIMEOUT);
    },
    [updateScannerStatus, resetScannerTimeout],
  );

  return {
    processScan,

    processKeyboardInput,

    lastScan,

    scanHistory,

    scannerStatus,

    isProcessing,
  };
};
