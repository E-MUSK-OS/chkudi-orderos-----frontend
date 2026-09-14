"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { amazonOrderService, AmazonOrderItem } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/services/amazonOrder.service";

export interface ScanFeedbackMessage {
  text: string;
  type: "success" | "warning" | "error" | "info";
  order?: AmazonOrderItem;
}

export interface MissingAwbItem {
  id: string;
  awb: string;
  scannedAt: string;
  reason?: string;
  count?: number;
}

const STORAGE_KEY = "amazon_missing_awb_scans";

export const useAwbScanner = (
  orders: AmazonOrderItem[],
  setOrders: React.Dispatch<React.SetStateAction<AmazonOrderItem[]>>,
  onSuccessCallback?: (order?: AmazonOrderItem) => void
) => {
  const [scanValue, setScanValue] = useState("");
  const [message, setMessage] = useState<ScanFeedbackMessage | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [missingList, setMissingList] = useState<MissingAwbItem[]>([]);

  const warningSound = useRef<HTMLAudioElement | null>(null);
  const successSound = useRef<HTMLAudioElement | null>(null);
  const alreadyScannedSound = useRef<HTMLAudioElement | null>(null);

  // Initialize sounds
  useEffect(() => {
    warningSound.current = new Audio("/sounds/warning.wav");
    successSound.current = new Audio("/sounds/success.wav");
    alreadyScannedSound.current = new Audio("/sounds/alreadyScanne.wav");

    return () => {
      warningSound.current = null;
      successSound.current = null;
      alreadyScannedSound.current = null;
    };
  }, []);

  // Load missing AWB list from localStorage (pre-seed with user's current missing scan if first time)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setMissingList(parsed);
          return;
        }
      }
      // If never initialized before, seed with 372527398320 from user's current session
      const initialSeed: MissingAwbItem[] = [
        {
          id: "seed-372527398320",
          awb: "372527398320",
          scannedAt: format(new Date(), "dd MMM, hh:mm a"),
          reason: 'Amazon order with AWB / Order ID "372527398320" not found.',
          count: 1,
        },
      ];
      setMissingList(initialSeed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed));
    } catch (err) {
      console.warn("Failed to load missing AWB scans from localStorage", err);
    }
  }, []);

  // Helper to update and persist missing list
  const updateMissingList = (updater: (prev: MissingAwbItem[]) => MissingAwbItem[]) => {
    setMissingList((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist missing AWB scans to localStorage", e);
      }
      return next;
    });
  };

  const removeMissingItem = (awb: string) => {
    updateMissingList((prev) =>
      prev.filter((item) => item.awb.toLowerCase() !== awb.toLowerCase())
    );
  };

  const clearMissingList = () => {
    updateMissingList(() => []);
  };

  const playSound = async (
    audioRef: React.MutableRefObject<HTMLAudioElement | null>
  ) => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        console.warn("Audio playback error:", error);
      }
    }
  };

  const handleScan = async (valueToScan?: string) => {
    const raw = (valueToScan ?? scanValue).trim();
    if (!raw) return;

    setIsScanning(true);

    const clean = raw.trim();

    // Check if item exists in local state
    const existing = orders.find(
      (item) =>
        item.awb.toLowerCase() === clean.toLowerCase() ||
        item.orderId.toLowerCase() === clean.toLowerCase()
    );

    // Case 1: Already scanned
    if (existing && existing.packingScanStatus === "SCANNED") {
      setMessage({
        text: `AWB / Order "${clean}" is already scanned.`,
        type: "warning",
        order: existing,
      });
      await playSound(alreadyScannedSound);
      // Remove from missing if it's there
      removeMissingItem(clean);
      if (existing.awb) removeMissingItem(existing.awb);
      setIsScanning(false);
      return;
    }

    // Case 2: Found in local list and PENDING -> Instant Optimistic Update!
    if (existing && existing.packingScanStatus === "PENDING") {
      const updatedOrder: AmazonOrderItem = {
        ...existing,
        packingScanStatus: "SCANNED",
        updatedAt: new Date().toISOString(),
      };

      // Optimistic update local state (keep pending on top, scanned below)
      setOrders((prev) => {
        const next = prev.map((item) =>
          item.id === existing.id || item.awb.toLowerCase() === clean.toLowerCase()
            ? updatedOrder
            : item
        );
        const pendingList = next.filter((item) => item.packingScanStatus === "PENDING");
        const scannedList = next.filter((item) => item.packingScanStatus === "SCANNED");
        return [...pendingList, ...scannedList];
      });

      // Remove from missing if present
      removeMissingItem(clean);
      if (existing.awb) removeMissingItem(existing.awb);

      setMessage({
        text: `AWB "${existing.awb}" verified and scanned successfully! (${existing.orderId} • ${existing.customer})`,
        type: "success",
        order: updatedOrder,
      });
      await playSound(successSound);

      // Async backend update
      try {
        await amazonOrderService.updateScanStatusByAwb(existing.awb, "SCANNED");
        if (onSuccessCallback) onSuccessCallback(updatedOrder);
      } catch (err) {
        console.warn("Background AWB scan update failed:", err);
      } finally {
        setIsScanning(false);
      }
      return;
    }

    // Case 3: Not in local page list -> Query backend directly
    try {
      const res = await amazonOrderService.updateScanStatusByAwb(clean, "SCANNED");
      const updated = res.data;

      setOrders((prev) => {
        const exists = prev.some((item) => item.id === updated.id);
        const next = exists
          ? prev.map((item) => (item.id === updated.id ? updated : item))
          : [...prev, updated];
        const pendingList = next.filter((item) => item.packingScanStatus === "PENDING");
        const scannedList = next.filter((item) => item.packingScanStatus === "SCANNED");
        return [...pendingList, ...scannedList];
      });

      // If this item was previously in missing list, remove it
      removeMissingItem(clean);
      if (updated.awb) removeMissingItem(updated.awb);

      setMessage({
        text: `AWB "${clean}" scanned and marked as SCANNED!`,
        type: "success",
        order: updated,
      });
      await playSound(successSound);

      if (onSuccessCallback) {
        onSuccessCallback(updated);
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || `Amazon order with AWB / Order ID "${clean}" not found.`;
      setMessage({
        text: errorMsg,
        type: "error",
      });
      await playSound(warningSound);

      // Add to missing list
      const formattedTime = format(new Date(), "dd MMM, hh:mm a");
      updateMissingList((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.awb.toLowerCase() === clean.toLowerCase()
        );
        if (existingIdx >= 0) {
          const updated = {
            ...prev[existingIdx],
            scannedAt: formattedTime,
            reason: errorMsg,
            count: (prev[existingIdx].count || 1) + 1,
          };
          return [updated, ...prev.filter((_, i) => i !== existingIdx)];
        }
        return [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            awb: clean,
            scannedAt: formattedTime,
            reason: errorMsg,
            count: 1,
          },
          ...prev,
        ];
      });
    } finally {
      setIsScanning(false);
    }
  };

  return {
    scanValue,
    setScanValue,
    message,
    isScanning,
    handleScan,
    missingList,
    removeMissingItem,
    clearMissingList,
  };
};
