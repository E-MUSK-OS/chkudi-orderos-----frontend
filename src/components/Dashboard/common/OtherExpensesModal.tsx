"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, UserPlus, ClipboardList } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";

export interface OtherExpenseItem {
  itemNo?: number;
  expenseName: string;
  amount: number | string;
}

interface OtherExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  expenses: OtherExpenseItem[];
  onSave: (expenses: OtherExpenseItem[], totalAmount: number) => void;
}

const DEFAULT_EXPENSE_NAMES = [
  "Freight & Cartage",
  "Transport",
  "Courier",
  "Packaging",
  "Loading / Unloading",
  "Hamali",
  "Office Expense",
  "Utilities",
  "Rent",
  "Maintenance",
  "Other",
];

export default function OtherExpensesModal({
  isOpen,
  onClose,
  title = "Other Expenses",
  subtitle = "Manage other expenses for this Debit Note",
  expenses,
  onSave,
}: OtherExpensesModalProps) {
  const [rows, setRows] = useState<OtherExpenseItem[]>([]);
  const [expenseNames, setExpenseNames] = useState<string[]>(DEFAULT_EXPENSE_NAMES);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRows(
        Array.isArray(expenses) && expenses.length > 0
          ? expenses.map((e, i) => ({
              itemNo: i + 1,
              expenseName: e.expenseName || "",
              amount: e.amount ?? "",
            }))
          : []
      );
    }
  }, [isOpen, expenses]);

  const fetchExpenseMasters = async () => {
    try {
      const [expRes, partyRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/setting-masters?type=expenseac`),
        fetchWithAuth(`${API_BASE_URL}/parties?limit=500`),
      ]);
      const names = new Set<string>(DEFAULT_EXPENSE_NAMES);
      if (expRes.ok) {
        const expJson = await expRes.json();
        (Array.isArray(expJson?.data) ? expJson.data : []).forEach((it: any) => {
          const n = String(it?.name || it?.label || it || "").trim();
          if (n) names.add(n);
        });
      }
      if (partyRes.ok) {
        const partyJson = await partyRes.json();
        (Array.isArray(partyJson?.data) ? partyJson.data : []).forEach((p: any) => {
          if (
            p?.accountHead === "Direct Expenses" ||
            p?.accountHead === "Indirect Expenses"
          ) {
            if (p.partyName) names.add(String(p.partyName).trim());
          }
        });
      }
      setExpenseNames(Array.from(names));
    } catch {
      // Keep default options
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExpenseMasters();
    }
  }, [isOpen]);

  const expenseOptions: ThemeSelectOption[] = useMemo(() => {
    const existing = rows.map((r) => r.expenseName?.trim()).filter(Boolean);
    return Array.from(new Set([...expenseNames, ...existing])).map((name) => ({
      value: name,
      label: name,
    }));
  }, [expenseNames, rows]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { itemNo: prev.length + 1, expenseName: "", amount: "" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) =>
      prev.filter((_, i) => i !== index).map((r, idx) => ({ ...r, itemNo: idx + 1 }))
    );
  };

  const handleRowChange = (index: number, field: keyof OtherExpenseItem, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const totalAmount =
    Math.round(rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) * 100) / 100;

  const handleSaveClick = () => {
    const cleaned: OtherExpenseItem[] = rows
      .filter((r) => r.expenseName.trim() || Number(r.amount) > 0)
      .map((r, idx) => ({
        itemNo: idx + 1,
        expenseName: r.expenseName.trim() || "Other Expense",
        amount: Number(r.amount) || 0,
      }));
    const sum =
      Math.round(cleaned.reduce((acc, r) => acc + (Number(r.amount) || 0), 0) * 100) /
      100;
    onSave(cleaned, sum);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-2xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0A0E1A] dark:text-white tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#080B11]/60 overflow-visible">
            <div className="overflow-x-auto sm:overflow-visible">
              <table className="w-full min-w-[420px] sm:min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#6A4D1D] dark:text-[#E8C16D] font-bold">
                    <th className="py-2.5 px-3 w-12 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06] rounded-tl-xl sm:rounded-tl-2xl">
                      No.
                    </th>
                    <th className="py-2.5 px-3 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span>Expense Name</span>
                        <button
                          type="button"
                          onClick={() => setLedgerModalOpen(true)}
                          className="grid h-6 w-6 place-items-center rounded-lg border border-[#E8C16D]/50 bg-white dark:bg-[#080B11] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] transition-colors cursor-pointer shrink-0"
                          title="Add Expense Ledger"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 w-36 text-right border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                      Amount
                    </th>
                    <th className="py-2.5 px-2 w-14 text-center rounded-tr-xl sm:rounded-tr-2xl">
                      Del.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E6BE]/40 dark:divide-white/[0.05]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 text-[#B88728] dark:text-[#E8C16D]">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            No data available
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="bg-white dark:bg-[#0F1626] hover:bg-slate-50/70 dark:hover:bg-white/[0.02]"
                      >
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400 border-r border-[#F5E6BE]/40 dark:border-white/[0.05]">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-2 border-r border-[#F5E6BE]/40 dark:border-white/[0.05]">
                          <ThemeSelectDropdown
                            ariaLabel="Select Expense"
                            placeholder="Select Expense"
                            value={row.expenseName}
                            onChange={(val) =>
                              handleRowChange(idx, "expenseName", val)
                            }
                            options={expenseOptions}
                            className="w-full"
                            buttonClassName="w-full h-8 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white justify-between"
                            menuClassName="min-w-[200px] z-[70]"
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-[#F5E6BE]/40 dark:border-white/[0.05]">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.amount}
                            onChange={(e) =>
                              handleRowChange(idx, "amount", e.target.value)
                            }
                            placeholder="0.00"
                            className="w-full h-8 px-2.5 text-xs text-right font-mono font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t border-[#E7E0D2] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-xs font-bold">
                  <tr>
                    <td className="py-2 px-3 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]" />
                    <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                      Total:
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D] border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                      ₹ {totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2 px-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Add</span>
            </button>

            <button
              type="button"
              onClick={handleSaveClick}
              className="inline-flex items-center justify-center h-9 px-5 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-[0.98]"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <LedgerBookModal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        defaultAccountHead="Direct Expenses"
        onPartyCreated={() => {
          fetchExpenseMasters();
        }}
      />
    </>
  );
}
