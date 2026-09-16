"use client";

import { useEffect, useRef, useState } from "react";
import { formatToIST, getNowIsoIST } from "../timeUtils";
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
      const errorMsg = `Invalid scan: Empty or blank barcode. Please scan a valid Amazon AWB tracking barcode.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      setIsScanning(false);
      return;
    }

    // 1. Strict check: Is the scanned barcode an Amazon Order ID?
    // Matches Amazon 3-7-7 order format (e.g. 402-1234567-1234567) or matches any orderId in current orders
    const isOrderIdPattern = /^\d{3}-\d{7}-\d{7}$/.test(clean);
    const matchedOrderIdItem = orders.find(
      (item) =>
        (item.orderId || "").trim().toLowerCase() === cleanLower &&
        (item.awb || "").trim().toLowerCase() !== cleanLower
    );
    if (isOrderIdPattern || matchedOrderIdItem) {
      const orderRef = matchedOrderIdItem ? ` (Order #${matchedOrderIdItem.orderId})` : "";
      const errorMsg = `Invalid Barcode: Scanned Amazon Order ID "${clean}"${orderRef}. Only the shipping carrier AWB tracking barcode is valid for scanning.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      recordMissing(clean, errorMsg);
      setIsScanning(false);
      return;
    }

    // 2. Strict check: Is the scanned barcode an ASIN?
    // Matches standard 10-char ASIN (e.g. B0...) or matches any ASIN in current orders
    const isAsinPattern = /^B[0-9A-Z]{9}$/i.test(clean);
    const matchedAsinItem = orders.find((item) => {
      const asins = (item.asin || "").split(/[\r\n]+|\s+\/\s+|\s*,\s*/).map((s) => s.trim().toLowerCase());
      return asins.includes(cleanLower) && (item.awb || "").trim().toLowerCase() !== cleanLower;
    });
    if (isAsinPattern || matchedAsinItem) {
      const errorMsg = `Invalid Barcode: Scanned ASIN "${clean}". Only Amazon AWB tracking barcodes are valid for scanning.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      recordMissing(clean, errorMsg);
      setIsScanning(false);
      return;
    }

    // 3. Strict check: Is the scanned barcode an Invoice number?
    const matchedInvoiceItem = orders.find(
      (item) =>
        (item.invoice || "").trim().toLowerCase() === cleanLower &&
        (item.awb || "").trim().toLowerCase() !== cleanLower
    );
    if (matchedInvoiceItem) {
      const errorMsg = `Invalid Barcode: Scanned Invoice number "${clean}". Only Amazon AWB tracking barcodes are valid for scanning.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      recordMissing(clean, errorMsg);
      setIsScanning(false);
      return;
    }

    // 4. Strict check: Is the scanned barcode a Seller SKU?
    const matchedSkuItem = orders.find((item) => {
      const skus = (item.sellerSku || "").split(/[\r\n]+|\s+\/\s+|\s*,\s*/).map((s) => s.trim().toLowerCase());
      return skus.includes(cleanLower) && (item.awb || "").trim().toLowerCase() !== cleanLower;
    });
    if (matchedSkuItem) {
      const errorMsg = `Invalid Barcode: Scanned Seller SKU "${clean}". Only Amazon AWB tracking barcodes are valid for scanning.`;
      setMessage({ text: errorMsg, type: "error" });
      await playSound(warningSound);
      recordMissing(clean, errorMsg);
      setIsScanning(false);
      return;
    }

    // 5. Strict AWB matching ONLY: Check against item.awb (never against orderId)
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

    // Case 2: Found in local list and PENDING -> Instant Optimistic Update!
    if (existing && existing.packingScanStatus === "PENDING") {
      const updatedOrder: AmazonOrderItem = {
        ...existing,
        packingScanStatus: "SCANNED",
        updatedAt: getNowIsoIST(),
      };

      // Optimistic update local state (keep pending on top, scanned below)
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

      setMessage({
        text: `AWB "${existing.awb}" verified and scanned successfully! (${existing.orderId} • ${existing.customer})`,
        type: "success",
        order: updatedOrder,
      });
      await playSound(successSound);

      // Async backend update strictly by AWB
      try {
        const targetAwb = existing.awb && existing.awb !== "N/A" ? existing.awb : clean;
        const res = await amazonOrderService.updateScanStatusByAwb(targetAwb, "SCANNED");
        if (res?.data) {
          setOrders((prev) =>
            prev.map((item) => (item.id === res.data.id ? { ...item, ...res.data } : item))
          );
        }
        if (onSuccessCallback) onSuccessCallback(res?.data || updatedOrder);
      } catch (err) {
        console.warn("Background AWB scan update failed:", err);
      } finally {
        setIsScanning(false);
      }
      return;
    }

    // Case 3: Not in local page list -> Query backend strictly by AWB
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
        text: `AWB "${clean}" scanned and marked as SCANNED! (${updated.orderId} • ${updated.customer})`,
        type: "success",
        order: updated,
      });
      await playSound(successSound);

      if (onSuccessCallback) {
        onSuccessCallback(updated);
      }
    } catch (err: any) {
      const errorMsg =
        err?.message || `Invalid Barcode: Amazon AWB tracking barcode "${clean}" not found. Only valid AWB tracking barcodes can be scanned.`;
      setMessage({
        text: errorMsg,
        type: "error",
      });
      await playSound(warningSound);
      recordMissing(clean, errorMsg);
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
