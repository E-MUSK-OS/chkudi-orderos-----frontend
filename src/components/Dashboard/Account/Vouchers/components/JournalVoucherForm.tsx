"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { PlusCircle, Save, Trash2, Loader2, ChevronDown, Search, Check } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import axiosInstance from "@/services/axios";
import { journalVoucherService } from "../services/journalVoucher.service";
import type {
  JournalVoucher,
  JournalVoucherFormData,
} from "../types/journalVoucher.types";

interface PartyRecord {
  id: string;
  partyName: string;
  accountCode?: string | null;
  accountHead?: string | null;
}

interface EmployeeRecord {
  id: string;
  fullName: string;
  employeeId?: string | null;
  designation?: string | null;
  department?: string | null;
}

interface AccountOption {
  key: string;
  partyId: string | null;
  name: string;
  code: string;
  subLabel: string;
  typeLabel: "Ledger" | "Employee";
}

interface JournalVoucherFormProps {
  mode: "create" | "edit" | "view";
  initialVoucher?: JournalVoucher | null;
  onCancel: () => void;
  onSaved: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

function getTodayYMD(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getCurrentUserName(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.fullName || parsed?.email || "";
  } catch {
    return "";
  }
}

export default function JournalVoucherForm({
  mode,
  initialVoucher,
  onCancel,
  onSaved,
  onDelete,
  deleting = false,
}: JournalVoucherFormProps) {
  const isReadOnly = mode === "view";
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Searchable dropdown states for Credit A/C & Debit A/C
  const [openDropdown, setOpenDropdown] = useState<"credit" | "debit" | null>(null);
  const [creditSearch, setCreditSearch] = useState("");
  const [debitSearch, setDebitSearch] = useState("");
  const creditRef = useRef<HTMLDivElement>(null);
  const debitRef = useRef<HTMLDivElement>(null);
  const creditSearchInputRef = useRef<HTMLInputElement>(null);
  const debitSearchInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<JournalVoucherFormData>(() => {
    if (initialVoucher) {
      return {
        voucherNo: initialVoucher.voucherNo,
        date: initialVoucher.date ? initialVoucher.date.slice(0, 10) : getTodayYMD(),
        creditAccountId: initialVoucher.creditAccountId || "",
        creditAccountName: initialVoucher.creditAccountName || "",
        debitAccountId: initialVoucher.debitAccountId || "",
        debitAccountName: initialVoucher.debitAccountName || "",
        amount: initialVoucher.amount || 0,
        narration: initialVoucher.narration || "",
        refNo: initialVoucher.refNo || "",
        preparedBy: initialVoucher.preparedBy || getCurrentUserName(),
      };
    }

    return {
      voucherNo: 1,
      date: getTodayYMD(),
      creditAccountId: "",
      creditAccountName: "",
      debitAccountId: "",
      debitAccountName: "",
      amount: 0,
      narration: "",
      refNo: "",
      preparedBy: getCurrentUserName(),
    };
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [partiesRes, employeesRes, nextNo] = await Promise.all([
          axiosInstance.get("/parties", { params: { limit: 500 } }).catch(() => ({ data: { data: [] } })),
          axiosInstance.get("/employees", { params: { limit: 500 } }).catch(() => ({ data: { data: [] } })),
          mode === "create"
            ? journalVoucherService.getNextVoucherNo()
            : Promise.resolve(null),
        ]);
        if (!active) return;

        const partyList: PartyRecord[] = Array.isArray(partiesRes.data?.data)
          ? partiesRes.data.data
          : [];
        const employeeList: EmployeeRecord[] = Array.isArray(employeesRes.data?.data)
          ? employeesRes.data.data
          : [];

        const combined: AccountOption[] = [
          ...partyList.map((p) => ({
            key: `party_${p.id}`,
            partyId: p.id,
            name: p.partyName,
            code: p.accountCode || "",
            subLabel: [p.accountCode, p.accountHead || "Ledger"].filter(Boolean).join(" • "),
            typeLabel: "Ledger" as const,
          })),
          ...employeeList.map((emp) => ({
            key: `emp_${emp.id}`,
            partyId: null,
            name: emp.fullName,
            code: emp.employeeId || "",
            subLabel: [emp.employeeId, emp.designation || emp.department || "Employee"]
              .filter(Boolean)
              .join(" • "),
            typeLabel: "Employee" as const,
          })),
        ];

        setAccountOptions(combined);
        if (nextNo !== null) {
          setFormData((prev) => ({ ...prev, voucherNo: nextNo }));
        }
      } catch (err) {
        console.error("Failed to fetch journal form data:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, [mode]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !creditRef.current?.contains(target) &&
        !debitRef.current?.contains(target)
      ) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown === "credit") {
      document.addEventListener("mousedown", handleOutside);
      setTimeout(() => creditSearchInputRef.current?.focus(), 0);
    } else if (openDropdown === "debit") {
      document.addEventListener("mousedown", handleOutside);
      setTimeout(() => debitSearchInputRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openDropdown]);

  const filteredCreditAccounts = useMemo(() => {
    const q = creditSearch.trim().toLowerCase();
    if (!q) return accountOptions;
    return accountOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.code.toLowerCase().includes(q) ||
        opt.subLabel.toLowerCase().includes(q) ||
        opt.typeLabel.toLowerCase().includes(q)
    );
  }, [accountOptions, creditSearch]);

  const filteredDebitAccounts = useMemo(() => {
    const q = debitSearch.trim().toLowerCase();
    if (!q) return accountOptions;
    return accountOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        opt.code.toLowerCase().includes(q) ||
        opt.subLabel.toLowerCase().includes(q) ||
        opt.typeLabel.toLowerCase().includes(q)
    );
  }, [accountOptions, debitSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setError("");

    if (!formData.date) {
      setError("Please select Date.");
      return;
    }
    if (!formData.creditAccountName) {
      setError("Please select Credit A/C.");
      return;
    }
    if (!formData.debitAccountName) {
      setError("Please select Debit A/C.");
      return;
    }
    if (!Number(formData.amount) || Number(formData.amount) <= 0) {
      setError("Please enter an Amount greater than 0.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        voucherNo: Number(formData.voucherNo) || undefined,
        amount: Number(formData.amount || 0),
      };

      if (mode === "edit" && initialVoucher) {
        await journalVoucherService.update(initialVoucher.id, payload);
      } else {
        await journalVoucherService.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to save journal voucher."
      );
    } finally {
      setSaving(false);
    }
  };

  const labelClass =
    "block text-xs font-bold text-[#0A0E1A] dark:text-slate-200 mb-1.5";
  const inputClass =
    "w-full h-11 px-4 text-sm font-medium rounded-2xl bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/40 focus:border-[#E8C16D] disabled:opacity-60 transition-colors";
  const dropdownButtonClass = "w-full h-11";

  const renderAccountDropdown = (
    type: "credit" | "debit",
    label: string,
    selectedId: string,
    selectedName: string,
    searchVal: string,
    setSearchVal: (v: string) => void,
    list: AccountOption[],
    containerRef: React.RefObject<HTMLDivElement | null>,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    const isOpen = openDropdown === type;
    return (
      <div>
        <label className={labelClass}>
          {label} <span className="text-red-500">*</span>
        </label>
        <div ref={containerRef} className="relative w-full">
          <button
            type="button"
            disabled={isReadOnly}
            onClick={() => !isReadOnly && setOpenDropdown(isOpen ? null : type)}
            className={`w-full h-11 inline-flex items-center justify-between gap-2 rounded-2xl border px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all shadow-xs outline-none select-none bg-white dark:bg-[#131622] border-[#E7E0D2] dark:border-white/[0.08] ${
              selectedName
                ? "text-[#0A0E1A] dark:text-white"
                : "text-slate-400 dark:text-slate-500"
            } ${
              isReadOnly
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
            } ${
              isOpen
                ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#F5C451] dark:ring-[#F5C451]/30"
                : ""
            }`}
          >
            <span className="truncate text-left">
              {selectedName || "Select..."}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-[#E7E0D2] bg-white dark:border-white/[0.08] dark:bg-[#0F1626] p-2 shadow-xl dark:shadow-black/50">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451] pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search account by name or code..."
                  className="w-full h-9 pl-8 pr-3 text-xs font-medium rounded-xl bg-[#F7F5F0]/80 dark:bg-[#080B11] border border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C16D] dark:focus:border-[#F5C451]"
                />
              </div>

              <div className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 pr-1">
                {list.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No account found.
                  </div>
                ) : (
                  list.map((opt) => {
                    const isSelected =
                      Boolean(selectedName) &&
                      opt.name === selectedName &&
                      (opt.partyId ? opt.partyId === selectedId : !selectedId);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          if (type === "credit") {
                            setFormData((p) => ({
                              ...p,
                              creditAccountId: opt.partyId || "",
                              creditAccountName: opt.name,
                            }));
                            setCreditSearch("");
                          } else {
                            setFormData((p) => ({
                              ...p,
                              debitAccountId: opt.partyId || "",
                              debitAccountName: opt.name,
                            }));
                            setDebitSearch("");
                          }
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#E8C16D] text-[#0A0E1A] dark:bg-[#F5C451] dark:text-[#080B11]"
                            : "text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E]"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate">{opt.name}</div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected
                                ? "text-[#0A0E1A]/75"
                                : "text-slate-400 dark:text-slate-400"
                            }`}
                          >
                            {opt.subLabel || opt.typeLabel}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isSelected
                                ? "bg-[#0A0E1A]/15 text-[#0A0E1A]"
                                : opt.typeLabel === "Employee"
                                ? "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                                : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                            }`}
                          >
                            {opt.typeLabel}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <form id="journal-voucher-form" onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm p-5 sm:p-7 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-4 lg:border-r lg:border-[#F1E8D0] lg:dark:border-white/[0.08] lg:pr-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D] border-b border-[#F1E8D0] dark:border-white/[0.08] pb-2">
              Journal Entry Details
            </h2>

            {/* J.V. No & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>J.V. No.</label>
                <input
                  type="number"
                  value={formData.voucherNo}
                  readOnly
                  disabled
                  className={`${inputClass} tabular-nums opacity-75 blur-[0.35px] cursor-not-allowed select-none`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.date}
                  onChange={(_, str) => setFormData((p) => ({ ...p, date: str || "" }))}
                  dateFormat="dd-MM-yyyy"
                  disabled={isReadOnly}
                  className="w-full"
                  buttonClassName={dropdownButtonClass}
                />
              </div>
            </div>

            {renderAccountDropdown(
              "credit",
              "Credit A/C",
              formData.creditAccountId,
              formData.creditAccountName,
              creditSearch,
              setCreditSearch,
              filteredCreditAccounts,
              creditRef,
              creditSearchInputRef
            )}

            {renderAccountDropdown(
              "debit",
              "Debit A/C",
              formData.debitAccountId,
              formData.debitAccountName,
              debitSearch,
              setDebitSearch,
              filteredDebitAccounts,
              debitRef,
              debitSearchInputRef
            )}

            <div>
              <label className={labelClass}>
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))}
                  onFocus={() => {
                    if (String(formData.amount).trim() === "0") {
                      setFormData((p) => ({ ...p, amount: "" }));
                    }
                  }}
                  onBlur={() => {
                    if (String(formData.amount).trim() === "") {
                      setFormData((p) => ({ ...p, amount: 0 }));
                    }
                  }}
                  placeholder="0.00"
                  disabled={isReadOnly}
                  className={`${inputClass} pl-8 tabular-nums`}
                />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D] border-b border-[#F1E8D0] dark:border-white/[0.08] pb-2">
              Additional &amp; Reference
            </h2>

            <div>
              <label className={labelClass}>Narration</label>
              <textarea
                rows={4}
                value={formData.narration}
                onChange={(e) => setFormData((p) => ({ ...p, narration: e.target.value }))}
                placeholder="Enter Narration / Remarks..."
                disabled={isReadOnly}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-2xl bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/40 focus:border-[#E8C16D] disabled:opacity-60 transition-colors"
              />
            </div>

            <div>
              <label className={labelClass}>Reference No.</label>
              <input
                type="text"
                value={formData.refNo}
                onChange={(e) => setFormData((p) => ({ ...p, refNo: e.target.value }))}
                placeholder="Enter Reference No..."
                disabled={isReadOnly}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Bottom Footer Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-7 py-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
            Prepared By
          </span>
          <input
            type="text"
            value={formData.preparedBy}
            disabled
            readOnly
            className="h-10 px-4 text-xs sm:text-sm rounded-2xl bg-[#FEFAEE]/80 dark:bg-[#080B11]/80 border border-[#E8C16D]/40 dark:border-white/[0.08] text-[#0A0E1A]/75 dark:text-white/75 font-semibold w-full sm:w-56 focus:outline-none opacity-65 blur-[0.45px] cursor-not-allowed select-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting || saving}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-red-600 hover:bg-red-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white disabled:opacity-60 transition-colors cursor-pointer shadow-sm"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="h-10 px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border border-[#E7E0D2] dark:border-white/[0.12] text-[#0A0E1A] dark:text-slate-200 hover:bg-[#F7F5F0] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              {isReadOnly ? "Close" : "Cancel"}
            </button>
          )}
          {!isReadOnly && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] text-[#0A0E1A] disabled:opacity-60 transition-all shadow-sm cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Saving..."}
                </>
              ) : mode === "edit" ? (
                <>
                  <Save className="h-4 w-4 stroke-[2.2]" />
                  Update
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 stroke-[2.5]" />
                  Save
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
