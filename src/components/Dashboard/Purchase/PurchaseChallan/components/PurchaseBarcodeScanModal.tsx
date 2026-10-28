"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScanBarcode, X, CheckCircle2, AlertCircle, Trash2, ArrowRight } from "lucide-react";
import { PurchaseChallanItem } from "../types/purchaseChallan.types";
import { purchaseChallanService } from "../services/purchaseChallan.service";
import { toast } from "sonner";

interface PurchaseBarcodeScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PurchaseChallanItem[];
  onUpdateItems: (newItems: PurchaseChallanItem[]) => void;
}

interface ScanLogEntry {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  time: string;
  isNew: boolean;
}

export default function PurchaseBarcodeScanModal({
  isOpen,
  onClose,
  items,
  onUpdateItems,
}: PurchaseBarcodeScanModalProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);
  const [lastScannedItem, setLastScannedItem] = useState<{
    sku: string;
    qty: number;
    isNew: boolean;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Play crisp scanner beep via Web Audio API
  const playBeep = (success: boolean = true) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.type = "sine";
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio playback silently ignored if blocked
    }
  };

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setBarcodeInput("");
      setLastScannedItem(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleProcessBarcode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    try {
      setIsProcessing(true);
      const cleanItems = [...items];
      const existingIdx = cleanItems.findIndex(
        (it) => it.sku.trim().toLowerCase() === code.toLowerCase()
      );

      const now = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      if (existingIdx !== -1) {
        // Increment received quantity on existing item
        const existing = cleanItems[existingIdx];
        const nextQty = (Number(existing.receivedQty) || 0) + 1;
        cleanItems[existingIdx] = {
          ...existing,
          receivedQty: nextQty,
          amount: nextQty * (Number(existing.rate) || 0),
        };

        onUpdateItems(cleanItems);
        playBeep(true);

        setLastScannedItem({
          sku: existing.sku,
          qty: nextQty,
          isNew: false,
        });

        setScanLog((prev) => [
          {
            id: Math.random().toString(),
            sku: existing.sku,
            name: existing.name || existing.sku,
            quantity: nextQty,
            time: now,
            isNew: false,
          },
          ...prev.slice(0, 49),
        ]);
      } else {
        // Try to fetch product title from SKU suggestions
        let productName = "";
        let rate = 0;
        try {
          const suggestions = await purchaseChallanService.searchSkus(code);
          const match = suggestions.find(
            (s) => s.sku.trim().toLowerCase() === code.toLowerCase()
          );
          if (match) {
            if (match.name && match.name.trim().toLowerCase() !== code.toLowerCase()) {
              productName = match.name.trim();
            }
            rate = match.rate || 0;
          }
        } catch (_) {}

        const newItem: PurchaseChallanItem = {
          itemNo: cleanItems.length + 1,
          sku: code,
          name: productName,
          orderedQty: 1,
          receivedQty: 1,
          rate,
          amount: rate,
          printBarcode: true,
        };

        const updated = [...cleanItems, newItem];
        onUpdateItems(updated);
        playBeep(true);

        setLastScannedItem({
          sku: code,
          qty: 1,
          isNew: true,
        });

        setScanLog((prev) => [
          {
            id: Math.random().toString(),
            sku: code,
            name: productName,
            quantity: 1,
            time: now,
            isNew: true,
          },
          ...prev.slice(0, 49),
        ]);
      }

      setBarcodeInput("");
    } catch (err: any) {
      playBeep(false);
      toast.error(err.message || "Failed to process barcode");
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleProcessBarcode(barcodeInput);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-[#E7E0D2] bg-white dark:border-white/[0.08] dark:bg-[#0F1626] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E7E0D2] dark:border-white/[0.08] p-4 bg-slate-50 dark:bg-[#080B11]">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
              <ScanBarcode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Inward Barcode Scanner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan product SKU or barcode to increment received quantity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Scanner Input Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Scan Barcode / SKU
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                placeholder="Point scanner gun and scan..."
                className="w-full h-11 pl-3.5 pr-20 text-sm font-mono tracking-wide rounded-xl border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleProcessBarcode(barcodeInput)}
                disabled={!barcodeInput.trim() || isProcessing}
                className="absolute right-1.5 top-1.5 h-8 px-3 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Add</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Hardware barcode scanners usually send Enter automatically after reading.
            </p>
          </div>

          {/* Last Scanned Item Banner */}
          {lastScannedItem && (
            <div className="p-3 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <div>
                  <span className="font-bold">{lastScannedItem.sku}</span>
                  <span className="ml-1 text-[11px] opacity-80">
                    {lastScannedItem.isNew ? "(New line added)" : "(Quantity updated)"}
                  </span>
                </div>
              </div>
              <div className="font-mono font-bold bg-teal-500/20 px-2 py-0.5 rounded text-xs">
                Rec: {lastScannedItem.qty} Pcs
              </div>
            </div>
          )}

          {/* Scan History */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Scan Session Log ({scanLog.length})
              </span>
              {scanLog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScanLog([])}
                  className="text-[11px] text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-0.5 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.04]">
              {scanLog.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No items scanned yet in this session.
                </div>
              ) : (
                scanLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 dark:text-white truncate">
                        {log.sku}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {log.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {log.quantity} Pcs
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {log.time}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E7E0D2] dark:border-white/[0.08] p-3 bg-slate-50 dark:bg-[#080B11] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-8.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </div>
  );
}
