"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  X,
  User,
  UserPlus,
  Search,
  Check,
  ChevronsUpDown,
  ClipboardList,
  FileMinus2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrentUserName } from "@/utils/auth";
import {
  Party,
  ProductSkuSuggestion,
} from "@/components/Dashboard/Purchase/PurchaseChallan/types/purchaseChallan.types";
import { purchaseChallanService } from "@/components/Dashboard/Purchase/PurchaseChallan/services/purchaseChallan.service";
import { purchaseInvoiceService } from "@/components/Dashboard/Purchase/PurchaseInvoice/services/purchaseInvoice.service";
import { PurchaseInvoice } from "@/components/Dashboard/Purchase/PurchaseInvoice/types/purchaseInvoice.types";
import {
  extractStateCode,
  DEFAULT_COMPANY_STATE_CODE,
} from "@/components/Dashboard/Purchase/PurchaseInvoice/utils/purchaseGstCalculator";
import LedgerBookModal from "@/components/Dashboard/OfflineSales/SalesChallan/components/LedgerBookModal";
import OtherExpensesModal, {
  OtherExpenseItem,
} from "@/components/Dashboard/common/OtherExpensesModal";
import {
  PurchaseDebitNote,
  PurchaseDebitNoteItem,
  PurchaseDebitNoteFormData,
} from "../types/purchaseDebitNote.types";
import { purchaseDebitNoteService } from "../services/purchaseDebitNote.service";

interface DebitNoteCreateFormProps {
  debitNote?: PurchaseDebitNote | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const debitNoteTypeOptions: ThemeSelectOption[] = [
  { value: "Return", label: "Return" },
  { value: "Rate Difference", label: "Rate Difference" },
  { value: "Shortage / Damage", label: "Shortage / Damage" },
  { value: "Other", label: "Other" },
];

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "URD Tax Invoice", label: "URD Tax Invoice" },
  { value: "Bill of Supply", label: "Bill of Supply" },
  { value: "Export Invoice", label: "Export Invoice" },
];

function recalcDebitNoteItem(
  item: Partial<PurchaseDebitNoteItem>,
  partyStateCode: string
): PurchaseDebitNoteItem {
  const quantity = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  const amount = Math.round(quantity * rate * 100) / 100;
  const discountPercent = Math.max(Number(item.discountPercent) || 0, 0);
  const discountAmount = Math.round(amount * (discountPercent / 100) * 100) / 100;
  const taxableAmount = Math.round(Math.max(amount - discountAmount, 0) * 100) / 100;

  const isIntraState = !partyStateCode || partyStateCode === DEFAULT_COMPANY_STATE_CODE;

  let sgstRate = 0;
  let cgstRate = 0;
  let igstRate = 0;
  let sgstAmount = 0;
  let cgstAmount = 0;
  let igstAmount = 0;

  if (isIntraState) {
    sgstRate =
      item.sgstRate !== undefined && item.sgstRate !== null && item.sgstRate !== ""
        ? Math.max(Number(item.sgstRate) || 0, 0)
        : item.sgstRate === "" || item.sgstRate === 0
          ? 0
          : 2.5;
    cgstRate =
      item.cgstRate !== undefined && item.cgstRate !== null && item.cgstRate !== ""
        ? Math.max(Number(item.cgstRate) || 0, 0)
        : item.cgstRate === "" || item.cgstRate === 0
          ? 0
          : 2.5;
    sgstAmount = Math.round(taxableAmount * (sgstRate / 100) * 100) / 100;
    cgstAmount = Math.round(taxableAmount * (cgstRate / 100) * 100) / 100;
  } else {
    igstRate =
      item.igstRate !== undefined && item.igstRate !== null && item.igstRate !== ""
        ? Math.max(Number(item.igstRate) || 0, 0)
        : item.igstRate === "" || item.igstRate === 0
          ? 0
          : 5.0;
    igstAmount = Math.round(taxableAmount * (igstRate / 100) * 100) / 100;
  }

  const total =
    Math.round((taxableAmount + sgstAmount + cgstAmount + igstAmount) * 100) / 100;

  return {
    itemNo: item.itemNo || 1,
    sku: item.sku || "",
    particular: item.particular || item.sku || "",
    refInvoiceNo: item.refInvoiceNo || "",
    size: item.size || "",
    lotNo: item.lotNo || "",
    hsn: item.hsn ?? "5208",
    quantity,
    rate,
    amount,
    discountPercent,
    discountAmount,
    taxableAmount,
    sgstRate: item.sgstRate !== undefined && item.sgstRate !== null ? item.sgstRate : sgstRate,
    sgstAmount,
    cgstRate: item.cgstRate !== undefined && item.cgstRate !== null ? item.cgstRate : cgstRate,
    cgstAmount,
    igstRate: item.igstRate !== undefined && item.igstRate !== null ? item.igstRate : igstRate,
    igstAmount,
    total,
  };
}

function ProductSkuDropdown({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: ProductSkuSuggestion[];
  onSelect: (skuItem: ProductSkuSuggestion) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 220,
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.sku.toLowerCase().includes(q) ||
        (o.name && o.name.toLowerCase().includes(q))
    );
  }, [options, search]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        btnRef.current &&
        !btnRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 240),
        });
      }
    };
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 240),
      });
      setSearch("");
    }
    setOpen((p) => !p);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className={`w-full h-8 px-2.5 flex items-center justify-between gap-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
          open
            ? "border-[#E8C16D] ring-1 ring-[#E8C16D] bg-white dark:bg-[#0A0E1A]"
            : "border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A]"
        } ${value ? "text-slate-900 dark:text-white font-semibold" : "text-slate-400"}`}
      >
        <span className="truncate">{value || "Select Product..."}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${pos.top}px`,
              left: `${pos.left}px`,
              width: `${pos.width}px`,
              zIndex: 9999,
            }}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#171C28] shadow-2xl p-2 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-8 pl-8 pr-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B0E14] text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No SKU found.
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = value === opt.sku;
                  return (
                    <button
                      key={opt.sku}
                      type="button"
                      onClick={() => {
                        onSelect(opt);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-mono text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="truncate">{opt.sku}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default function DebitNoteCreateForm({
  debitNote,
  onSuccess,
  onCancel,
}: DebitNoteCreateFormProps) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [debitNoteType, setDebitNoteType] = useState(debitNote?.debitNoteType || "Return");
  const [invoiceType, setInvoiceType] = useState(debitNote?.invoiceType || "Tax Invoice");
  const [debitNoteNo, setDebitNoteNo] = useState(debitNote?.debitNoteNo || "");
  const [debitNoteDate, setDebitNoteDate] = useState(
    debitNote?.debitNoteDate
      ? new Date(debitNote.debitNoteDate).toISOString().split("T")[0]
      : todayStr
  );

  const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(
    debitNote?.supplier ||
      (debitNote?.billingPartyName
        ? ({
            id: debitNote.supplierId || "temp",
            partyName: debitNote.billingPartyName,
            gstin: debitNote.partyGstn || "",
            state: debitNote.billingState || "Gujarat",
            phone: debitNote.billingMobile || "",
            addressLine1: debitNote.billingAddress || "",
          } as any)
        : null)
  );

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [partyInvoices, setPartyInvoices] = useState<PurchaseInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [skuOptions, setSkuOptions] = useState<ProductSkuSuggestion[]>([]);

  const [preparedBy, setPreparedBy] = useState(debitNote?.preparedBy || "");

  useEffect(() => {
    if (!debitNote?.preparedBy) {
      setPreparedBy((prev) => prev || getCurrentUserName());
    }
  }, [debitNote?.preparedBy]);
  const [remarks, setRemarks] = useState(debitNote?.remarks || "");
  const [tdsPercent, setTdsPercent] = useState<number>(Number(debitNote?.tdsPercent) || 0);
  const [tcsPercent, setTcsPercent] = useState<number>(Number(debitNote?.tcsPercent) || 0);
  const [otherExpense, setOtherExpense] = useState<number>(Number(debitNote?.otherExpense) || 0);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpenseItem[]>(
    Array.isArray(debitNote?.otherExpenses) ? debitNote.otherExpenses : []
  );
  const [otherExpenseModalOpen, setOtherExpenseModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const initialBlankItem: PurchaseDebitNoteItem = {
    itemNo: 1,
    sku: "",
    particular: "",
    refInvoiceNo: "",
    size: "",
    hsn: "5208",
    quantity: 0,
    rate: 0,
    amount: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxableAmount: 0,
    sgstRate: 2.5,
    sgstAmount: 0,
    cgstRate: 2.5,
    cgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    total: 0,
  };

  const [items, setItems] = useState<PurchaseDebitNoteItem[]>(
    debitNote?.items && debitNote.items.length > 0
      ? debitNote.items.map((it, idx) => ({ ...it, itemNo: idx + 1 }))
      : []
  );

  useEffect(() => {
    purchaseChallanService
      .searchSkus("")
      .then((list) => setSkuOptions(list || []))
      .catch(() => setSkuOptions([]));
  }, []);

  useEffect(() => {
    if (!debitNote?.id) {
      const timer = setTimeout(() => setIsDrawerOpen(true), 150);
      purchaseDebitNoteService
        .getNextDebitNoteNo()
        .then((nextNo) => {
          if (nextNo) setDebitNoteNo(nextNo);
        })
        .catch(() => setDebitNoteNo("DN/2026-2027/1"));
      return () => clearTimeout(timer);
    }
  }, [debitNote?.id]);

  const fetchSuppliers = async (search = "") => {
    try {
      const list = await purchaseChallanService.getSuppliers(search);
      setSuppliers(list || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isDrawerOpen) {
      fetchSuppliers(supplierSearch);
    }
  }, [isDrawerOpen, supplierSearch]);

  useEffect(() => {
    if (!selectedSupplier?.partyName) {
      setPartyInvoices([]);
      return;
    }
    let mounted = true;
    setLoadingInvoices(true);
    purchaseInvoiceService
      .getInvoices({ partyName: selectedSupplier.partyName, limit: 50 })
      .then((res) => {
        if (mounted) setPartyInvoices(res?.data || []);
      })
      .catch(() => {
        if (mounted) setPartyInvoices([]);
      })
      .finally(() => {
        if (mounted) setLoadingInvoices(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedSupplier?.partyName]);

  const supplierStateCode = useMemo(() => {
    if (!selectedSupplier) return "";
    return extractStateCode(selectedSupplier.gstin, selectedSupplier.state);
  }, [selectedSupplier]);

  const isIntraState = !supplierStateCode || supplierStateCode === DEFAULT_COMPANY_STATE_CODE;

  const handleSelectSupplier = (party: Party) => {
    setSelectedSupplier(party);
    setSupplierDropdownOpen(false);
    const code = extractStateCode(party.gstin, party.state);
    setItems((prev) =>
      prev.map((it, idx) => ({
        ...recalcDebitNoteItem(it, code),
        itemNo: idx + 1,
      }))
    );
  };

  const handleImportInvoice = (inv: PurchaseInvoice) => {
    const newItems: PurchaseDebitNoteItem[] = (inv.items || []).map((it, idx) =>
      recalcDebitNoteItem(
        {
          itemNo: items.length + idx + 1,
          sku: it.sku,
          particular: it.particular || it.sku,
          refInvoiceNo: inv.invoiceNo,
          size: it.size || "",
          hsn: it.hsn || "5208",
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          discountPercent: Number(it.discountPercent) || 0,
          sgstRate: Number(it.sgstRate) || 0,
          cgstRate: Number(it.cgstRate) || 0,
          igstRate: Number(it.igstRate) || 0,
        },
        supplierStateCode || DEFAULT_COMPANY_STATE_CODE
      )
    );
    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems].map((r, i) => ({ ...r, itemNo: i + 1 })));
      toast.success(`Added items from Invoice #${inv.invoiceNo}`);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseDebitNoteItem,
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };
      next[index] = {
        ...recalcDebitNoteItem(target, supplierStateCode || DEFAULT_COMPANY_STATE_CODE),
        itemNo: index + 1,
      };
      return next;
    });
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        ...initialBlankItem,
        itemNo: prev.length + 1,
        sgstRate: isIntraState ? 2.5 : 0,
        cgstRate: isIntraState ? 2.5 : 0,
        igstRate: isIntraState ? 0 : 5.0,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) =>
      prev.filter((_, i) => i !== index).map((r, i) => ({ ...r, itemNo: i + 1 }))
    );
  };

  const summary = useMemo(() => {
    const totalQuantity = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const totalAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.amount) || 0), 0) * 100) / 100;
    const totalDiscount =
      Math.round(items.reduce((s, it) => s + (Number(it.discountAmount) || 0), 0) * 100) / 100;
    const amountBeforeTax =
      Math.round(items.reduce((s, it) => s + (Number(it.taxableAmount) || 0), 0) * 100) / 100;
    const sgstAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.sgstAmount) || 0), 0) * 100) / 100;
    const cgstAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.cgstAmount) || 0), 0) * 100) / 100;
    const igstAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.igstAmount) || 0), 0) * 100) / 100;
    const totalGst = Math.round((sgstAmount + cgstAmount + igstAmount) * 100) / 100;
    const amountAfterTax = Math.round((amountBeforeTax + totalGst) * 100) / 100;

    const tdsAmount =
      Math.round(amountBeforeTax * (Number(tdsPercent || 0) / 100) * 100) / 100;
    const tcsAmount =
      Math.round(amountBeforeTax * (Number(tcsPercent || 0) / 100) * 100) / 100;

    const netBeforeRoundOff =
      amountAfterTax + Number(otherExpense || 0) + tcsAmount - tdsAmount;
    const roundOff =
      Math.round((Math.round(netBeforeRoundOff) - netBeforeRoundOff) * 100) / 100;
    const netAmount = Math.round((netBeforeRoundOff + roundOff) * 100) / 100;

    return {
      totalQuantity,
      totalAmount,
      totalDiscount,
      amountBeforeTax,
      sgstAmount,
      cgstAmount,
      igstAmount,
      totalGst,
      amountAfterTax,
      tdsAmount,
      tcsAmount,
      roundOff,
      netAmount,
    };
  }, [items, tdsPercent, tcsPercent, otherExpense]);

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      toast.error("Please select a Party first.");
      setIsDrawerOpen(true);
      return;
    }
    const validItems = items.filter((it) => (it.sku || it.particular || "").trim().length > 0);
    if (validItems.length === 0) {
      toast.error("At least one item row is required.");
      return;
    }

    try {
      setIsSaving(true);
      const payload: PurchaseDebitNoteFormData = {
        supplierId: selectedSupplier.id !== "temp" ? selectedSupplier.id : null,
        debitNoteType,
        invoiceType,
        debitNoteNo,
        debitNoteDate,
        partyGstn: selectedSupplier.gstin || null,
        stateCode: supplierStateCode || null,
        billingPartyName: selectedSupplier.partyName,
        billingAddress:
          (selectedSupplier as any).address1 || selectedSupplier.addressLine1 || null,
        billingCity: selectedSupplier.city || null,
        billingState: selectedSupplier.state || "Gujarat",
        billingPincode: selectedSupplier.pincode || null,
        billingMobile: selectedSupplier.phone || null,
        preparedBy: preparedBy || getCurrentUserName(),
        remarks: remarks || null,
        tdsPercent: Number(tdsPercent) || 0,
        tdsAmount: summary.tdsAmount,
        tcsPercent: Number(tcsPercent) || 0,
        tcsAmount: summary.tcsAmount,
        otherExpense: Number(otherExpense) || 0,
        otherExpenses,
        totalQuantity: summary.totalQuantity,
        totalAmount: summary.totalAmount,
        totalDiscount: summary.totalDiscount,
        amountBeforeTax: summary.amountBeforeTax,
        sgstAmount: summary.sgstAmount,
        cgstAmount: summary.cgstAmount,
        igstAmount: summary.igstAmount,
        totalGst: summary.totalGst,
        amountAfterTax: summary.amountAfterTax,
        roundOff: summary.roundOff,
        netAmount: summary.netAmount,
        items: validItems.map((it, idx) => ({
          ...it,
          itemNo: idx + 1,
          sku: (it.sku || it.particular).trim(),
          particular: (it.particular || it.sku).trim(),
          quantity: Number(it.quantity) || 0,
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || 0,
          discountPercent: Number(it.discountPercent) || 0,
          discountAmount: Number(it.discountAmount) || 0,
          taxableAmount: Number(it.taxableAmount) || 0,
          sgstRate: Number(it.sgstRate) || 0,
          sgstAmount: Number(it.sgstAmount) || 0,
          cgstRate: Number(it.cgstRate) || 0,
          cgstAmount: Number(it.cgstAmount) || 0,
          igstRate: Number(it.igstRate) || 0,
          igstAmount: Number(it.igstAmount) || 0,
          total: Number(it.total) || 0,
        })),
      };

      if (debitNote?.id) {
        await purchaseDebitNoteService.updateDebitNote(debitNote.id, payload);
        toast.success(`Debit Note ${debitNoteNo} updated!`);
      } else {
        await purchaseDebitNoteService.createDebitNote(payload);
        toast.success(`Debit Note ${debitNoteNo} created!`);
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Debit Note.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Top Header Bar */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onCancel}
              className="grid h-9 w-9 place-items-center rounded-xl border border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] cursor-pointer shrink-0"
              title="Back to List"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
              <FileMinus2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#0A0E1A] dark:text-white tracking-tight">
                Debit Note [ Product ]
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Purchase • Finish Goods • Debit Note
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/20 active:scale-[0.98] cursor-pointer min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Back to List</span>
            </button>

            <div className="h-9 sm:h-10 px-3.5 rounded-xl sm:rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-mono font-bold text-xs sm:text-sm flex items-center select-all">
              {debitNoteNo || "DN/2026-2027/1"}
            </div>
            <div className="w-36">
              <DatePicker
                allowInput
                value={debitNoteDate}
                onChange={(_, str) => setDebitNoteDate(str || todayStr)}
                placeholder="YYYY-MM-DD"
                dateFormat="yyyy-MM-dd"
                className="w-full"
                buttonClassName="h-9 sm:h-10 px-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-md hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer min-h-[40px] shrink-0 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Note"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Meta Bar */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Debit Note Type
              </label>
              <div className="w-36">
                <ThemeSelectDropdown
                  value={debitNoteType}
                  onChange={setDebitNoteType}
                  options={debitNoteTypeOptions}
                  buttonClassName="h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Invoice Type
              </label>
              <div className="w-40">
                <ThemeSelectDropdown
                  value={invoiceType}
                  onChange={setInvoiceType}
                  options={invoiceTypeOptions}
                  buttonClassName="h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold uppercase cursor-pointer hover:bg-[#FFF3D6] dark:hover:bg-[#262014]"
            >
              <Eye className="w-4 h-4" />
              <span className="truncate max-w-[200px]">
                {selectedSupplier?.partyName || "Select Party"}
              </span>
            </button>

            <div className="h-9 min-w-[36px] px-3 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0E14] text-xs font-bold font-mono text-slate-700 dark:text-white flex items-center justify-center">
              {selectedSupplier && supplierStateCode ? supplierStateCode : "—"}
            </div>
            <span className="text-slate-400 font-bold">-</span>
            <div className="h-9 min-w-[140px] px-3 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0E14] text-xs font-bold font-mono text-slate-700 dark:text-white flex items-center justify-center">
              {selectedSupplier?.gstin || "—"}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Items Table + Bottom Sections */}
      <div className="relative min-h-[580px] sm:min-h-[640px] overflow-x-clip space-y-4">
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="overflow-x-auto rounded-xl border border-[#F5E6BE] dark:border-white/[0.08]">
            <table className="w-full min-w-[1050px] text-xs border-collapse">
              <thead>
                <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[#6A4D1D] dark:text-[#E8C16D] font-bold">
                  <th className="py-2.5 px-2 text-center w-10 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">No.</th>
                  <th className="py-2.5 px-2 text-left min-w-[170px] border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Product.</th>
                  <th className="py-2.5 px-2 text-left w-32 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Ref Invoice No.</th>
                  <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Size.</th>
                  <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Qty.</th>
                  <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Rate.</th>
                  <th className="py-2.5 px-1 text-center w-24 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Amount.</th>
                  <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Dis. (%)</th>
                  <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Discount ₹</th>
                  <th className="py-2.5 px-1 text-center w-24 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Taxable Amt.</th>
                  {isIntraState ? (
                    <>
                      <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">SGST %</th>
                      <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">SGST Amt.</th>
                      <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">CGST %</th>
                      <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">CGST Amt.</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-1 text-center w-16 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">IGST %</th>
                      <th className="py-2.5 px-1 text-center w-20 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">IGST Amt.</th>
                    </>
                  )}
                  <th className="py-2.5 px-2 text-center w-24 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">Total</th>
                  <th className="py-2.5 px-1 text-center w-10">Del.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5E6BE]/40 dark:divide-white/[0.05]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={isIntraState ? 16 : 14} className="py-14 text-center">
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
                  items.map((item, index) => (
                    <tr key={index} className="hover:bg-[#FEFAEE]/40 dark:hover:bg-white/[0.02]">
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-500 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        {index + 1}
                      </td>
                      <td className="py-1.5 px-1.5 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <ProductSkuDropdown
                          value={item.sku}
                          options={skuOptions}
                          onSelect={(skuOpt) => {
                            setItems((prev) => {
                              const next = [...prev];
                              const current = next[index];
                              const target = {
                                ...current,
                                sku: skuOpt.sku,
                                particular: skuOpt.name || skuOpt.sku,
                                rate:
                                  Number(current.rate) > 0
                                    ? current.rate
                                    : Number(skuOpt.rate) || 0,
                              };
                              next[index] = {
                                ...recalcDebitNoteItem(
                                  target,
                                  supplierStateCode || DEFAULT_COMPANY_STATE_CODE
                                ),
                                itemNo: index + 1,
                              };
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="py-1.5 px-1.5 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="text"
                          value={item.refInvoiceNo || ""}
                          onChange={(e) => handleItemChange(index, "refInvoiceNo", e.target.value)}
                          placeholder="Ref Invoice"
                          className="w-full h-8 px-2 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] font-mono"
                        />
                      </td>
                      <td className="py-1.5 px-1 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="text"
                          value={item.size || ""}
                          onChange={(e) => handleItemChange(index, "size", e.target.value)}
                          placeholder="Size"
                          className="w-full h-8 px-1 text-xs text-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-1.5 px-1 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="number"
                          min="0"
                          value={item.quantity || ""}
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                          placeholder="0"
                          className="w-full h-8 px-1 text-xs text-center font-mono font-bold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-1.5 px-1 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate || ""}
                          onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                          placeholder="0.00"
                          className="w-full h-8 px-1 text-xs text-center font-mono rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono font-semibold text-slate-800 dark:text-white border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        {Number(item.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-1.5 px-1 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={item.discountPercent || ""}
                          onChange={(e) => handleItemChange(index, "discountPercent", e.target.value)}
                          placeholder="0"
                          className="w-full h-8 px-1 text-xs text-center font-mono rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        {Number(item.discountAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono font-semibold text-slate-800 dark:text-white border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        {Number(item.taxableAmount || 0).toFixed(2)}
                      </td>
                      {isIntraState ? (
                        <>
                          <td className="py-1.5 px-1 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={item.sgstRate !== undefined && item.sgstRate !== null ? item.sgstRate : ""}
                              onChange={(e) => handleItemChange(index, "sgstRate", e.target.value)}
                              placeholder="0"
                              className="w-full h-8 px-1 text-xs text-center font-mono font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                            {Number(item.sgstAmount || 0).toFixed(2)}
                          </td>
                          <td className="py-1.5 px-1 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={item.cgstRate !== undefined && item.cgstRate !== null ? item.cgstRate : ""}
                              onChange={(e) => handleItemChange(index, "cgstRate", e.target.value)}
                              placeholder="0"
                              className="w-full h-8 px-1 text-xs text-center font-mono font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                            {Number(item.cgstAmount || 0).toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-1.5 px-1 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={item.igstRate !== undefined && item.igstRate !== null ? item.igstRate : ""}
                              onChange={(e) => handleItemChange(index, "igstRate", e.target.value)}
                              placeholder="0"
                              className="w-full h-8 px-1 text-xs text-center font-mono font-semibold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0A0E1A] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-center font-mono text-slate-700 dark:text-slate-300 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                            {Number(item.igstAmount || 0).toFixed(2)}
                          </td>
                        </>
                      )}
                      <td className="py-1.5 px-2 text-center font-mono font-bold text-[#B88728] dark:text-[#E8C16D] border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                        {Number(item.total || 0).toFixed(2)}
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
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

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </section>

        {/* 4. Bottom Grid: Purchase Invoices + Metadata on Left, Summary Card on Right */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7 space-y-4">
            {/* Purchase Invoices Reference Box */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#0A0E1A] dark:text-white">
                  Purchase Invoices
                </h3>
                <span className="text-[11px] text-slate-400">
                  Click an invoice to add its items
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08]">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] font-bold border-b border-slate-200 dark:border-white/[0.08]">
                      <th className="py-2 px-2 text-center w-10">No.</th>
                      <th className="py-2 px-2 text-left">Invoice No.</th>
                      <th className="py-2 px-2 text-left">Date.</th>
                      <th className="py-2 px-2 text-right">Quantity.</th>
                      <th className="py-2 px-2 text-right">Limit Amount.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {loadingInvoices ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Loading invoices...
                        </td>
                      </tr>
                    ) : partyInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      partyInvoices.map((inv, idx) => (
                        <tr
                          key={inv.id}
                          onClick={() => handleImportInvoice(inv)}
                          className="cursor-pointer hover:bg-[#FFF9EC] dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <td className="py-2 px-2 text-center font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2 font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                            {inv.invoiceNo}
                          </td>
                          <td className="py-2 px-2 font-mono text-slate-600 dark:text-slate-300">
                            {inv.invoiceDate
                              ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
                              : "-"}
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-slate-800 dark:text-white">
                            {inv.totalQuantity || 0}
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-semibold text-slate-800 dark:text-white">
                            ₹ {Number(inv.netAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prepared By, Remarks & Save */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Prepared By
                  </label>
                  <input
                    type="text"
                    value={preparedBy}
                    readOnly
                    className="h-9 w-28 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.04] text-[#B88728] dark:text-[#E8C16D] outline-none cursor-not-allowed"
                  />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Remarks"
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center gap-2 h-10 px-6 rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Gross Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {summary.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>Discount Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {summary.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                <span>Before Tax Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {summary.amountBeforeTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>SGST.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {summary.sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span>CGST.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {summary.cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                <span>IGST.</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {summary.igstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-white/[0.04] pb-1.5">
                <span>After Tax Amount</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">₹ {summary.amountAfterTax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>TDS %</span>
                  <input
                    type="number"
                    min="0"
                    value={tdsPercent || ""}
                    onChange={(e) => setTdsPercent(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-7 w-14 px-1 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  TDS Amount. ₹ {summary.tdsAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span>TCS %</span>
                  <input
                    type="number"
                    min="0"
                    value={tcsPercent || ""}
                    onChange={(e) => setTcsPercent(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="h-7 w-14 px-1 text-center font-mono font-bold text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  TCS Amount. ₹ {summary.tcsAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => setOtherExpenseModalOpen(true)}
                  className="font-medium text-sky-600 dark:text-sky-400 hover:underline underline-offset-4 cursor-pointer text-left"
                  title="Click to manage other expenses"
                >
                  Other Expense
                </button>
                <button
                  type="button"
                  onClick={() => setOtherExpenseModalOpen(true)}
                  className="font-mono font-bold text-slate-900 dark:text-white hover:text-[#B88728] dark:hover:text-[#E8C16D] cursor-pointer"
                >
                  ₹ {Number(otherExpense || 0).toFixed(2)}
                </button>
              </div>
              <div className="flex justify-between py-1 text-slate-600 dark:text-slate-400">
                <span className="font-medium text-sky-600 dark:text-sky-400">Round Off</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ₹ {summary.roundOff.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-white/[0.08]">
                <span className="font-black text-sm text-slate-900 dark:text-white uppercase">
                  Net Amount
                </span>
                <span className="font-mono font-black text-base text-[#B88728] dark:text-[#E8C16D]">
                  ₹ {summary.netAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Slide-over Party Details Drawer scoped below Header & Meta Bar */}
        <div
          className={`absolute inset-x-0 top-0 -bottom-10 sm:-bottom-16 z-30 bg-black/10 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isDrawerOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsDrawerOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden ${
            isDrawerOpen
              ? "translate-x-0 pointer-events-auto"
              : "translate-x-full pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 shrink-0">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Party Details
            </h2>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 space-y-4 custom-scrollbar">
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#121620] p-3.5 sm:p-4 space-y-3.5">
              {/* Select Party Dropdown + Add Party Button */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Party
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setSupplierDropdownOpen((p) => !p)}
                      className={`w-full h-9 sm:h-10 px-3.5 flex items-center justify-between rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer ${
                        supplierDropdownOpen
                          ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 bg-white dark:bg-[#171C28] text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171C28] text-slate-900 dark:text-white"
                      }`}
                    >
                      <span className="truncate">
                        {selectedSupplier?.partyName || "Select..."}
                      </span>
                      <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSupplierDropdownOpen(false);
                      setLedgerModalOpen(true);
                    }}
                    className="h-9 w-9 sm:h-10 sm:w-10 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#171C28] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all cursor-pointer"
                    title="Add New Party"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>

                {supplierDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 p-2 bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="relative mb-2 shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        placeholder="Search supplier..."
                        className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                      />
                    </div>
                    <div className="overflow-y-auto max-h-48 custom-scrollbar space-y-0.5">
                      {suppliers.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No supplier found.
                        </div>
                      ) : (
                        suppliers.map((p) => {
                          const isSelected = selectedSupplier?.id === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectSupplier(p)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D]"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold truncate">{p.partyName}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {[p.phone, p.city, p.state].filter(Boolean).join(" • ") || "—"}
                                </p>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Party Info Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-4 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 grid h-16 w-16 place-items-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0F1626] text-slate-400">
                  <User className="w-7 h-7" />
                </div>
                <div className="col-span-9 grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Name</div>
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {selectedSupplier?.partyName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Mobile</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300">
                      {selectedSupplier?.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Address</div>
                    <div className="text-slate-700 dark:text-slate-300 truncate">
                      {(selectedSupplier as any)?.address1 ||
                        selectedSupplier?.addressLine1 ||
                        selectedSupplier?.city ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">GST</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300 truncate">
                      {selectedSupplier?.gstin || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="h-9 px-5 rounded-xl bg-[#E8C16D] text-[#0A0E1A] text-xs font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>

      <LedgerBookModal
        isOpen={ledgerModalOpen}
        onClose={() => setLedgerModalOpen(false)}
        onPartyCreated={(party) => {
          fetchSuppliers("");
          if (party) handleSelectSupplier(party);
        }}
      />

      <OtherExpensesModal
        isOpen={otherExpenseModalOpen}
        onClose={() => setOtherExpenseModalOpen(false)}
        subtitle="Manage other expenses for this Debit Note"
        expenses={otherExpenses}
        onSave={(rows, total) => {
          setOtherExpenses(rows);
          setOtherExpense(total);
        }}
      />
    </div>
  );
}
