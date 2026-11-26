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
  FilePlus2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { getCurrentUserName } from "@/utils/auth";
import { Party } from "@/components/Dashboard/OfflineSales/SalesChallan/types/challan.types";
import { challanService } from "@/components/Dashboard/OfflineSales/SalesChallan/services/challan.service";
import { ProductSkuSuggestion } from "@/components/Dashboard/Purchase/PurchaseChallan/types/purchaseChallan.types";
import { purchaseChallanService } from "@/components/Dashboard/Purchase/PurchaseChallan/services/purchaseChallan.service";
import { SalesInvoice } from "@/components/Dashboard/OfflineSales/SalesInvoice/types/salesInvoice.types";
import { salesInvoiceService } from "@/components/Dashboard/OfflineSales/SalesInvoice/services/salesInvoice.service";
import {
  SalesCreditNote,
  SalesCreditNoteItem,
} from "../types/salesCreditNote.types";
import { salesCreditNoteService } from "../services/salesCreditNote.service";
import OtherExpensesModal, {
  OtherExpenseItem,
} from "@/components/Dashboard/common/OtherExpensesModal";

interface CreditNoteCreateFormProps {
  creditNote?: SalesCreditNote | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const salesForOptions: ThemeSelectOption[] = [
  { value: "Product", label: "Product" },
  { value: "Material", label: "Material" },
  { value: "Service", label: "Service" },
];

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "Bill of Supply", label: "Bill of Supply" },
  { value: "Export Invoice", label: "Export Invoice" },
];

const sizeOptions: ThemeSelectOption[] = [
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "2XL", label: "2XL" },
  { value: "3XL", label: "3XL" },
  { value: "Free Size", label: "Free Size" },
];

const STATE_CODE_MAP: Record<string, string> = {
  Gujarat: "24",
  Maharashtra: "27",
  Delhi: "07",
  Karnataka: "29",
  "Tamil Nadu": "33",
  Rajasthan: "08",
  "Uttar Pradesh": "09",
  "West Bengal": "19",
  Telangana: "36",
  "Andhra Pradesh": "37",
  Haryana: "06",
  Punjab: "03",
  "Madhya Pradesh": "23",
  Bihar: "10",
  Kerala: "32",
};

function getStateCode(state?: string | null, gstin?: string | null): string {
  if (gstin && gstin.length >= 2 && /^\d{2}/.test(gstin)) {
    return gstin.slice(0, 2);
  }
  if (!state) return "24";
  return STATE_CODE_MAP[state] || "24";
}

function recalculateRow(
  row: SalesCreditNoteItem,
  isInterstate: boolean,
  isTaxInvoice: boolean
): SalesCreditNoteItem {
  const qty = Number(row.quantity) || 0;
  const rate = Number(row.rate) || 0;
  const amount = Math.round(qty * rate * 100) / 100;
  const discPct = Number(row.discountPercent) || 0;
  const discountAmount = Math.round(amount * (discPct / 100) * 100) / 100;
  const taxableAmount = Math.round((amount - discountAmount) * 100) / 100;

  if (!isTaxInvoice) {
    return {
      ...row,
      amount,
      discountAmount,
      taxableAmount,
      sgstRate: 0,
      sgstAmount: 0,
      cgstRate: 0,
      cgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      total: taxableAmount,
    };
  }

  if (isInterstate) {
    const igstRate = Number(row.igstRate) || 5;
    const igstAmount = Math.round(taxableAmount * (igstRate / 100) * 100) / 100;
    return {
      ...row,
      amount,
      discountAmount,
      taxableAmount,
      sgstRate: 0,
      sgstAmount: 0,
      cgstRate: 0,
      cgstAmount: 0,
      igstRate,
      igstAmount,
      total: Math.round((taxableAmount + igstAmount) * 100) / 100,
    };
  }

  const sgstRate = Number(row.sgstRate) || 2.5;
  const cgstRate = Number(row.cgstRate) || 2.5;
  const sgstAmount = Math.round(taxableAmount * (sgstRate / 100) * 100) / 100;
  const cgstAmount = Math.round(taxableAmount * (cgstRate / 100) * 100) / 100;

  return {
    ...row,
    amount,
    discountAmount,
    taxableAmount,
    sgstRate,
    sgstAmount,
    cgstRate,
    cgstAmount,
    igstRate: 0,
    igstAmount: 0,
    total: Math.round((taxableAmount + sgstAmount + cgstAmount) * 100) / 100,
  };
}

interface ProductSkuDropdownProps {
  value: string;
  options: ProductSkuSuggestion[];
  onSelect: (opt: ProductSkuSuggestion) => void;
  onManualChange: (val: string) => void;
}

function ProductSkuDropdown({
  value,
  options,
  onSelect,
  onManualChange,
}: ProductSkuDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 260,
  });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 280),
        });
      }
    };
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 100);
    return options
      .filter(
        (o) =>
          o.sku.toLowerCase().includes(q) ||
          (o.name && o.name.toLowerCase().includes(q))
      )
      .slice(0, 100);
  }, [options, search]);

  return (
    <div className="relative w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-8 px-2.5 text-xs text-left rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white flex items-center justify-between gap-1.5 cursor-pointer hover:border-[#E8C16D] transition-colors"
      >
        <span className={`truncate ${value ? "font-medium" : "text-slate-400"}`}>
          {value || "Select Product..."}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 9999,
            }}
            className="rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#171C28] shadow-2xl p-2 flex flex-col gap-1.5"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-8 pl-8 pr-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#0B0E14] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-2.5 text-center space-y-2">
                  <p className="text-[11px] text-slate-400">No matching SKU found</p>
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        onManualChange(search.trim());
                        setOpen(false);
                        setSearch("");
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-[11px] font-bold cursor-pointer"
                    >
                      Use &quot;{search.trim()}&quot;
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.sku}
                    type="button"
                    onClick={() => {
                      onSelect(opt);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      value === opt.sku
                        ? "bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-bold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="truncate">{opt.sku}</span>
                    {opt.name && opt.name !== opt.sku && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px] shrink-0">
                        {opt.name}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default function CreditNoteCreateForm({
  creditNote,
  onSuccess,
  onCancel,
}: CreditNoteCreateFormProps) {
  const isEditing = Boolean(creditNote?.id);
  const todayStr = new Date().toISOString().split("T")[0];

  const [creditNoteNo, setCreditNoteNo] = useState(creditNote?.creditNoteNo || "");
  const [creditNoteDate, setCreditNoteDate] = useState(
    creditNote?.creditNoteDate
      ? new Date(creditNote.creditNoteDate).toISOString().split("T")[0]
      : todayStr
  );
  const [salesFor, setSalesFor] = useState(creditNote?.salesFor || "Product");
  const [invoiceType, setInvoiceType] = useState(
    creditNote?.invoiceType || "Tax Invoice"
  );

  // Party State
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [partyDrawerOpen, setPartyDrawerOpen] = useState(false);
  const [partyDropdownOpen, setPartyDropdownOpen] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [partyInvoices, setPartyInvoices] = useState<SalesInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [skuOptions, setSkuOptions] = useState<ProductSkuSuggestion[]>([]);

  const [preparedBy, setPreparedBy] = useState(creditNote?.preparedBy || "");

  useEffect(() => {
    if (!creditNote?.preparedBy) {
      setPreparedBy((prev) => prev || getCurrentUserName());
    }
  }, [creditNote?.preparedBy]);

  const [remarks, setRemarks] = useState(creditNote?.remarks || "");
  const [tdsPercent, setTdsPercent] = useState<number>(Number(creditNote?.tdsPercent) || 0);
  const [tcsPercent, setTcsPercent] = useState<number>(Number(creditNote?.tcsPercent) || 0);
  const [otherExpense, setOtherExpense] = useState<number>(Number(creditNote?.otherExpense) || 0);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpenseItem[]>(
    Array.isArray(creditNote?.otherExpenses) ? creditNote.otherExpenses : []
  );
  const [otherExpenseModalOpen, setOtherExpenseModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [items, setItems] = useState<SalesCreditNoteItem[]>(
    creditNote?.items && creditNote.items.length > 0
      ? creditNote.items
      : []
  );

  const partyDropdownRef = useRef<HTMLDivElement>(null);

  const isInterstate = useMemo(() => {
    const code = getStateCode(selectedParty?.state, selectedParty?.gstin);
    return code !== "24";
  }, [selectedParty]);

  const isTaxInvoice = invoiceType === "Tax Invoice" || invoiceType === "Retail Invoice";

  // Load initial sequence number, parties, and SKUs
  useEffect(() => {
    if (!isEditing) {
      const timer = setTimeout(() => setPartyDrawerOpen(true), 150);
      salesCreditNoteService
        .getNextCreditNoteNo()
        .then((nextNo) => setCreditNoteNo(nextNo))
        .catch(() => setCreditNoteNo("CN/2026-2027/1"));

      challanService
        .getParties("")
        .then((list) => setParties(list))
        .catch((err) => console.error("Failed to fetch parties:", err));

      purchaseChallanService
        .searchSkus("")
        .then((list) => setSkuOptions(list || []))
        .catch(() => {});

      return () => clearTimeout(timer);
    }

    challanService
      .getParties("")
      .then((list) => {
        setParties(list);
        if (creditNote?.partyId || creditNote?.billingPartyName) {
          const match = list.find(
            (p) =>
              p.id === creditNote.partyId ||
              p.partyName === creditNote.billingPartyName
          );
          if (match) setSelectedParty(match);
        }
      })
      .catch((err) => console.error("Failed to fetch parties:", err));

    purchaseChallanService
      .searchSkus("")
      .then((list) => setSkuOptions(list || []))
      .catch(() => {});
  }, [isEditing, creditNote?.partyId, creditNote?.billingPartyName]);

  // Fetch party's Sales Invoices when party changes
  useEffect(() => {
    if (!selectedParty) {
      setPartyInvoices([]);
      return;
    }
    setLoadingInvoices(true);
    salesInvoiceService
      .getInvoices({ partyName: selectedParty.partyName, limit: 20 })
      .then((res) => setPartyInvoices(res.data || []))
      .catch(() => setPartyInvoices([]))
      .finally(() => setLoadingInvoices(false));
  }, [selectedParty]);

  // Outside click for party dropdown
  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (
        partyDropdownRef.current &&
        !partyDropdownRef.current.contains(e.target as Node)
      ) {
        setPartyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOut);
    return () => document.removeEventListener("mousedown", handleOut);
  }, []);

  // Recalculate rows when interstate or invoiceType changes
  useEffect(() => {
    setItems((prev) =>
      prev.map((row) => recalculateRow(row, isInterstate, isTaxInvoice))
    );
  }, [isInterstate, isTaxInvoice]);

  const handleAddRow = () => {
    const newRow: SalesCreditNoteItem = recalculateRow(
      {
        itemNo: items.length + 1,
        sku: "",
        particular: "",
        refInvoiceNo: "",
        size: "",
        quantity: 0,
        rate: 0,
        amount: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 0,
        sgstRate: isTaxInvoice && !isInterstate ? 2.5 : 0,
        sgstAmount: 0,
        cgstRate: isTaxInvoice && !isInterstate ? 2.5 : 0,
        cgstAmount: 0,
        igstRate: isTaxInvoice && isInterstate ? 5 : 0,
        igstAmount: 0,
        total: 0,
      },
      isInterstate,
      isTaxInvoice
    );
    setItems((prev) => [...prev, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((r, i) => ({ ...r, itemNo: i + 1 }))
    );
  };

  const updateRowField = (
    index: number,
    field: keyof SalesCreditNoteItem,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const updated = { ...row, [field]: value };
        if (field === "sku") {
          updated.particular = value;
        }
        return recalculateRow(updated, isInterstate, isTaxInvoice);
      })
    );
  };

  const handleSelectSku = (index: number, opt: ProductSkuSuggestion) => {
    setItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row;
        const updated: SalesCreditNoteItem = {
          ...row,
          sku: opt.sku,
          particular: opt.name || opt.sku,
          size: row.size || "",
          hsn: row.hsn || "6204",
          rate: opt.rate || row.rate || 0,
          quantity: Number(row.quantity) > 0 ? row.quantity : 1,
        };
        return recalculateRow(updated, isInterstate, isTaxInvoice);
      })
    );
  };

  const handleAddFromInvoice = async (inv: SalesInvoice) => {
    try {
      const fullInv = await salesInvoiceService.getInvoiceById(inv.id);
      const invItems = fullInv.items || [];
      if (invItems.length === 0) {
        toast.info("This invoice has no items.");
        return;
      }
      const mapped: SalesCreditNoteItem[] = invItems.map((it: any, idx) =>
        recalculateRow(
          {
            itemNo: items.length + idx + 1,
            sku: it.sku || "",
            particular: it.particular || it.sku || "",
            refInvoiceNo: fullInv.invoiceNo,
            size: it.size || "",
            hsn: it.hsn || "6204",
            quantity: Number(it.quantity) || 1,
            rate: Number(it.rate) || 0,
            amount: 0,
            discountPercent: Number(it.discountPercent) || 0,
            discountAmount: 0,
            taxableAmount: 0,
            sgstRate: Number(it.sgstRate) || (isTaxInvoice && !isInterstate ? 2.5 : 0),
            sgstAmount: 0,
            cgstRate: Number(it.cgstRate) || (isTaxInvoice && !isInterstate ? 2.5 : 0),
            cgstAmount: 0,
            igstRate: Number(it.igstRate) || (isTaxInvoice && isInterstate ? 5 : 0),
            igstAmount: 0,
            total: 0,
          },
          isInterstate,
          isTaxInvoice
        )
      );
      setItems((prev) => [...prev, ...mapped]);
      toast.success(`Added ${mapped.length} item(s) from Invoice ${fullInv.invoiceNo}`);
    } catch {
      toast.error("Failed to load invoice items");
    }
  };

  // Summary calculations
  const summary = useMemo(() => {
    const totalQuantity = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    const grossAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.amount) || 0), 0) * 100) / 100;
    const discountAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.discountAmount) || 0), 0) * 100) / 100;
    const beforeTaxAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.taxableAmount) || 0), 0) * 100) / 100;
    const sgstAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.sgstAmount) || 0), 0) * 100) / 100;
    const cgstAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.cgstAmount) || 0), 0) * 100) / 100;
    const igstAmount =
      Math.round(items.reduce((s, it) => s + (Number(it.igstAmount) || 0), 0) * 100) / 100;
    const totalGst = Math.round((sgstAmount + cgstAmount + igstAmount) * 100) / 100;
    const afterTaxAmount = Math.round((beforeTaxAmount + totalGst) * 100) / 100;

    const tdsAmount = Math.round(beforeTaxAmount * (tdsPercent / 100) * 100) / 100;
    const tcsAmount = Math.round(beforeTaxAmount * (tcsPercent / 100) * 100) / 100;
    const preRoundNet =
      Math.round((afterTaxAmount + otherExpense + tcsAmount - tdsAmount) * 100) / 100;
    const roundedNet = Math.round(preRoundNet);
    const roundOff = Math.round((roundedNet - preRoundNet) * 100) / 100;

    return {
      totalQuantity,
      grossAmount,
      discountAmount,
      beforeTaxAmount,
      sgstAmount,
      cgstAmount,
      igstAmount,
      totalGst,
      afterTaxAmount,
      tdsAmount,
      tcsAmount,
      roundOff,
      netAmount: roundedNet,
    };
  }, [items, tdsPercent, tcsPercent, otherExpense]);

  const filteredParties = useMemo(() => {
    const q = partySearch.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.partyName.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [parties, partySearch]);

  const handleSubmit = async () => {
    if (!selectedParty) {
      toast.error("Please select a Party.");
      setPartyDrawerOpen(true);
      return;
    }
    const validItems = items.filter((it) => it.sku && it.sku.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please add at least one product row.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        partyId: selectedParty.id,
        salesFor,
        invoiceType,
        creditNoteNo,
        creditNoteDate,
        partyGstn: selectedParty.gstin || null,
        stateCode: getStateCode(selectedParty.state, selectedParty.gstin),
        billingPartyName: selectedParty.partyName,
        billingAddress:
          (selectedParty as any).address1 || selectedParty.addressLine1 || null,
        billingCity: selectedParty.city || null,
        billingState: selectedParty.state || "Gujarat",
        billingPincode: selectedParty.pincode || null,
        billingMobile: selectedParty.phone || null,
        preparedBy: preparedBy || getCurrentUserName(),
        remarks: remarks || null,
        tdsPercent: Number(tdsPercent) || 0,
        tdsAmount: summary.tdsAmount,
        tcsPercent: Number(tcsPercent) || 0,
        tcsAmount: summary.tcsAmount,
        otherExpense: Number(otherExpense) || 0,
        otherExpenses,
        totalQuantity: summary.totalQuantity,
        totalAmount: summary.grossAmount,
        totalDiscount: summary.discountAmount,
        amountBeforeTax: summary.beforeTaxAmount,
        sgstAmount: summary.sgstAmount,
        cgstAmount: summary.cgstAmount,
        igstAmount: summary.igstAmount,
        totalGst: summary.totalGst,
        amountAfterTax: summary.afterTaxAmount,
        roundOff: summary.roundOff,
        netAmount: summary.netAmount,
        items: validItems.map((it, idx) => ({
          ...it,
          itemNo: idx + 1,
          particular: it.particular || it.sku,
        })),
      };

      if (isEditing && creditNote?.id) {
        await salesCreditNoteService.updateCreditNote(creditNote.id, payload);
        toast.success(`Credit Note ${creditNoteNo} updated!`);
      } else {
        await salesCreditNoteService.createCreditNote(payload);
        toast.success(`Credit Note ${creditNoteNo} created!`);
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save Credit Note.");
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
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-[#0A0E1A] dark:text-white tracking-tight">
                Credit Note [ Sale Return ]
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Offline Sales • Sale Return • Credit Note
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
              {creditNoteNo || "CN/2026-2027/1"}
            </div>
            <div className="w-36">
              <DatePicker
                allowInput
                value={creditNoteDate}
                onChange={(_, str) => setCreditNoteDate(str || todayStr)}
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
                Sales For
              </label>
              <div className="w-36">
                <ThemeSelectDropdown
                  value={salesFor}
                  onChange={setSalesFor}
                  options={salesForOptions}
                  buttonClassName="h-9 px-3 text-xs font-semibold rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Invoice Type
              </label>
              <div className="w-44">
                <ThemeSelectDropdown
                  value={invoiceType}
                  onChange={setInvoiceType}
                  options={invoiceTypeOptions}
                  buttonClassName="h-9 px-3 text-xs font-semibold rounded-full border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Right: Select Party + State Code + GSTIN */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setPartyDrawerOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold hover:bg-[#FFF3D6] cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="truncate max-w-[180px]">
                {selectedParty ? selectedParty.partyName : "SELECT PARTY"}
              </span>
            </button>
            <div className="h-9 min-w-[44px] px-3 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-xs font-mono font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center">
              {selectedParty
                ? getStateCode(selectedParty.state, selectedParty.gstin)
                : "-"}
            </div>
            <span className="text-slate-400">-</span>
            <div className="h-9 min-w-[140px] px-3.5 rounded-full border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center justify-center">
              {selectedParty?.gstin || "-"}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Area (Scoped for Party Details Drawer) */}
      <div className="relative min-h-[580px] sm:min-h-[640px] overflow-x-clip space-y-4">
        {/* Items Table */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFFDF8] dark:bg-[#080B11]/60 text-[11px] font-bold text-[#B88728] dark:text-[#E8C16D]">
                  <th className="py-3 px-2.5 text-center w-10">No.</th>
                  <th className="py-3 px-2.5 min-w-[200px]">Material / Service / Product.</th>
                  <th className="py-3 px-2.5 w-28">Ref Invoice No.</th>
                  <th className="py-3 px-2.5 w-24">Size.</th>
                  <th className="py-3 px-2.5 w-20 text-right">Qty.</th>
                  <th className="py-3 px-2.5 w-24 text-right">Rate.</th>
                  <th className="py-3 px-2.5 w-24 text-right">Amount.</th>
                  <th className="py-3 px-2.5 w-20 text-right">Dis. (%)</th>
                  <th className="py-3 px-2.5 w-24 text-right">Discount ₹</th>
                  <th className="py-3 px-2.5 w-28 text-right">Taxable Amt.</th>
                  {isInterstate ? (
                    <>
                      <th className="py-3 px-2.5 w-20 text-right">IGST %</th>
                      <th className="py-3 px-2.5 w-24 text-right">IGST Amt.</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3 px-2.5 w-20 text-right">SGST %</th>
                      <th className="py-3 px-2.5 w-24 text-right">SGST Amt.</th>
                      <th className="py-3 px-2.5 w-20 text-right">CGST %</th>
                      <th className="py-3 px-2.5 w-24 text-right">CGST Amt.</th>
                    </>
                  )}
                  <th className="py-3 px-2.5 w-24 text-right">Total</th>
                  <th className="py-3 px-2.5 w-12 text-center">Del.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D2]/50 dark:divide-white/[0.06] text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isInterstate ? 14 : 16}
                      className="py-16 text-center"
                    >
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-white/[0.04] text-[#B88728] dark:text-[#E8C16D]">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">No data available</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-2.5 text-center font-semibold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <ProductSkuDropdown
                          value={row.sku}
                          options={skuOptions}
                          onSelect={(opt) => handleSelectSku(idx, opt)}
                          onManualChange={(val) => updateRowField(idx, "sku", val)}
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="text"
                          value={row.refInvoiceNo || ""}
                          onChange={(e) =>
                            updateRowField(idx, "refInvoiceNo", e.target.value)
                          }
                          placeholder="Ref Inv"
                          className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="text"
                          value={row.size || ""}
                          onChange={(e) =>
                            updateRowField(idx, "size", e.target.value)
                          }
                          placeholder="Size"
                          className="w-full h-8 px-2 text-xs text-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="number"
                          min={0}
                          value={row.quantity}
                          onChange={(e) =>
                            updateRowField(idx, "quantity", e.target.value)
                          }
                          className="w-full h-8 px-2 text-xs text-right font-mono font-bold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={row.rate}
                          onChange={(e) => updateRowField(idx, "rate", e.target.value)}
                          className="w-full h-8 px-2 text-xs text-right font-mono font-bold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                        {Number(row.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={row.discountPercent}
                          onChange={(e) =>
                            updateRowField(idx, "discountPercent", e.target.value)
                          }
                          className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                        {Number(row.discountAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                        {Number(row.taxableAmount || 0).toFixed(2)}
                      </td>
                      {isInterstate ? (
                        <>
                          <td className="py-2.5 px-2.5">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.igstRate}
                              onChange={(e) =>
                                updateRowField(idx, "igstRate", e.target.value)
                              }
                              disabled={!isTaxInvoice}
                              className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] disabled:opacity-50"
                            />
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                            {Number(row.igstAmount || 0).toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-2.5">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.sgstRate}
                              onChange={(e) =>
                                updateRowField(idx, "sgstRate", e.target.value)
                              }
                              disabled={!isTaxInvoice}
                              className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] disabled:opacity-50"
                            />
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                            {Number(row.sgstAmount || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-2.5">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.cgstRate}
                              onChange={(e) =>
                                updateRowField(idx, "cgstRate", e.target.value)
                              }
                              disabled={!isTaxInvoice}
                              className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] disabled:opacity-50"
                            />
                          </td>
                          <td className="py-2.5 px-2.5 text-right font-mono text-slate-600 dark:text-slate-300">
                            {Number(row.cgstAmount || 0).toFixed(2)}
                          </td>
                        </>
                      )}
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                        {Number(row.total || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
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

          <div className="p-3 border-t border-[#E7E0D2] dark:border-white/[0.08] flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold hover:bg-[#FFF3D6] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </section>

        {/* 4. Bottom Grid: Sale Invoices & Prepared By (Left) + Summary (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-4">
            {/* Sale Invoices Table */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-[#0A0E1A] dark:text-white">
                  Sale Invoices
                </h3>
                {selectedParty && (
                  <span className="text-[11px] text-[#B88728] dark:text-[#E8C16D] font-medium">
                    Click an invoice to add its items
                  </span>
                )}
              </div>
              <div className="overflow-x-auto max-h-48 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFFDF8] dark:bg-[#080B11]/60 text-[11px] font-bold text-[#B88728] dark:text-[#E8C16D]">
                      <th className="py-2.5 px-3">No.</th>
                      <th className="py-2.5 px-3">Invoice No.</th>
                      <th className="py-2.5 px-3">Date.</th>
                      <th className="py-2.5 px-3 text-right">Quantity.</th>
                      <th className="py-2.5 px-3 text-right">Limit Amount.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E0D2]/50 dark:divide-white/[0.06]">
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
                          onClick={() => handleAddFromInvoice(inv)}
                          className="hover:bg-[#FFF9EC] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                        >
                          <td className="py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-[#B88728] dark:text-[#E8C16D]">
                            {inv.invoiceNo}
                          </td>
                          <td className="py-2 px-3">
                            {inv.invoiceDate
                              ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
                              : "-"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {inv.totalQuantity || 0}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
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
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center gap-2 h-9 sm:h-10 px-6 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600 dark:text-slate-300">Gross Amount</span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.grossAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Discount Amount</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  ₹ {summary.discountAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#E7E0D2]/50 dark:border-white/[0.06]">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Before Tax Amount
                </span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.beforeTaxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">SGST.</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  ₹ {summary.sgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">CGST.</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  ₹ {summary.cgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">IGST.</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  ₹ {summary.igstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#E7E0D2]/50 dark:border-white/[0.06]">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  After Tax Amount
                </span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.afterTaxAmount.toFixed(2)}
                </span>
              </div>

              {/* TDS % */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 w-12">TDS %</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={tdsPercent}
                    onChange={(e) => setTdsPercent(Number(e.target.value) || 0)}
                    className="h-7 w-16 px-2 text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">TDS Amount.</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    ₹ {summary.tdsAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* TCS % */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 w-12">TCS %</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={tcsPercent}
                    onChange={(e) => setTcsPercent(Number(e.target.value) || 0)}
                    className="h-7 w-16 px-2 text-right font-mono rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">TCS Amount.</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200">
                    ₹ {summary.tcsAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Other Expense */}
              <div className="flex items-center justify-between gap-3">
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

              {/* Round Off */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-sky-600 dark:text-sky-400">
                  Round Off
                </span>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  ₹ {summary.roundOff.toFixed(2)}
                </span>
              </div>

              {/* Net Amount */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E7E0D2] dark:border-white/[0.08] text-sm font-black">
                <span className="text-[#0A0E1A] dark:text-white">Net Amount</span>
                <span className="font-mono text-[#B88728] dark:text-[#E8C16D]">
                  ₹ {summary.netAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Slide-over Party Details Drawer scoped below Header & Meta Bar */}
        <div
          className={`absolute inset-x-0 top-0 -bottom-10 sm:-bottom-16 z-30 bg-black/10 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            partyDrawerOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setPartyDrawerOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 bottom-0 z-40 w-full max-w-lg sm:max-w-xl bg-white dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out overflow-hidden ${
            partyDrawerOpen
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
              onClick={() => setPartyDrawerOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 space-y-4 custom-scrollbar">
            <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#121620] p-3.5 sm:p-4 space-y-3.5">
              {/* Select Party Dropdown + Add Party Button */}
              <div className="space-y-1.5 relative" ref={partyDropdownRef}>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Party
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => setPartyDropdownOpen((o) => !o)}
                      className={`w-full h-9 sm:h-10 px-3.5 flex items-center justify-between rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer ${
                        partyDropdownOpen
                          ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30 bg-white dark:bg-[#171C28] text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171C28] text-slate-900 dark:text-white"
                      }`}
                    >
                      <span className="truncate">
                        {selectedParty ? selectedParty.partyName : "Select..."}
                      </span>
                      <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.info("Add new party from Ledger Book")}
                    className="h-9 w-9 sm:h-10 sm:w-10 border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#171C28] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-all cursor-pointer"
                    title="Add New Party"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>

                {partyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 p-2 bg-white dark:bg-[#171C28] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-xl max-h-64 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="relative mb-2 shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={partySearch}
                        onChange={(e) => setPartySearch(e.target.value)}
                        placeholder="Search party..."
                        className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-[#0B0E14] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                      />
                    </div>
                    <div className="overflow-y-auto max-h-48 custom-scrollbar space-y-0.5">
                      {filteredParties.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No parties found
                        </div>
                      ) : (
                        filteredParties.map((p) => {
                          const isSelected = selectedParty?.id === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedParty(p);
                                setPartyDropdownOpen(false);
                              }}
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
                      {selectedParty?.partyName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Mobile</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300">
                      {selectedParty?.phone || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">Address</div>
                    <div className="text-slate-700 dark:text-slate-300 truncate">
                      {(selectedParty as any)?.address1 ||
                        selectedParty?.addressLine1 ||
                        selectedParty?.city ||
                        "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-slate-400">GST</div>
                    <div className="font-mono text-slate-700 dark:text-slate-300 truncate">
                      {selectedParty?.gstin || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPartyDrawerOpen(false)}
                className="h-9 px-5 rounded-xl bg-[#E8C16D] text-[#0A0E1A] text-xs font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Other Expenses Modal */}
      <OtherExpensesModal
        isOpen={otherExpenseModalOpen}
        onClose={() => setOtherExpenseModalOpen(false)}
        expenses={otherExpenses}
        subtitle="Manage other expenses for this Credit Note"
        onSave={(savedItems, totalAmount) => {
          setOtherExpenses(savedItems);
          setOtherExpense(totalAmount);
        }}
      />
    </div>
  );
}
