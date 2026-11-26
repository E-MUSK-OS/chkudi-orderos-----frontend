"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { MaterialRollDetail } from "../types/materialOrder.types";

interface RollDetailsModalProps {
  isOpen: boolean;
  unit: string;
  defaultRate: number;
  initialRows?: MaterialRollDetail[];
  onClose: () => void;
  onSave: (rows: MaterialRollDetail[], totalRealQty: number, avgRate?: number) => void;
}

function createEmptyRoll(itemNo: number, defaultRate: number): MaterialRollDetail {
  return {
    itemNo,
    rolls: 1,
    qty: 0,
    rate: defaultRate || 0,
    realQty: 0,
  };
}

export default function RollDetailsModal({
  isOpen,
  unit,
  defaultRate,
  initialRows,
  onClose,
  onSave,
}: RollDetailsModalProps) {
  const [rows, setRows] = useState<MaterialRollDetail[]>(() =>
    initialRows && initialRows.length > 0
      ? initialRows.map((r, i) => ({ ...r, itemNo: i + 1 }))
      : [createEmptyRoll(1, defaultRate)]
  );
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setRows(
      initialRows && initialRows.length > 0
        ? initialRows.map((r, i) => ({ ...r, itemNo: i + 1 }))
        : [createEmptyRoll(1, defaultRate)]
    );
  }, [isOpen, initialRows, defaultRate]);

  const totalRolls = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.rolls) || 0), 0),
    [rows]
  );

  const totalRealQty = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.realQty) || 0), 0),
    [rows]
  );

  if (!isOpen) return null;

  const updateRow = (idx: number, patch: Partial<MaterialRollDetail>) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const next = { ...row, ...patch };
        next.realQty =
          Math.round((Number(next.rolls) || 0) * (Number(next.qty) || 0) * 100) / 100;
        return next;
      })
    );
  };

  const addRowAndFocus = () => {
    setRows((prev) => {
      const next = [...prev, createEmptyRoll(prev.length + 1, defaultRate)];
      setTimeout(() => {
        qtyRefs.current[next.length - 1]?.focus();
      }, 30);
      return next;
    });
  };

  const removeRow = (idx: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return [createEmptyRoll(1, defaultRate)];
      return prev
        .filter((_, i) => i !== idx)
        .map((r, i) => ({ ...r, itemNo: i + 1 }));
    });
  };

  const handleSave = () => {
    const cleaned = rows
      .filter((r) => (Number(r.rolls) || 0) > 0 && (Number(r.qty) || 0) > 0)
      .map((r, i) => ({ ...r, itemNo: i + 1 }));
    const qtySum = cleaned.reduce((sum, r) => sum + (Number(r.realQty) || 0), 0);
    const firstRate = cleaned[0]?.rate;
    onSave(cleaned, qtySum, firstRate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
              Roll Details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage packet entries for this item. Press Enter in Qty field to add new row.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08]">
          <table className="w-full text-left border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-[#FFF9EC] dark:bg-[#141A29] border-b border-[#E7E0D2] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                <th className="py-2.5 px-3 w-12">No.</th>
                <th className="py-2.5 px-3">Number of Roll</th>
                <th className="py-2.5 px-3">Qty.</th>
                <th className="py-2.5 px-3">Rate.</th>
                <th className="py-2.5 px-3 text-right">Real Qty.</th>
                <th className="py-2.5 px-3 w-12 text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 font-mono text-slate-500">{row.itemNo}</td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.rolls || ""}
                      onChange={(e) => updateRow(idx, { rolls: Number(e.target.value) || 0 })}
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      ref={(el) => {
                        qtyRefs.current[idx] = el;
                      }}
                      type="number"
                      min={0}
                      step="any"
                      value={row.qty || ""}
                      onChange={(e) => updateRow(idx, { qty: Number(e.target.value) || 0 })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRowAndFocus();
                        }
                      }}
                      placeholder="Qty"
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.rate ?? ""}
                      onChange={(e) => updateRow(idx, { rate: Number(e.target.value) || 0 })}
                      className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                    {Number(row.realQty || 0).toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#FFF9EC]/60 dark:bg-[#141A29]/80 border-t border-[#E7E0D2] dark:border-white/[0.08] text-xs font-bold text-[#0A0E1A] dark:text-white">
                <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">Total. {rows.length}</td>
                <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                  <span className="text-[10px] text-slate-400 mr-1.5">Total:</span>
                  {totalRolls} Roll
                </td>
                <td className="py-2.5 px-3" />
                <td className="py-2.5 px-3" />
                <td className="py-2.5 px-3 text-right font-mono text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                  <span className="text-[10px] text-slate-400 mr-1.5">Total:</span>
                  {totalRealQty} {unit || "PCS"}
                </td>
                <td className="py-2.5 px-3" />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={addRowAndFocus}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold hover:bg-[#FFF3D6] dark:hover:bg-[#262014] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-xs font-bold text-[#0A0E1A] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
