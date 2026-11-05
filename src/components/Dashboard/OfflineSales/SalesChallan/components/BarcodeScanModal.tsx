"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScanBarcode, X, CheckCircle2, AlertCircle, Trash2, ArrowRight } from "lucide-react";
import { SalesChallanItem } from "../types/challan.types";
import { challanService } from "../services/challan.service";
import { toast } from "sonner";

interface BarcodeScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SalesChallanItem[];
  onUpdateItems: (newItems: SalesChallanItem[]) => void;
}

interface ScanLogEntry {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  time: string;
  isNew: boolean;
}

export default function BarcodeScanModal({
  isOpen,
  onClose,
  items,
  onUpdateItems,
}: BarcodeScanModalProps) {
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

      // Search database for SKU or barcode mapping
      let matchedSku = code;
      let matchedName = "";
      let matchedRate = 0;

      try {
        const results = await challanService.searchSkus(code);
        if (results && results.length > 0) {
          // Exact match preferred
          const exact = results.find(
            (r) => r.sku.toLowerCase() === code.toLowerCase()
          );
          const pick = exact || results[0];
          matchedSku = pick.sku;
          matchedName = pick.name || "";
          matchedRate = pick.rate || 0;
        }
      } catch {
        // Fallback to code as SKU
      }

      const updated = [...items];
      const existingIdx = updated.findIndex(
        (i) => i.sku.trim().toLowerCase() === matchedSku.trim().toLowerCase()
      );

      let isNew = false;
      let finalQty = 1;

      if (existingIdx >= 0) {
        // Increment quantity of existing row
        const currentQty = Number(updated[existingIdx].quantity) || 0;
        finalQty = currentQty + 1;
        const rate = Number(updated[existingIdx].rate) || matchedRate || 0;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: finalQty,
          rate,
          amount: finalQty * rate,
        };
      } else {
        // Check if there is only 1 blank row
        if (updated.length === 1 && !updated[0].sku.trim()) {
          updated[0] = {
            ...updated[0],
            sku: matchedSku,
            name: matchedName,
            quantity: 1,
            rate: matchedRate,
            amount: matchedRate,
          };
          finalQty = 1;
          isNew = true;
        } else {
          // Append new row
          isNew = true;
          finalQty = 1;
          updated.push({
            itemNo: updated.length + 1,
            sku: matchedSku,
            name: matchedName,
            quantity: 1,
            rate: matchedRate,
            amount: matchedRate,
            dispatchDate: "1",
            subCn: "",
            remarks: "",
            printBarcode: true,
          });
        }
      }

      onUpdateItems(updated);
      playBeep(true);

      setLastScannedItem({
        sku: matchedSku,
        qty: finalQty,
        isNew,
      });

      // Add to session scan log
      const logEntry: ScanLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        sku: matchedSku,
        name: matchedName,
        quantity: finalQty,
        time: new Date().toLocaleTimeString(),
        isNew,
      };
      setScanLog((prev) => [logEntry, ...prev.slice(0, 19)]);

      setBarcodeInput("");
    } catch (err: any) {
      playBeep(false);
      toast.error(err.message || "Failed to process barcode");
    } finally {
      setIsProcessing(false);
      // Keep input focused for next scan
      setTimeout(() => inputRef.current?.focus(), 50);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0F1626] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E7E0D2] dark:border-white/[0.08] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] transition-all">
        {/* Modal Header */}
        <div className="bg-[#0A0E1A] dark:bg-[#080B11] text-[#E8C16D] px-5 py-4 flex items-center justify-between border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF9EC]/10 text-[#E8C16D] border border-[#E8C16D]/30">
              <ScanBarcode className="w-4 h-4 text-[#E8C16D]" />
            </div>
            <h3 className="font-bold text-sm tracking-tight text-[#E8C16D]">
              Barcode / SKU Scanner Mode
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto bg-white dark:bg-[#0F1626]">
          {/* Scanner Input Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Scan Barcode or Type SKU:</span>
              <span className="text-[11px] font-semibold text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] px-2.5 py-0.5 rounded-full border border-[#E8C16D]/40">
                Auto-Increments Quantity
              </span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode with scanner gun or type SKU..."
                disabled={isProcessing}
                className="w-full h-11 pl-4 pr-22 text-sm font-medium bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-inner focus:outline-hidden focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
              />
              <button
                type="button"
                onClick={() => handleProcessBarcode(barcodeInput)}
                disabled={!barcodeInput.trim() || isProcessing}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-[#E8C16D] hover:bg-[#d4af5a] disabled:opacity-40 disabled:hover:bg-[#E8C16D] text-[#0A0E1A] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs active:scale-[0.98]"
              >
                <span>Add</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Point your handheld USB barcode scanner at the barcode, or type SKU and press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded-md text-[10px] font-mono text-slate-700 dark:text-slate-300">Enter</kbd>.
            </p>
          </div>

          {/* Last Scanned Feedback Box */}
          {lastScannedItem && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                lastScannedItem.isNew
                  ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                  : "bg-[#FFF9EC] dark:bg-[#1A160E] border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{lastScannedItem.sku}</span>
                  <span className="ml-1.5 text-[11px] opacity-80">
                    {lastScannedItem.isNew ? "(New item added)" : "(Quantity updated)"}
                  </span>
                </div>
              </div>
              <span className="font-bold text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white px-2.5 py-1 rounded-xl shadow-xs">
                Qty: {lastScannedItem.qty}
              </span>
            </div>
          )}

          {/* Session Scan Log */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Scanned in this Session ({scanLog.length})</span>
              {scanLog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScanLog([])}
                  className="text-slate-400 hover:text-rose-500 flex items-center gap-1 text-[11px] transition-colors cursor-pointer font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="border border-[#E7E0D2] dark:border-white/[0.08] rounded-2xl max-h-44 overflow-y-auto divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-slate-50/50 dark:bg-[#080B11]/50 text-xs">
              {scanLog.length === 0 ? (
                <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                  No items scanned yet in this session.
                </div>
              ) : (
                scanLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-[#0A0E1A] dark:text-white">
                        {log.sku}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {log.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#0A0E1A] dark:text-white bg-white dark:bg-[#0F1626] border border-slate-200 dark:border-white/[0.08] px-2.5 py-0.5 rounded-lg text-xs shadow-2xs">
                        Qty: {log.quantity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-[#080B11] border-t border-[#E7E0D2] dark:border-white/[0.08] px-5 py-3.5 flex items-center justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Total Items in Challan: <span className="font-black text-[#0A0E1A] dark:text-white ml-1">{items.filter(i => Boolean(i.sku.trim())).length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold rounded-2xl text-xs transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
          >
            Done / Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
