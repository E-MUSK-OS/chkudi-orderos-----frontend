"use client";

import { useCallback, useRef, useState } from "react";
import { ScanHistoryItem } from "../types/vms.types";
import { SCANNER_CONFIG } from "../utils/scanner.constants";
import type { ScannerResult, ScannerStatus } from "../types/vms.types";

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
  const validateTrackingId = useCallback((trackingId: string) => {
    const value = trackingId.trim();

    if (!value) {
      return {
        success: false,
        message: "Tracking ID is required.",
      };
    }

    if (value.length < SCANNER_CONFIG.MIN_LENGTH) {
      return {
        success: false,
        message: `Tracking ID must be at least ${SCANNER_CONFIG.MIN_LENGTH} characters.`,
      };
    }

    return {
      success: true,
      message: "Valid tracking ID.",
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
    (key: string, onComplete: (trackingId: string) => void) => {
      if (key === "Enter") {
        if (scanBuffer.current.trim()) {
          onComplete(scanBuffer.current.trim());

          scanBuffer.current = "";
        }

        return;
      }

      if (key.length !== 1) return;

      scanBuffer.current += key;

      resetTimer(() => {
        if (scanBuffer.current.trim()) {
          onComplete(scanBuffer.current.trim());

          scanBuffer.current = "";
        }
      });
    },
    [resetTimer],
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
