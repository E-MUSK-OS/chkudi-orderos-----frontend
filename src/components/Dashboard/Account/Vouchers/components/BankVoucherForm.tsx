"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { PlusCircle, Save, Trash2, Loader2, ChevronDown, Search, Check } from "lucide-react";
import ThemeSelectDropdown, { type ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import axiosInstance from "@/services/axios";
import { bankVoucherService } from "../services/bankVoucher.service";
import type {
  BankBookOption,
  BankVoucher,
  BankVoucherEntryType,
  BankVoucherFormData,
} from "../types/bankVoucher.types";

interface PartyRecord {
  id: string;
  partyName: string;
  accountCode?: string | null;
  accountHead?: string | null;
  openingBalance?: number;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  bankName?: string | null;
}

interface SettlementRow {
  id: string;
  srNo: string;
  type: string;
  invoiceType: string;
  date: string;
  rawDate: number;
  partyBillNo: string;
  netAmt: number;
  dnAmt: number;
  ddnAmt: number;
  prevPaidAmt: number;
  pendingAmt: number;
  cumulativePendingAmt: number;
  status: string;
  paidAmt: number;
}

interface BankVoucherFormProps {
  mode: "create" | "edit" | "view";
  initialVoucher?: BankVoucher | null;
  bankBooks: BankBookOption[];
  onCancel: () => void;
  onSaved: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

const ENTRY_TYPE_OPTIONS: ThemeSelectOption[] = [
  { value: "Payment", label: "Payment" },
  { value: "Advanced Payment", label: "Advanced Payment" },
  { value: "Receipt", label: "Receipt" },
  { value: "Advance Receipt", label: "Advance Receipt" },
];

const TRANSACTION_TYPE_OPTIONS: ThemeSelectOption[] = [
  { value: "Cheque", label: "Cheque" },
  { value: "IFT", label: "IFT" },
  { value: "NEFT", label: "NEFT" },
  { value: "RTGS", label: "RTGS" },
  { value: "IMPS", label: "IMPS" },
  { value: "Debit/Credit", label: "Debit/Credit" },
  { value: "Paytm", label: "Paytm" },
  { value: "Bhim", label: "Bhim" },
  { value: "GooglePay", label: "GooglePay" },
  { value: "Cash", label: "Cash" },
  { value: "PhonePay", label: "PhonePay" },
  { value: "Tej", label: "Tej" },
];

function getTodayYMD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

export default function BankVoucherForm({
  mode,
  initialVoucher,
  bankBooks,
  onCancel,
  onSaved,
  onDelete,
  deleting = false,
}: BankVoucherFormProps) {
  const isReadOnly = mode === "view";
  const [parties, setParties] = useState<PartyRecord[]>([]);
  const [partyDropdownOpen, setPartyDropdownOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const partyDropdownRef = useRef<HTMLDivElement>(null);
  const partySearchInputRef = useRef<HTMLInputElement>(null);
  const [settlementRows, setSettlementRows] = useState<SettlementRow[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<BankVoucherFormData>(() => {
    if (initialVoucher) {
      return {
        entryType: initialVoucher.entryType,
        bankBookId: initialVoucher.bankBookId || "",
        bankBookName: initialVoucher.bankBookName || "",
        voucherNo: initialVoucher.voucherNo,
        date: initialVoucher.date ? initialVoucher.date.slice(0, 10) : getTodayYMD(),
        partyId: initialVoucher.partyId || "",
        partyName: initialVoucher.partyName || "",
        accountCode: initialVoucher.accountCode || "",
        outstandingBalance: initialVoucher.outstandingBalance || 0,
        address: initialVoucher.address || "",
        amount: initialVoucher.amount || 0,
        openingPayment: initialVoucher.openingPayment || 0,
        narration: initialVoucher.narration || "",
        refNo: initialVoucher.refNo || "",
        groupName: initialVoucher.groupName || "",
        transactionType: initialVoucher.transactionType || "",
        beneficiary: initialVoucher.beneficiary || "",
        transactionNo: initialVoucher.transactionNo || "",
        transactionDate: initialVoucher.transactionDate
          ? initialVoucher.transactionDate.slice(0, 10)
          : getTodayYMD(),
        bankName: initialVoucher.bankName || "",
        expenseOnTransaction: initialVoucher.expenseOnTransaction || 0,
        preparedBy: initialVoucher.preparedBy || getCurrentUserName(),
      };
    }

    const defaultBook = bankBooks[0];
    return {
      entryType: "",
      bankBookId: defaultBook?.id || "",
      bankBookName: defaultBook?.label || "",
      voucherNo: 0,
      date: getTodayYMD(),
      partyId: "",
      partyName: "",
      accountCode: "",
      outstandingBalance: 0,
      address: "",
      amount: 0,
      openingPayment: 0,
      narration: "",
      refNo: "",
      groupName: "",
      transactionType: "",
      beneficiary: "",
      transactionNo: "",
      transactionDate: getTodayYMD(),
      bankName: defaultBook?.bankName || "",
      expenseOnTransaction: 0,
      preparedBy: getCurrentUserName(),
    };
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await axiosInstance.get("/parties", { params: { limit: 500 } });
        if (active && Array.isArray(data?.data)) {
          setParties(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch parties:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode === "create" && !formData.bankBookName && bankBooks.length > 0) {
      const first = bankBooks[0];
      setFormData((prev) => ({
        ...prev,
        bankBookId: first.id,
        bankBookName: first.label,
        bankName: prev.bankName || first.bankName,
      }));
    }
  }, [bankBooks, mode, formData.bankBookName]);

  // Sync party details from fresh LedgerBook data if missing/zero in edit mode
  useEffect(() => {
    if (mode !== "edit" || parties.length === 0) return;
    const matched = parties.find(
      (p) =>
        (formData.partyId && p.id === formData.partyId) ||
        (formData.partyName &&
          p.partyName.toLowerCase() === formData.partyName.toLowerCase())
    );
    if (!matched) return;
    const addr = [
      matched.addressLine1,
      matched.addressLine2,
      matched.city,
      matched.state,
      matched.pincode,
    ]
      .filter(Boolean)
      .join(", ");
    setFormData((prev) => ({
      ...prev,
      partyId: prev.partyId || matched.id,
      accountCode: prev.accountCode || matched.accountCode || "",
      outstandingBalance:
        prev.outstandingBalance !== 0
          ? prev.outstandingBalance
          : Number(matched.openingBalance || 0),
      address: prev.address || addr,
      groupName: prev.groupName || matched.accountHead || "",
    }));
  }, [parties, mode, formData.partyId, formData.partyName]);

  // Fetch party invoices (Finish-Goods + Material for Payment, Sales for Receipt) and apply FIFO + Cumulative Pending
  useEffect(() => {
    if (mode !== "edit" || !formData.partyId) {
      setSettlementRows([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        setLoadingInvoices(true);
        const isReceiptMode =
          formData.entryType === "Receipt" || formData.entryType === "Advance Receipt";

        let combined: Array<{ inv: any; defaultCategory: string }> = [];
        if (isReceiptMode) {
          const { data } = await axiosInstance.get("/sales-invoices", {
            params: { partyId: formData.partyId, limit: 100 },
          });
          const list = Array.isArray(data?.data) ? data.data : [];
          combined = list.map((inv: any) => ({ inv, defaultCategory: "Sales-Invoice" }));
        } else {
          const [fgRes, matRes] = await Promise.allSettled([
            axiosInstance.get("/purchase-invoices", {
              params: { partyId: formData.partyId, limit: 100 },
            }),
            axiosInstance.get("/material-purchase-invoices", {
              params: { partyId: formData.partyId, limit: 100 },
            }),
          ]);
          const fgList =
            fgRes.status === "fulfilled" && Array.isArray(fgRes.value?.data?.data)
              ? fgRes.value.data.data
              : [];
          const matList =
            matRes.status === "fulfilled" && Array.isArray(matRes.value?.data?.data)
              ? matRes.value.data.data
              : [];
          combined = [
            ...fgList.map((inv: any) => ({ inv, defaultCategory: "Purchase-Invoice" })),
            ...matList.map((inv: any) => ({ inv, defaultCategory: "Purchase-Material" })),
          ];
        }

        if (!active) return;

        const filtered = combined.filter(({ inv }) => {
          const partyMatch =
            inv.partyId === formData.partyId ||
            inv.supplierId === formData.partyId ||
            inv.billingPartyId === formData.partyId ||
            (inv.billingPartyName || inv.supplierName || inv.partyName || "").toLowerCase() ===
              formData.partyName.toLowerCase();
          return partyMatch;
        });

        const baseRows = filtered
          .map(({ inv, defaultCategory }) => {
            const netAmt = Number(inv.netAmount || inv.totalAmount || 0);
            const dnAmt = Number(inv.debitNoteAmount || inv.creditNoteAmount || 0);
            const ddnAmt = Number(inv.discountDebitNoteAmount || 0);
            const prevPaidAmt = Number(inv.paidAmount || 0);
            const pendingAmt = Math.max(0, netAmt - dnAmt - ddnAmt - prevPaidAmt);
            const d = inv.invoiceDate || inv.createdAt;
            const dt = d ? new Date(d) : null;
            const rawDate = dt && !Number.isNaN(dt.getTime()) ? dt.getTime() : 0;
            const dateStr =
              dt && !Number.isNaN(dt.getTime())
                ? `${String(dt.getDate()).padStart(2, "0")}-${String(dt.getMonth() + 1).padStart(2, "0")}-${dt.getFullYear()}`
                : "-";

            return {
              id: inv.id,
              srNo: inv.invoiceNo || "-",
              type: inv.invoiceType || "TaxInvoice",
              invoiceType: inv.voucherType || inv.purchaseType || defaultCategory,
              date: dateStr,
              rawDate,
              partyBillNo: inv.partyBillNo || inv.supplierBillNo || inv.challanNo || "-",
              netAmt,
              dnAmt,
              ddnAmt,
              prevPaidAmt,
              pendingAmt,
              status: inv.paymentStatus || "-",
            };
          })
          .filter((r) => r.pendingAmt > 0)
          .sort((a, b) => a.rawDate - b.rawDate); // FIFO: oldest invoice first

        let cumulativePending = 0;
        let remainingVoucherAmt = Number(formData.amount || 0);
        const mapped: SettlementRow[] = baseRows.map((r) => {
          cumulativePending += r.pendingAmt;
          const paidAmt =
            remainingVoucherAmt > 0
              ? Math.min(remainingVoucherAmt, r.pendingAmt)
              : 0;
          remainingVoucherAmt = Math.max(0, remainingVoucherAmt - paidAmt);
          return {
            ...r,
            cumulativePendingAmt: cumulativePending,
            paidAmt,
          };
        });

        setSettlementRows(mapped);
      } catch {
        if (active) setSettlementRows([]);
      } finally {
        if (active) setLoadingInvoices(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [mode, formData.partyId, formData.partyName, formData.entryType]);

  const settlementTotals = useMemo(() => {
    return settlementRows.reduce(
      (acc, r) => ({
        netAmt: acc.netAmt + r.netAmt,
        dnAmt: acc.dnAmt + r.dnAmt,
        ddnAmt: acc.ddnAmt + r.ddnAmt,
        prevPaidAmt: acc.prevPaidAmt + r.prevPaidAmt,
        pendingAmt: acc.pendingAmt + r.pendingAmt,
        paidAmt: acc.paidAmt + Number(r.paidAmt || 0),
      }),
      { netAmt: 0, dnAmt: 0, ddnAmt: 0, prevPaidAmt: 0, pendingAmt: 0, paidAmt: 0 }
    );
  }, [settlementRows]);

  const pendingAdjustment = Math.max(
    0,
    Number(formData.amount || 0) - settlementTotals.paidAmt
  );

  const handleEntryTypeChange = async (val: string) => {
    const entryType = val as BankVoucherEntryType;
    setFormData((prev) => ({ ...prev, entryType }));
    if (
      mode === "create" &&
      (entryType === "Payment" ||
        entryType === "Advanced Payment" ||
        entryType === "Receipt" ||
        entryType === "Advance Receipt")
    ) {
      try {
        const nextNo = await bankVoucherService.getNextVoucherNo(entryType);
        setFormData((prev) => ({ ...prev, voucherNo: nextNo }));
      } catch {
        // ignore
      }
    }
  };

  const handleBankBookChange = (label: string) => {
    const matched = bankBooks.find((b) => b.label === label);
    setFormData((prev) => ({
      ...prev,
      bankBookId: matched?.id || "",
      bankBookName: label,
      bankName: matched?.bankName || prev.bankName,
    }));
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        partyDropdownRef.current &&
        !partyDropdownRef.current.contains(e.target as Node)
      ) {
        setPartyDropdownOpen(false);
      }
    };
    if (partyDropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
      setTimeout(() => partySearchInputRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [partyDropdownOpen]);

  const handlePartySelect = (party: PartyRecord | null) => {
    if (!party) {
      setFormData((prev) => ({
        ...prev,
        partyId: "",
        partyName: "",
        accountCode: "",
        outstandingBalance: 0,
        address: "",
        groupName: "",
      }));
      return;
    }
    const addr = [
      party.addressLine1,
      party.addressLine2,
      party.city,
      party.state,
      party.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    setFormData((prev) => ({
      ...prev,
      partyId: party.id,
      partyName: party.partyName,
      accountCode: party.accountCode || "",
      outstandingBalance: Number(party.openingBalance || 0),
      address: addr,
      groupName: party.accountHead || "",
      beneficiary: prev.beneficiary || party.partyName,
    }));
    setPartyDropdownOpen(false);
    setPartySearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setError("");

    if (!formData.entryType) {
      setError("Please select Entry Type (Payment or Receipt).");
      return;
    }
    if (!formData.bankBookName) {
      setError("Please select Bank Book.");
      return;
    }
    if (!formData.partyName) {
      setError("Please select Account / Ledger / Party.");
      return;
    }
    if (!formData.date) {
      setError("Please select Voucher Date.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        voucherNo: Number(formData.voucherNo) || undefined,
        amount: Number(formData.amount || 0),
        openingPayment: Number(formData.openingPayment || 0),
        expenseOnTransaction: Number(formData.expenseOnTransaction || 0),
        outstandingBalance: Number(formData.outstandingBalance || 0),
      };

      if (mode === "edit" && initialVoucher) {
        await bankVoucherService.update(initialVoucher.id, payload);
      } else {
        await bankVoucherService.create(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to save bank voucher."
      );
    } finally {
      setSaving(false);
    }
  };

  const bankBookOptions: ThemeSelectOption[] = bankBooks.map((b) => ({
    value: b.label,
    label: b.label,
  }));

  const filteredParties = useMemo(() => {
    const q = partySearch.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.partyName.toLowerCase().includes(q) ||
        (p.accountCode || "").toLowerCase().includes(q) ||
        (p.accountHead || "").toLowerCase().includes(q)
    );
  }, [parties, partySearch]);

  const labelClass =
    "block text-xs font-bold text-[#0A0E1A] dark:text-slate-200 mb-1.5";
  const inputClass =
    "w-full h-11 px-4 text-sm font-medium rounded-2xl bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/40 focus:border-[#E8C16D] disabled:opacity-60 transition-colors";
  const dropdownButtonClass = "w-full h-11";

  return (
    <form id="bank-voucher-form" onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans">
      {/* Main 2-Column Side-by-Side Card with Top-Aligned Labels */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm p-5 sm:p-7 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* LEFT COLUMN: Voucher Details */}
          <div className="space-y-4 lg:border-r lg:border-[#F1E8D0] lg:dark:border-white/[0.08] lg:pr-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D] border-b border-[#F1E8D0] dark:border-white/[0.08] pb-2">
              Voucher Details
            </h2>

            {/* Entry Type & Bank Book */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Entry Type <span className="text-red-500">*</span>
                </label>
                <ThemeSelectDropdown
                  value={formData.entryType}
                  onChange={handleEntryTypeChange}
                  options={ENTRY_TYPE_OPTIONS}
                  placeholder="Select Entry Type..."
                  disabled={isReadOnly}
                  className="w-full"
                  buttonClassName={dropdownButtonClass}
                  menuClassName="w-full"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Bank Book <span className="text-red-500">*</span>
                </label>
                <ThemeSelectDropdown
                  value={formData.bankBookName}
                  onChange={handleBankBookChange}
                  options={bankBookOptions}
                  placeholder="Select Bank Book..."
                  disabled={isReadOnly}
                  className="w-full"
                  buttonClassName={dropdownButtonClass}
                  menuClassName="w-full"
                />
              </div>
            </div>

            {/* Voucher No & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Voucher No.</label>
                <input
                  type="number"
                  value={formData.voucherNo}
                  readOnly
                  disabled
                  placeholder="Auto-generated..."
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

            {/* Account / Ledger / Party */}
            <div>
              <label className={labelClass}>
                Account / Ledger / Party <span className="text-red-500">*</span>
              </label>
              <div ref={partyDropdownRef} className="relative w-full">
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => !isReadOnly && setPartyDropdownOpen((o) => !o)}
                  className={`w-full h-11 inline-flex items-center justify-between gap-2 rounded-2xl border px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all shadow-xs outline-none select-none bg-white dark:bg-[#131622] border-[#E7E0D2] dark:border-white/[0.08] ${
                    formData.partyName
                      ? "text-[#0A0E1A] dark:text-white"
                      : "text-slate-400 dark:text-slate-500"
                  } ${
                    isReadOnly
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50"
                  } ${
                    partyDropdownOpen
                      ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 dark:border-[#F5C451] dark:ring-[#F5C451]/30"
                      : ""
                  }`}
                >
                  <span className="truncate text-left">
                    {formData.partyName || "Select Party / Ledger..."}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ${
                      partyDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {partyDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-[#E7E0D2] bg-white dark:border-white/[0.08] dark:bg-[#0F1626] p-2 shadow-xl dark:shadow-black/50">
                    {/* Search Bar Inside Dropdown */}
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451] pointer-events-none" />
                      <input
                        ref={partySearchInputRef}
                        type="text"
                        value={partySearch}
                        onChange={(e) => setPartySearch(e.target.value)}
                        placeholder="Search party by name or code..."
                        className="w-full h-9 pl-8 pr-3 text-xs font-medium rounded-xl bg-[#F7F5F0]/80 dark:bg-[#080B11] border border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#E8C16D] dark:focus:border-[#F5C451]"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 pr-1">
                      {filteredParties.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No party found.
                        </div>
                      ) : (
                        filteredParties.map((party) => {
                          const isSelected = party.id === formData.partyId;
                          return (
                            <button
                              key={party.id}
                              type="button"
                              onClick={() => handlePartySelect(party)}
                              className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#E8C16D] text-[#0A0E1A] dark:bg-[#F5C451] dark:text-[#080B11]"
                                  : "text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E]"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="truncate">{party.partyName}</div>
                                {(party.accountCode || party.accountHead) && (
                                  <div
                                    className={`text-[10px] truncate ${
                                      isSelected
                                        ? "text-[#0A0E1A]/75"
                                        : "text-slate-400 dark:text-slate-400"
                                    }`}
                                  >
                                    {[party.accountCode, party.accountHead].filter(Boolean).join(" • ")}
                                  </div>
                                )}
                              </div>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Code & Outstanding Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Account Code</label>
                <input
                  type="text"
                  value={formData.accountCode}
                  onChange={(e) => setFormData((p) => ({ ...p, accountCode: e.target.value }))}
                  placeholder="Enter Account Code..."
                  disabled={isReadOnly}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Outstanding Balance</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6A4D1D] dark:text-[#E8C16D]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={formData.outstandingBalance}
                    readOnly
                    disabled
                    className="w-full h-11 pl-8 pr-4 text-sm tabular-nums rounded-2xl bg-[#FEFAEE] dark:bg-[#E8C16D]/10 border border-[#E8C16D]/50 dark:border-[#E8C16D]/30 text-[#6A4D1D] dark:text-[#E8C16D] font-bold focus:outline-none opacity-75 blur-[0.35px] cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className={labelClass}>Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                placeholder="Enter Address..."
                disabled={isReadOnly}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-2xl bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/40 focus:border-[#E8C16D] disabled:opacity-60 transition-colors"
              />
            </div>

            {/* Amount & Opening Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className={labelClass}>Opening Payment</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.openingPayment}
                    onChange={(e) => setFormData((p) => ({ ...p, openingPayment: e.target.value }))}
                    onFocus={() => {
                      if (String(formData.openingPayment).trim() === "0") {
                        setFormData((p) => ({ ...p, openingPayment: "" }));
                      }
                    }}
                    onBlur={() => {
                      if (String(formData.openingPayment).trim() === "") {
                        setFormData((p) => ({ ...p, openingPayment: 0 }));
                      }
                    }}
                    placeholder="0.00"
                    disabled={isReadOnly}
                    className={`${inputClass} pl-8 tabular-nums`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Narration, Ref & Transaction Details */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D] border-b border-[#F1E8D0] dark:border-white/[0.08] pb-2">
                Additional &amp; Reference
              </h2>

              {/* Narration */}
              <div>
                <label className={labelClass}>Narration</label>
                <textarea
                  rows={3}
                  value={formData.narration}
                  onChange={(e) => setFormData((p) => ({ ...p, narration: e.target.value }))}
                  placeholder="Enter Narration / Remarks..."
                  disabled={isReadOnly}
                  className="w-full px-4 py-2.5 text-sm font-medium rounded-2xl bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/40 focus:border-[#E8C16D] disabled:opacity-60 transition-colors"
                />
              </div>

              {/* Ref. No. & Group Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Ref. No.</label>
                  <input
                    type="text"
                    value={formData.refNo}
                    onChange={(e) => setFormData((p) => ({ ...p, refNo: e.target.value }))}
                    placeholder="Enter Reference No..."
                    disabled={isReadOnly}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Group Name</label>
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) => setFormData((p) => ({ ...p, groupName: e.target.value }))}
                    placeholder="Enter Group Name..."
                    disabled={isReadOnly}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Transaction Details Sub-section */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D] border-b border-[#F1E8D0] dark:border-white/[0.08] pb-2">
                Transaction Details
              </h2>

              {/* Type & Beneficiary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <ThemeSelectDropdown
                    value={formData.transactionType}
                    onChange={(val) => setFormData((p) => ({ ...p, transactionType: val }))}
                    options={TRANSACTION_TYPE_OPTIONS}
                    placeholder="Select Type..."
                    disabled={isReadOnly}
                    className="w-full"
                    buttonClassName={dropdownButtonClass}
                    menuClassName="w-full"
                  />
                </div>

                <div>
                  <label className={labelClass}>Beneficiary</label>
                  <input
                    type="text"
                    value={formData.beneficiary}
                    onChange={(e) => setFormData((p) => ({ ...p, beneficiary: e.target.value }))}
                    placeholder="Enter Beneficiary Name..."
                    disabled={isReadOnly}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Transaction No & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Transaction No.</label>
                  <input
                    type="text"
                    value={formData.transactionNo}
                    onChange={(e) => setFormData((p) => ({ ...p, transactionNo: e.target.value }))}
                    placeholder="e.g. Cheque / UTR No..."
                    disabled={isReadOnly}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Date</label>
                  <DatePicker
                    value={formData.transactionDate}
                    onChange={(_, str) => setFormData((p) => ({ ...p, transactionDate: str || "" }))}
                    dateFormat="dd-MM-yyyy"
                    disabled={isReadOnly}
                    className="w-full"
                    buttonClassName={dropdownButtonClass}
                  />
                </div>
              </div>

              {/* Bank Name & Expense On Transaction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData((p) => ({ ...p, bankName: e.target.value }))}
                    placeholder="e.g. KOTAK MAHINDRA BANK"
                    disabled={isReadOnly}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Expense On Transaction</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.expenseOnTransaction}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, expenseOnTransaction: e.target.value }))
                    }
                    onFocus={() => {
                      if (String(formData.expenseOnTransaction).trim() === "0") {
                        setFormData((p) => ({ ...p, expenseOnTransaction: "" }));
                      }
                    }}
                    onBlur={() => {
                      if (String(formData.expenseOnTransaction).trim() === "") {
                        setFormData((p) => ({ ...p, expenseOnTransaction: 0 }));
                      }
                    }}
                    placeholder="0.00"
                    disabled={isReadOnly}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Edit Mode: Invoice Settlement Table matching OrderOS Theme */}
      {mode === "edit" && (
        <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#FEFAEE]/60 dark:bg-[#080B11]/60 border-b border-[#F5E6BE] dark:border-white/[0.08]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#B88728] dark:text-[#E8C16D]">
              Invoice Allocation
            </h3>
            <div className="text-xs font-bold text-[#0A0E1A] dark:text-slate-100 tabular-nums">
              Pending Adjustment :{" "}
              <span className="text-[#B88728] dark:text-[#F5C451]">
                ₹ {pendingAdjustment.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1150px] text-left border-collapse">
              <thead className="bg-[#FEFAEE] dark:bg-[#080B11] text-xs font-semibold text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08]">
                <tr>
                  <th className="px-3 py-2.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">No.</th>
                  <th className="px-3 py-2.5 border-r border-[#F5E6BE] dark:border-white/[0.08]">Sr No.</th>
                  <th className="px-3 py-2.5 border-r border-[#F5E6BE] dark:border-white/[0.08]">Type.</th>
                  <th className="px-3 py-2.5 border-r border-[#F5E6BE] dark:border-white/[0.08]">Invoice Type.</th>
                  <th className="px-3 py-2.5 border-r border-[#F5E6BE] dark:border-white/[0.08]">Date.</th>
                  <th className="px-3 py-2.5 border-r border-[#F5E6BE] dark:border-white/[0.08]">Party Bill No.</th>
                  <th className="px-3 py-2.5 text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">Net Amt.</th>
                  <th className="px-3 py-2.5 text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">DN Amt.</th>
                  <th className="px-3 py-2.5 text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">DDN Amt.</th>
                  <th className="px-3 py-2.5 text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">Prev. Paid Amt.</th>
                  <th className="px-3 py-2.5 text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">Pending Amt.</th>
                  <th className="px-3 py-2.5 text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">Cumulative Pending Amt.</th>
                  <th className="px-3 py-2.5 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">Status.</th>
                  <th className="px-3 py-2.5 text-right w-36">Paid Amt.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EAE0] dark:divide-white/[0.06] text-xs text-[#0A0E1A] dark:text-slate-200">
                {loadingInvoices ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading party invoices...
                      </span>
                    </td>
                  </tr>
                ) : settlementRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-8 text-center text-slate-400">
                      No pending invoices found for this party.
                    </td>
                  </tr>
                ) : (
                  settlementRows.map((row, idx) => {
                    const fmt = (n: number) =>
                      `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    return (
                      <tr key={row.id} className="hover:bg-[#FEFAEE]/60 dark:hover:bg-white/[0.03]">
                        <td className="px-3 py-2.5 text-center border-r border-[#F0EAE0] dark:border-white/[0.06] tabular-nums">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-medium border-r border-[#F0EAE0] dark:border-white/[0.06]">{row.srNo}</td>
                        <td className="px-3 py-2.5 border-r border-[#F0EAE0] dark:border-white/[0.06]">{row.type}</td>
                        <td className="px-3 py-2.5 border-r border-[#F0EAE0] dark:border-white/[0.06]">{row.invoiceType}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap border-r border-[#F0EAE0] dark:border-white/[0.06] tabular-nums">{row.date}</td>
                        <td className="px-3 py-2.5 border-r border-[#F0EAE0] dark:border-white/[0.06]">{row.partyBillNo}</td>
                        <td className="px-3 py-2.5 text-right border-r border-[#F0EAE0] dark:border-white/[0.06] tabular-nums">{fmt(row.netAmt)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-[#F0EAE0] dark:border-white/[0.06] tabular-nums">{fmt(row.dnAmt)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-[#F0EAE0] dark:border-white/[0.06] tabular-nums">{fmt(row.ddnAmt)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-[#F0EAE0] dark:border-white/[0.06] tabular-nums">{fmt(row.prevPaidAmt)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-[#F0EAE0] dark:border-white/[0.06] tabular-nums">{fmt(row.pendingAmt)}</td>
                        <td className="px-3 py-2.5 text-right border-r border-[#F0EAE0] dark:border-white/[0.06] tabular-nums">{fmt(row.cumulativePendingAmt)}</td>
                        <td className="px-3 py-2.5 text-center border-r border-[#F0EAE0] dark:border-white/[0.06]">{row.status}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={row.paidAmt}
                              onChange={(e) => {
                                const val = Number(e.target.value || 0);
                                setSettlementRows((prev) =>
                                  prev.map((r) => (r.id === row.id ? { ...r, paidAmt: val } : r))
                                );
                              }}
                              className="w-full h-8 pl-6 pr-2 text-xs text-right tabular-nums rounded-xl bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-[#E8C16D]/40"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-[#FEFAEE]/80 dark:bg-[#080B11]/90 border-t border-[#E7E0D2] dark:border-white/[0.08] text-xs font-bold text-[#0A0E1A] dark:text-slate-100">
                <tr>
                  <td colSpan={6} className="px-3 py-2.5 border-r border-[#F5E6BE] dark:border-white/[0.08]">
                    Total. {settlementRows.length}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums border-r border-[#F5E6BE] dark:border-white/[0.08]">
                    ₹ {settlementTotals.netAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums border-r border-[#F5E6BE] dark:border-white/[0.08]">
                    ₹ {settlementTotals.dnAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums border-r border-[#F5E6BE] dark:border-white/[0.08]">
                    ₹ {settlementTotals.ddnAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums border-r border-[#F5E6BE] dark:border-white/[0.08]">
                    ₹ {settlementTotals.prevPaidAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums border-r border-[#F5E6BE] dark:border-white/[0.08]">
                    ₹ {settlementTotals.pendingAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td colSpan={2} className="border-r border-[#F5E6BE] dark:border-white/[0.08]"></td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[#B88728] dark:text-[#F5C451]">
                    ₹ {settlementTotals.paidAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Footer Bar (Prepared By + Delete/Cancel + Save/Update) */}
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
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
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
