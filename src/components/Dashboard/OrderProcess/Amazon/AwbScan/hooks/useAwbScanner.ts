"use client";

import { useEffect, useRef, useState } from "react";
import { amazonOrderService, AmazonOrderItem } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/services/amazonOrder.service";

export interface ScanFeedbackMessage {
  text: string;
  type: "success" | "warning" | "error" | "info";
  order?: AmazonOrderItem;
}

export const useAwbScanner = (
  orders: AmazonOrderItem[],
  setOrders: React.Dispatch<React.SetStateAction<AmazonOrderItem[]>>,
  onSuccessCallback?: (order?: AmazonOrderItem) => void
) => {
  const [scanValue, setScanValue] = useState("");
  const [message, setMessage] = useState<ScanFeedbackMessage | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const warningSound = useRef<HTMLAudioElement | null>(null);
  const successSound = useRef<HTMLAudioElement | null>(null);
  const alreadyScannedSound = useRef<HTMLAudioElement | null>(null);

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
        err?.message || `AWB / Order ID "${clean}" not found in Amazon database.`;
      setMessage({
        text: errorMsg,
        type: "error",
      });
      await playSound(warningSound);
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
  };
};
