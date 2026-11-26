"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, UserPlus, ClipboardList } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";

export interface AdditionalExpenseItem {
  itemNo?: number;
  particulars: string;
  serviceProviderName: string;
  serviceProviderId?: string | null;
  lrNo: string;
  amount: number | string;
}

interface PartyOption {
  id: string;
  partyName: string;
}

interface AdditionalExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  expenses: AdditionalExpenseItem[];
  onSave: (expenses: AdditionalExpenseItem[], totalAmount: number) => void;
}

const DEFAULT_PARTICULARS = [
  "Transport",
  "Freight & Cartage",
  "Courier",
  "Packaging",
  "Loading / Unloading",
  "Hamali",
  "Office Expense",
  "Maintenance",
  "Other",
];

export default function AdditionalExpensesModal({
  isOpen,
  onClose,
  title = "Additional Expenses",
  subtitle = "Manage additional expenses",
  expenses,
  onSave,
}: AdditionalExpensesModalProps) {
  const [rows, setRows] = useState<AdditionalExpenseItem[]>([]);
  const [parties, setParties] = useState<PartyOption[]>([]);
  const [particularNames, setParticularNames] =
    useState<string[]>(DEFAULT_PARTICULARS);
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRows(
        Array.isArray(expenses) && expenses.length > 0
          ? expenses.map((e, i) => ({
              itemNo: i + 1,
              particulars: e.particulars || "",
              serviceProviderName: e.serviceProviderName || "",
              serviceProviderId: e.serviceProviderId || null,
              lrNo: e.lrNo || "",
              amount: e.amount ?? "",
            }))
          : []
      );
    }
  }, [isOpen, expenses]);

  const fetchParties = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/parties?limit=500`);
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        setParties(list.map((p: any) => ({ id: p.id, partyName: p.partyName })));
      }
    } catch (err) {
      console.error("Failed to fetch parties for Additional Expenses:", err);
    }
  };

  const fetchParticulars = async () => {
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/setting-masters?type=expenseac`
      );
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        const dbNames = list
          .map((item: any) => String(item?.name || item?.label || item || "").trim())
          .filter(Boolean);
        const merged = Array.from(new Set([...dbNames, ...DEFAULT_PARTICULARS]));
        setParticularNames(merged);
      }
    } catch {
      // Keep default particulars if settings endpoint is unavailable
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchParties();
      fetchParticulars();
    }
  }, [isOpen]);

  const particularOptions: ThemeSelectOption[] = useMemo(() => {
    const existingRowValues = rows
      .map((r) => r.particulars?.trim())
      .filter(Boolean);
    const all = Array.from(new Set([...particularNames, ...existingRowValues]));
    return all.map((name) => ({ value: name, label: name }));
  }, [particularNames, rows]);

  const serviceProviderOptions: ThemeSelectOption[] = useMemo(() => {
    const map = new Map<string, ThemeSelectOption>();
    parties.forEach((p) => {
      if (p.partyName) {
        map.set(p.partyName, { value: p.partyName, label: p.partyName });
      }
    });
    rows.forEach((r) => {
      const name = r.serviceProviderName?.trim();
      if (name && !map.has(name)) {
        map.set(name, { value: name, label: name });
      }
    });
    return Array.from(map.values());
  }, [parties, rows]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        itemNo: prev.length + 1,
        particulars: "",
        serviceProviderName: "",
        serviceProviderId: null,
        lrNo: "",
        amount: "",
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((r, i) => ({ ...r, itemNo: i + 1 }))
    );
  };

  const handleRowChange = (
    index: number,
    field: keyof AdditionalExpenseItem,
    value: any
  ) => {
    setRows((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };
      if (field === "serviceProviderName") {
        const matched = parties.find(
          (p) =>
            p.partyName.toLowerCase() ===
            String(value || "").trim().toLowerCase()
        );
        updated.serviceProviderId = matched ? matched.id : null;
      }
      next[index] = updated;
      return next;
    });
  };

  const totalAmount = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleSaveClick = () => {
    const cleaned: AdditionalExpenseItem[] = rows
      .filter(
        (r) =>
          r.particulars.trim() ||
          r.serviceProviderName.trim() ||
          r.lrNo.trim() ||
          Number(r.amount) > 0
      )
      .map((r, idx) => ({
        itemNo: idx + 1,
        particulars: r.particulars.trim(),
        serviceProviderName: r.serviceProviderName.trim(),
        serviceProviderId: r.serviceProviderId || null,
        lrNo: r.lrNo.trim(),
        amount: Number(r.amount) || 0,
      }));
    const sum =
      Math.round(
        cleaned.reduce((acc, r) => acc + (Number(r.amount) || 0), 0) * 100
      ) / 100;
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
          className="relative w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-4 sm:p-6 shadow-2xl space-y-4"
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

          {/* Expenses Table */}
          <div className="rounded-xl sm:rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#080B11]/60 overflow-visible">
            <div className="overflow-x-auto md:overflow-visible">
              <table className="w-full min-w-[640px] md:min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#6A4D1D] dark:text-[#E8C16D] font-bold">
                    <th className="py-2.5 px-3 w-12 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06] rounded-tl-xl sm:rounded-tl-2xl">
                      No.
                    </th>
                    <th className="py-2.5 px-3 min-w-[165px] border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                      Particulars.
                    </th>
                    <th className="py-2.5 px-3 min-w-[195px] border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                      <div className="flex items-center justify-between gap-2">
                        <span>Service Provider Name</span>
                        <button
                          type="button"
                          onClick={() => setLedgerModalOpen(true)}
                          className="grid h-6 w-6 place-items-center rounded-lg border border-[#E8C16D]/50 bg-white dark:bg-[#080B11] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] transition-colors cursor-pointer shrink-0"
                          title="Add new Service Provider / Party"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 w-32 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                      LR No.
                    </th>
                    <th className="py-2.5 px-3 w-32 text-right border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                      Amount.
                    </th>
                    <th className="py-2.5 px-2 w-16 text-center rounded-tr-xl sm:rounded-tr-2xl">
                      Actions.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5E6BE]/40 dark:divide-white/[0.05]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 px-4 text-center">
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
                        className="bg-white dark:bg-[#0F1626] hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400 border-r border-[#F5E6BE]/40 dark:border-white/[0.05]">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-2 border-r border-[#F5E6BE]/40 dark:border-white/[0.05]">
                          <ThemeSelectDropdown
                            ariaLabel="Select Particular"
                            placeholder="Select Particular"
                            value={row.particulars}
                            onChange={(val) =>
                              handleRowChange(idx, "particulars", val)
                            }
                            options={particularOptions}
                            className="w-full"
                            buttonClassName="w-full h-8 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white justify-between"
                            menuClassName="min-w-[180px] z-[70]"
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-[#F5E6BE]/40 dark:border-white/[0.05]">
                          <ThemeSelectDropdown
                            ariaLabel="Select Service Provider"
                            placeholder="Select Service Provider"
                            value={row.serviceProviderName}
                            onChange={(val) =>
                              handleRowChange(idx, "serviceProviderName", val)
                            }
                            options={serviceProviderOptions}
                            className="w-full"
                            buttonClassName="w-full h-8 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white justify-between"
                            menuClassName="min-w-[200px] z-[70]"
                          />
                        </td>
                        <td className="py-1.5 px-2 border-r border-[#F5E6BE]/40 dark:border-white/[0.05]">
                          <input
                            type="text"
                            value={row.lrNo}
                            onChange={(e) =>
                              handleRowChange(idx, "lrNo", e.target.value)
                            }
                            placeholder="Challan No"
                            className="w-full h-8 px-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
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
                            placeholder="0"
                            className="w-full h-8 px-2.5 text-xs text-right font-mono font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Remove expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer: + Add on Left, Total + Save on Right */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Add</span>
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Total:{" "}
                <span className="font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                  ₹ {totalAmount.toFixed(2)}
                </span>
              </div>
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
      </div>

      {/* Quick-add Service Provider / Party Modal */}
      <LedgerBookModal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        onPartyCreated={() => {
          fetchParties();
        }}
      />
    </>
  );
}
