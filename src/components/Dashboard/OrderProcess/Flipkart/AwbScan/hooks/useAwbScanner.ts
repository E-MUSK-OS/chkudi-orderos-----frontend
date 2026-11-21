"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { formatToIST, getNowIsoIST } from "../timeUtils";
import {
  flipkartOrderService,
  FlipkartAwbOrderItem,
} from "@/components/Dashboard/OrderProcess/Flipkart/OrderProcess/services/flipkartOrder.service";

export interface ScanFeedbackMessage {
  text: string;
  type: "success" | "warning" | "error" | "info";
  order?: FlipkartAwbOrderItem;
}

export interface MissingAwbItem {
  id: string;
  awb: string;
  scannedAt: string;
  reason?: string;
  count?: number;
}

const STORAGE_KEY = "flipkart_missing_awb_scans";

export const useAwbScanner = (
  orders: FlipkartAwbOrderItem[],
  setOrders: React.Dispatch<React.SetStateAction<FlipkartAwbOrderItem[]>>,
  onSuccessCallback?: (order?: FlipkartAwbOrderItem) => void
) => {
  const [scanValue, setScanValue] = useState("");
  const [message, setMessage] = useState<ScanFeedbackMessage | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [missingList, setMissingList] = useState<MissingAwbItem[]>([]);

  const warningSound = useRef<HTMLAudioElement | null>(null);
  const successSound = useRef<HTMLAudioElement | null>(null);
  const alreadyScannedSound = useRef<HTMLAudioElement | null>(null);
  const scannedAwbsRef = useRef<Set<string>>(new Set());

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

  // Sync scannedAwbsRef from currently loaded orders with SCANNED status
  useEffect(() => {
    orders.forEach((o) => {
      if (o.packingScanStatus === "SCANNED" && o.awb && o.awb !== "N/A" && o.awb !== "-") {
        scannedAwbsRef.current.add(o.awb.trim().toLowerCase());
      }
    });
  }, [orders]);

  // If an order is reprinted, remove its AWB from scannedAwbsRef so it can be re-scanned cleanly
  useEffect(() => {
    const handleReprinted = (data: { awbs?: string[] }) => {
      if (data?.awbs && Array.isArray(data.awbs)) {
        data.awbs.forEach((a) => {
          if (a) scannedAwbsRef.current.delete(a.trim().toLowerCase());
        });
      }
    };
    socket.on("flipkartOrderPrinted", handleReprinted);
    return () => {
      socket.off("flipkartOrderPrinted", handleReprinted);
    };
  }, []);

  // Load missing AWB list from localStorage
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
      setMissingList([]);
    } catch (err) {
      console.warn("Failed to load missing Flipkart AWB scans from localStorage", err);
    }
  }, []);

  // Helper to update and persist missing list
  const updateMissingList = (updater: (prev: MissingAwbItem[]) => MissingAwbItem[]) => {
    setMissingList((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn("Failed to persist missing Flipkart AWB scans to localStorage", e);
      }
      return next;
    });
  };

  const removeMissingItem = (awb: string) => {
    const cleanLower = (awb || "").trim().toLowerCase();
    updateMissingList((prev) =>
      prev.filter((item) => item.awb.toLowerCase() !== cleanLower)
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

  const recordMissing = (awb: string, reason: string) => {
    const formattedTime = formatToIST(new Date());
    updateMissingList((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.awb.toLowerCase() === awb.toLowerCase()
      );
      if (existingIdx >= 0) {
        const updated = {
          ...prev[existingIdx],
          scannedAt: formattedTime,
          reason,
          count: (prev[existingIdx].count || 1) + 1,
        };
        return [updated, ...prev.filter((_, i) => i !== existingIdx)];
      }
      return [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          awb,
          scannedAt: formattedTime,
          reason,
          count: 1,
        },
        ...prev,
      ];
    });
  };

  const handleScan = async (valueToScan?: string) => {
    const raw = (valueToScan ?? scanValue).trim();
    if (!raw) return;

    setIsScanning(true);

    const clean = raw.trim();
    const cleanLower = clean.toLowerCase();

    // 0. Strict check: Blank or invalid literal
    if (!clean || clean.toUpperCase() === "N/A" || clean === "-") {
      const errorMsg = `Invalid scan: Empty or blank barcode. Please scan a valid Flipkart AWB tracking barcode.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      setIsScanning(false);
      return;
    }

    // 1. Strict check: Is the scanned barcode a Flipkart Order ID (e.g. starts with OD or matches orderId)?
    const isOrderIdPattern = /^OD\d+$/i.test(clean);
    const matchedOrderIdItem = orders.find(
      (item) =>
        (item.orderId || "").trim().toLowerCase() === cleanLower &&
        (item.awb || "").trim().toLowerCase() !== cleanLower
    );
    if (isOrderIdPattern || matchedOrderIdItem) {
      const orderRef = matchedOrderIdItem ? ` (Order #${matchedOrderIdItem.orderId})` : "";
      const errorMsg = `Invalid Barcode: Scanned Flipkart Order ID "${clean}"${orderRef}. Only the shipping carrier AWB tracking barcode is valid for scanning.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      recordMissing(clean, errorMsg);
      setIsScanning(false);
      return;
    }

    // 2. Strict check: Is the scanned barcode an FSN?
    const matchedFsnItem = orders.find((item) => {
      const fsns = (item.fsn || "").split(/[\r\n]+|\s+\/\s+|\s*,\s*/).map((s) => s.trim().toLowerCase());
      return fsns.includes(cleanLower) && (item.awb || "").trim().toLowerCase() !== cleanLower;
    });
    if (matchedFsnItem) {
      const errorMsg = `Invalid Barcode: Scanned FSN "${clean}". Only Flipkart AWB tracking barcodes are valid for scanning.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      recordMissing(clean, errorMsg);
      setIsScanning(false);
      return;
    }

    // 3. Strict check: Is the scanned barcode a SKU?
    const matchedSkuItem = orders.find((item) => {
      const skus = (item.sku || "").split(/[\r\n]+|\s+\/\s+|\s*,\s*/).map((s) => s.trim().toLowerCase());
      return skus.includes(cleanLower) && (item.awb || "").trim().toLowerCase() !== cleanLower;
    });
    if (matchedSkuItem) {
      const errorMsg = `Invalid Barcode: Scanned SKU "${clean}". Only Flipkart AWB tracking barcodes are valid for scanning.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      recordMissing(clean, errorMsg);
      setIsScanning(false);
      return;
    }

    // 4. Strict AWB matching ONLY: Check against item.awb (never against orderId)
    // Instant earlier check across all pages:
    if (scannedAwbsRef.current.has(cleanLower)) {
      setMessage({
        text: `AWB tracking barcode "${clean}" is already scanned.`,
        type: "warning",
      });
      await playSound(alreadyScannedSound);
      removeMissingItem(clean);
      setIsScanning(false);
      return;
    }

    const isAwbMatch = (itemAwb?: string | null): boolean => {
      if (!itemAwb || itemAwb.toUpperCase() === "N/A" || itemAwb === "-") return false;
      const cleanAwb = itemAwb.trim().toLowerCase();
      if (cleanAwb === cleanLower) return true;

      // Handle multi-AWB strings separated by /, newline, space, or comma
      const parts = cleanAwb.split(/[\r\n]+|\s+\/\s+|\s*,\s*/).map((p) => p.trim().toLowerCase()).filter(Boolean);
      return parts.some((p) => p === cleanLower || (cleanLower.length >= 8 && p.includes(cleanLower)));
    };

    const existing = orders.find((item) => isAwbMatch(item.awb));

    // Case 1: Already scanned
    if (existing && existing.packingScanStatus === "SCANNED") {
      scannedAwbsRef.current.add(cleanLower);
      if (existing.awb) scannedAwbsRef.current.add(existing.awb.trim().toLowerCase());
      setMessage({
        text: `AWB tracking barcode "${clean}" is already scanned. (${existing.orderId} • ${existing.customer})`,
        type: "warning",
        order: existing,
      });
      await playSound(alreadyScannedSound);
      removeMissingItem(clean);
      if (existing.awb) removeMissingItem(existing.awb);
      setIsScanning(false);
      return;
    }

    // Case 2: Found in local list and PENDING -> Validate VMS and update backend strictly by AWB
    if (existing && existing.packingScanStatus === "PENDING") {
      try {
        const targetAwb = existing.awb && existing.awb !== "N/A" ? existing.awb : clean;
        const res = await flipkartOrderService.updateScanStatusByAwb(targetAwb, "SCANNED");
        const updatedOrder: FlipkartAwbOrderItem = res?.data || {
          ...existing,
          packingScanStatus: "SCANNED",
          updatedAt: getNowIsoIST(),
        };

        scannedAwbsRef.current.add(cleanLower);
        if (existing.awb) scannedAwbsRef.current.add(existing.awb.trim().toLowerCase());
        if (updatedOrder.awb) scannedAwbsRef.current.add(updatedOrder.awb.trim().toLowerCase());

        // Update local state (keep pending on top, scanned below)
        setOrders((prev) => {
          const next = prev.map((item) =>
            item.id === existing.id ? updatedOrder : item
          );
          const pendingList = next.filter((item) => item.packingScanStatus === "PENDING");
          const scannedList = next.filter((item) => item.packingScanStatus === "SCANNED");
          return [...pendingList, ...scannedList];
        });

        // Remove from missing if present
        removeMissingItem(clean);
        if (existing.awb) removeMissingItem(existing.awb);
        if (updatedOrder.awb) removeMissingItem(updatedOrder.awb);

        setMessage({
          text: `AWB "${existing.awb}" verified and scanned successfully! (${existing.orderId} • ${existing.customer})`,
          type: "success",
          order: updatedOrder,
        });
        await playSound(successSound);

        if (onSuccessCallback) onSuccessCallback(updatedOrder);
      } catch (err: any) {
        const serverMessage = err?.message || err?.response?.data?.message;
        const errorMsg =
          serverMessage || `Failed to update scan status for AWB "${clean}".`;
        setMessage({
          text: errorMsg,
          type: "error",
        });
        await playSound(warningSound);
        recordMissing(clean, errorMsg);
      } finally {
        setIsScanning(false);
      }
      return;
    }

    // Case 3: Not in local page list -> Query backend strictly by AWB
    try {
      const res = await flipkartOrderService.updateScanStatusByAwb(clean, "SCANNED");
      const updated = res.data;

      scannedAwbsRef.current.add(cleanLower);
      if (updated?.awb) scannedAwbsRef.current.add(updated.awb.trim().toLowerCase());

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
        text: `AWB "${clean}" scanned and marked as SCANNED! (${updated.orderId} • ${updated.customer})`,
        type: "success",
        order: updated,
      });
      await playSound(successSound);

      if (onSuccessCallback) {
        onSuccessCallback(updated);
      }
    } catch (err: any) {
      const serverMessage = err?.message || err?.response?.data?.message;
      const errorMsg =
        serverMessage ||
        `Invalid Barcode: Flipkart AWB tracking barcode "${clean}" not found. Only valid AWB tracking barcodes can be scanned.`;

      if (errorMsg.includes("already scanned")) {
        scannedAwbsRef.current.add(cleanLower);
        const orderData = err?.response?.data?.data;
        if (orderData?.awb) scannedAwbsRef.current.add(orderData.awb.trim().toLowerCase());

        setMessage({
          text: errorMsg,
          type: "warning",
          order: orderData,
        });

        if (orderData && orderData.id) {
          setOrders((prev) => {
            const next = prev.map((item) =>
              item.id === orderData.id ? { ...item, packingScanStatus: "SCANNED" as const } : item
            );
            const pendingList = next.filter((item) => item.packingScanStatus === "PENDING");
            const scannedList = next.filter((item) => item.packingScanStatus === "SCANNED");
            return [...pendingList, ...scannedList];
          });
        }

        await playSound(alreadyScannedSound);
        removeMissingItem(clean);
      } else {
        setMessage({
          text: errorMsg,
          type: "error",
        });
        await playSound(warningSound);
        recordMissing(clean, errorMsg);
      }
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
