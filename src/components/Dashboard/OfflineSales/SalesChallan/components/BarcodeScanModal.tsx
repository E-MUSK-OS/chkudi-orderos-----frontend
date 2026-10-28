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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="bg-[#1e5162] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-teal-300" />
            <h3 className="font-semibold text-sm">
              Barcode / SKU Scanner Mode
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Scanner Input Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span>Scan Barcode or Type SKU:</span>
              <span className="text-[11px] font-normal text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
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
                className="w-full h-10 pl-3 pr-20 text-sm font-medium bg-white border-2 border-[#00A8B5] rounded-md shadow-inner focus:outline-hidden focus:ring-2 focus:ring-[#00A8B5]/30 text-gray-800"
              />
              <button
                type="button"
                onClick={() => handleProcessBarcode(barcodeInput)}
                disabled={!barcodeInput.trim() || isProcessing}
                className="absolute right-1 top-1 bottom-1 px-3 bg-[#00A8B5] hover:bg-[#008e9a] disabled:bg-gray-300 text-white rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Add</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Point your handheld USB barcode scanner at the barcode, or type SKU and press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono">Enter</kbd>.
            </p>
          </div>

          {/* Last Scanned Feedback Box */}
          {lastScannedItem && (
            <div
              className={`p-3 rounded-md border text-xs flex items-center justify-between ${
                lastScannedItem.isNew
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">{lastScannedItem.sku}</span>
                  <span className="ml-1 text-[11px]">
                    {lastScannedItem.isNew ? "(New item added)" : "(Quantity updated)"}
                  </span>
                </div>
              </div>
              <span className="font-bold text-xs bg-white px-2 py-0.5 rounded shadow-2xs">
                Qty: {lastScannedItem.qty}
              </span>
            </div>
          )}

          {/* Session Scan Log */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
              <span>Scanned in this Session ({scanLog.length})</span>
              {scanLog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScanLog([])}
                  className="text-gray-400 hover:text-red-600 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-md max-h-44 overflow-y-auto divide-y divide-gray-100 text-xs">
              {scanLog.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-xs italic">
                  No items scanned yet in this session.
                </div>
              ) : (
                scanLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 flex items-center justify-between hover:bg-gray-50/80"
                  >
                    <div>
                      <div className="font-medium text-gray-800">
                        {log.sku}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {log.time}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">
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
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            Total Items in Challan: <span className="font-bold text-gray-900">{items.filter(i => Boolean(i.sku.trim())).length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1e5162] hover:bg-[#163e4c] text-white rounded text-xs font-medium transition-colors cursor-pointer"
          >
            Done / Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
