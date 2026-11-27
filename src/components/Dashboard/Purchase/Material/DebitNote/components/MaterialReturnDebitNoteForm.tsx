"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  FileMinus2,
  List,
  Plus,
  QrCode,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import OtherExpensesModal, {
  OtherExpenseItem,
} from "@/components/Dashboard/common/OtherExpensesModal";
import { getCurrentUserName } from "@/utils/auth";
import MaterialSkuDropdown from "../../Order/components/MaterialSkuDropdown";
import RollDetailsModal from "../../Order/components/RollDetailsModal";
import {
  MaterialCatalogOption,
  MaterialOrderParty,
  MaterialRollDetail,
} from "../../Order/types/materialOrder.types";
import { materialOrderService } from "../../Order/services/materialOrder.service";
import { MaterialPurchaseInvoice } from "../../Invoice/types/materialInvoice.types";
import { materialInvoiceService } from "../../Invoice/services/materialInvoice.service";
import MaterialDebitNotePartyDrawer from "./MaterialDebitNotePartyDrawer";
import {
  MaterialPurchaseDebitNote,
  MaterialPurchaseDebitNoteItem,
} from "../types/materialDebitNote.types";
import { materialDebitNoteService } from "../services/materialDebitNote.service";

interface MaterialReturnDebitNoteFormProps {
  debitNoteToEdit?: MaterialPurchaseDebitNote | null;
  initialInvoiceId?: string | null;
  onBack: () => void;
  onSaved: () => void;
}

const debitNoteTypeOptions: ThemeSelectOption[] = [
  { value: "Return", label: "Return" },
  { value: "Discount", label: "Discount" },
];

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "URD Tax Invoice", label: "URD Tax Invoice" },
];

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;
}

function computeRow(row: MaterialPurchaseDebitNoteItem): MaterialPurchaseDebitNoteItem {
  const qty = Number(row.qty) || 0;
  const rate = Number(row.rate) || 0;
  const amount = Math.round(qty * rate * 100) / 100;
  const discPercent = Number(row.discPercent) || 0;
  const discAmount =
    discPercent > 0
      ? Math.round(amount * (discPercent / 100) * 100) / 100
      : Number(row.discAmount) || 0;
  const taxableAmount = Math.round(Math.max(0, amount - discAmount) * 100) / 100;
  const sgstPercent = Number(row.sgstPercent) || 0;
  const cgstPercent = Number(row.cgstPercent) || 0;
  const igstPercent = Number(row.igstPercent) || 0;
  const sgstAmount = Math.round(taxableAmount * (sgstPercent / 100) * 100) / 100;
  const cgstAmount = Math.round(taxableAmount * (cgstPercent / 100) * 100) / 100;
  const igstAmount = Math.round(taxableAmount * (igstPercent / 100) * 100) / 100;
  const netAmount =
    Math.round((taxableAmount + sgstAmount + cgstAmount + igstAmount) * 100) / 100;
  return {
    ...row,
    amount,
    discAmount,
    taxableAmount,
    sgstAmount,
    cgstAmount,
    igstAmount,
    netAmount,
  };
}

function createEmptyDnItem(itemNo: number): MaterialPurchaseDebitNoteItem {
  return {
    itemNo,
    materialId: null,
    sku: "",
    hsnCode: "",
    refInvoiceId: null,
    refInvoiceNo: "",
    qty: 0,
    unit: "",
    rate: 0,
    amount: 0,
    discPercent: 0,
    discAmount: 0,
    taxableAmount: 0,
    sgstPercent: 0,
    sgstAmount: 0,
    cgstPercent: 0,
    cgstAmount: 0,
    igstPercent: 0,
    igstAmount: 0,
    netAmount: 0,
    rollDetails: [],
  };
}

export default function MaterialReturnDebitNoteForm({
  debitNoteToEdit,
  initialInvoiceId,
  onBack,
  onSaved,
}: MaterialReturnDebitNoteFormProps) {
  const todayStr = getTodayStr();
  const isEdit = Boolean(debitNoteToEdit?.id);

  const [debitNoteNo, setDebitNoteNo] = useState(debitNoteToEdit?.debitNoteNo || "");
  const [debitNoteDate, setDebitNoteDate] = useState(
    debitNoteToEdit?.debitNoteDate ? debitNoteToEdit.debitNoteDate.split("T")[0] : todayStr
  );
  const [debitNoteType, setDebitNoteType] = useState(
    debitNoteToEdit?.debitNoteType || "Return"
  );
  const [invoiceType, setInvoiceType] = useState(
    debitNoteToEdit?.invoiceType || "URD Tax Invoice"
  );
  const [remarks, setRemarks] = useState(debitNoteToEdit?.remarks || "");
  const [preparedBy] = useState(
    debitNoteToEdit?.preparedBy || getCurrentUserName() || "User"
  );
  const [barcodeScan, setBarcodeScan] = useState("");

  const [tdsPercent, setTdsPercent] = useState<number>(debitNoteToEdit?.tdsPercent || 0);
  const [tcsPercent, setTcsPercent] = useState<number>(debitNoteToEdit?.tcsPercent || 0);
  const [otherExpense, setOtherExpense] = useState<number>(
    debitNoteToEdit?.otherExpense || 0
  );
  const [otherExpenses, setOtherExpenses] = useState<OtherExpenseItem[]>(
    Array.isArray(debitNoteToEdit?.otherExpenses) ? debitNoteToEdit.otherExpenses : []
  );
  const [isOtherExpenseOpen, setIsOtherExpenseOpen] = useState(false);

  const [parties, setParties] = useState<MaterialOrderParty[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [materials, setMaterials] = useState<MaterialCatalogOption[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<MaterialPurchaseInvoice[]>([]);

  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    debitNoteToEdit?.supplierId || ""
  );
  const [isPartyDrawerOpen, setIsPartyDrawerOpen] = useState(false);
  const [activeRollIdx, setActiveRollIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isEdit && !initialInvoiceId) {
      const timer = setTimeout(() => setIsPartyDrawerOpen(true), 80);
      return () => clearTimeout(timer);
    }
  }, [isEdit, initialInvoiceId]);

  const [items, setItems] = useState<MaterialPurchaseDebitNoteItem[]>(() => {
    if (debitNoteToEdit?.items && debitNoteToEdit.items.length > 0) {
      return debitNoteToEdit.items.map((it, idx) =>
        computeRow({
          id: it.id,
          itemNo: it.itemNo || idx + 1,
          materialId: it.materialId || null,
          sku: it.sku || "",
          hsnCode: it.hsnCode || "",
          refInvoiceId: it.refInvoiceId || null,
          refInvoiceNo: it.refInvoiceNo || "",
          qty: Number(it.qty) || 0,
          unit: it.unit || "",
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || 0,
          discPercent: Number(it.discPercent) || 0,
          discAmount: Number(it.discAmount) || 0,
          taxableAmount: Number(it.taxableAmount) || 0,
          sgstPercent: Number(it.sgstPercent) || 0,
          sgstAmount: Number(it.sgstAmount) || 0,
          cgstPercent: Number(it.cgstPercent) || 0,
          cgstAmount: Number(it.cgstAmount) || 0,
          igstPercent: Number(it.igstPercent) || 0,
          igstAmount: Number(it.igstAmount) || 0,
          netAmount: Number(it.netAmount) || 0,
          rollDetails: Array.isArray(it.rollDetails) ? it.rollDetails : [],
        })
      );
    }
    return [];
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isEdit) {
      materialDebitNoteService
        .getNextDebitNoteNo()
        .then((no) => {
          if (active) setDebitNoteNo(no);
        })
        .catch(() => {
          if (active) setDebitNoteNo("DN/2026-2027/1");
        });
    }

    setLoadingParties(true);
    materialOrderService
      .getParties()
      .then((list) => {
        if (active) setParties(list);
      })
      .catch((err) => console.error("Failed to fetch parties", err))
      .finally(() => {
        if (active) setLoadingParties(false);
      });

    materialOrderService
      .getMaterials()
      .then((list) => {
        if (active) setMaterials(list);
      })
      .catch((err) => console.error("Failed to fetch materials", err));

    if (!isEdit && initialInvoiceId) {
      materialInvoiceService
        .getInvoiceById(initialInvoiceId)
        .then((inv) => {
          if (!active || !inv) return;
          if (inv.supplierId) setSelectedPartyId(inv.supplierId);
          setInvoiceType(inv.invoiceType || "URD Tax Invoice");
          if (Array.isArray(inv.items) && inv.items.length > 0) {
            setItems(
              inv.items.map((it, idx) =>
                computeRow({
                  itemNo: idx + 1,
                  materialId: it.materialId || null,
                  sku: it.sku,
                  hsnCode: it.hsnCode || "",
                  refInvoiceId: inv.id,
                  refInvoiceNo: inv.invoiceNo,
                  qty: Number(it.qty) || 0,
                  unit: it.unit || "Pcs",
                  rate: Number(it.rate) || 0,
                  amount: 0,
                  discPercent: Number(it.discPercent) || 0,
                  discAmount: 0,
                  taxableAmount: 0,
                  sgstPercent: Number(it.sgstPercent) || 0,
                  sgstAmount: 0,
                  cgstPercent: Number(it.cgstPercent) || 0,
                  cgstAmount: 0,
                  igstPercent: Number(it.igstPercent) || 0,
                  igstAmount: 0,
                  netAmount: 0,
                })
              )
            );
          }
        })
        .catch(() => { });
    }

    return () => {
      active = false;
    };
  }, [isEdit, initialInvoiceId]);

  useEffect(() => {
    if (!selectedPartyId) {
      setSupplierInvoices([]);
      return;
    }
    let active = true;
    materialDebitNoteService
      .getSupplierInvoices(selectedPartyId)
      .then((list) => {
        if (active) setSupplierInvoices(list);
      })
      .catch(() => {
        if (active) setSupplierInvoices([]);
      });
    return () => {
      active = false;
    };
  }, [selectedPartyId]);

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId) || debitNoteToEdit?.supplier || null,
    [parties, selectedPartyId, debitNoteToEdit]
  );

  const isIntraState = useMemo(() => {
    const gst = selectedParty?.gstNumber?.trim() || "";
    const state = selectedParty?.state?.trim().toLowerCase() || "";
    return gst.startsWith("24") || state === "gujarat";
  }, [selectedParty]);

  const handleSaveRollDetails = (
    rows: MaterialRollDetail[],
    totalRealQty: number,
    avgRate?: number
  ) => {
    if (activeRollIdx === null) return;
    const current = items[activeRollIdx];
    updateItem(activeRollIdx, {
      rollDetails: rows,
      qty: totalRealQty > 0 ? totalRealQty : current?.qty || 0,
      rate: avgRate && avgRate > 0 ? avgRate : current?.rate || 0,
    });
    setActiveRollIdx(null);
  };

  const invoiceRefOptions: ThemeSelectOption[] = useMemo(() => {
    return [
      { value: "", label: "Select Invoice" },
      ...supplierInvoices.map((inv) => ({
        value: inv.invoiceNo,
        label: inv.invoiceNo,
      })),
    ];
  }, [supplierInvoices]);

  const summary = useMemo(() => {
    const grossAmount =
      Math.round(items.reduce((s, r) => s + (Number(r.amount) || 0), 0) * 100) / 100;
    const discountAmount =
      Math.round(items.reduce((s, r) => s + (Number(r.discAmount) || 0), 0) * 100) / 100;
    const beforeTaxAmount =
      Math.round(items.reduce((s, r) => s + (Number(r.taxableAmount) || 0), 0) * 100) /
      100;
    const sgstAmount =
      Math.round(items.reduce((s, r) => s + (Number(r.sgstAmount) || 0), 0) * 100) / 100;
    const cgstAmount =
      Math.round(items.reduce((s, r) => s + (Number(r.cgstAmount) || 0), 0) * 100) / 100;
    const igstAmount =
      Math.round(items.reduce((s, r) => s + (Number(r.igstAmount) || 0), 0) * 100) / 100;
    const afterTaxAmount =
      Math.round((beforeTaxAmount + sgstAmount + cgstAmount + igstAmount) * 100) / 100;
    const tdsAmount =
      Math.round(beforeTaxAmount * ((Number(tdsPercent) || 0) / 100) * 100) / 100;
    const tcsAmount =
      Math.round(afterTaxAmount * ((Number(tcsPercent) || 0) / 100) * 100) / 100;
    const netAmount =
      Math.round(
        (afterTaxAmount - tdsAmount + tcsAmount + (Number(otherExpense) || 0)) * 100
      ) / 100;

    return {
      grossAmount,
      discountAmount,
      beforeTaxAmount,
      sgstAmount,
      cgstAmount,
      igstAmount,
      afterTaxAmount,
      tdsAmount,
      tcsAmount,
      netAmount,
    };
  }, [items, tdsPercent, tcsPercent, otherExpense]);

  const updateItem = (idx: number, patch: Partial<MaterialPurchaseDebitNoteItem>) => {
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? computeRow({ ...row, ...patch }) : row))
    );
  };

  const handleSelectMaterial = (idx: number, mat: MaterialCatalogOption) => {
    const skuVal = mat.sku || mat.masterSku || mat.materialName;
    const gst = Number(mat.gstRate) || 0;
    const halfGst = gst > 0 ? Math.round((gst / 2) * 100) / 100 : 0;

    // Look up latest invoice rate for this material if materialCost is 0
    let latestInvoiceRate = 0;
    for (const inv of supplierInvoices) {
      const matchedItem = (inv.items || []).find(
        (it) =>
          (mat.id && it.materialId === mat.id) ||
          (it.sku || "").toLowerCase() === skuVal.toLowerCase()
      );
      if (matchedItem && Number(matchedItem.rate) > 0) {
        latestInvoiceRate = Number(matchedItem.rate);
        break;
      }
    }

    const resolvedRate =
      (Number(mat.materialCost) || 0) > 0
        ? Number(mat.materialCost)
        : latestInvoiceRate > 0
        ? latestInvoiceRate
        : Number(mat.dealerRate) || Number(mat.retailRate) || Number(mat.salesRate) || 0;

    updateItem(idx, {
      sku: skuVal,
      materialId: mat.id,
      hsnCode: mat.hsnCode || items[idx]?.hsnCode || "",
      unit: mat.unit || items[idx]?.unit || "",
      rate: resolvedRate,
      sgstPercent: isIntraState ? halfGst : 0,
      cgstPercent: isIntraState ? halfGst : 0,
      igstPercent: isIntraState ? 0 : gst,
    });
  };

  const handleSelectCustomSku = (idx: number, skuText: string) => {
    updateItem(idx, {
      sku: skuText,
      materialId: null,
    });
  };

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const q = barcodeScan.trim().toLowerCase();
    if (!q) return;
    const match = materials.find(
      (m) =>
        (m.sku || "").toLowerCase() === q ||
        (m.masterSku || "").toLowerCase() === q ||
        (m.materialName || "").toLowerCase() === q
    );
    if (!match) {
      toast.error(`Material "${barcodeScan.trim()}" not found.`);
      return;
    }
    const gst = Number(match.gstRate) || 0;
    const halfGst = gst > 0 ? Math.round((gst / 2) * 100) / 100 : 0;
    setItems((prev) => [
      ...prev,
      computeRow({
        ...createEmptyDnItem(prev.length + 1),
        materialId: match.id,
        sku: match.sku || match.masterSku || match.materialName,
        hsnCode: match.hsnCode || "",
        qty: 1,
        unit: match.unit || "Pcs",
        rate: Number(match.materialCost) || 0,
        sgstPercent: halfGst,
        cgstPercent: halfGst,
      }),
    ]);
    setBarcodeScan("");
  };

  const handleImportInvoiceRow = (inv: MaterialPurchaseInvoice) => {
    if (!inv.items || inv.items.length === 0) return;
    const mapped = inv.items.map((it, idx) =>
      computeRow({
        itemNo: items.length + idx + 1,
        materialId: it.materialId || null,
        sku: it.sku,
        hsnCode: it.hsnCode || "",
        refInvoiceId: inv.id,
        refInvoiceNo: inv.invoiceNo,
        qty: Number(it.qty) || 0,
        unit: it.unit || "Pcs",
        rate: Number(it.rate) || 0,
        amount: 0,
        discPercent: Number(it.discPercent) || 0,
        discAmount: 0,
        taxableAmount: 0,
        sgstPercent: Number(it.sgstPercent) || 0,
        sgstAmount: 0,
        cgstPercent: Number(it.cgstPercent) || 0,
        cgstAmount: 0,
        igstPercent: Number(it.igstPercent) || 0,
        igstAmount: 0,
        netAmount: 0,
      })
    );
    setItems((prev) =>
      [...prev, ...mapped].map((r, i) => ({ ...r, itemNo: i + 1 }))
    );
    toast.success(`Added items from ${inv.invoiceNo}`);
  };

  const handleAddRow = () => {
    setItems((prev) => [...prev, createEmptyDnItem(prev.length + 1)]);
  };

  const handleDeleteRow = (idx: number) => {
    setItems((prev) =>
      prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, itemNo: i + 1 }))
    );
  };

  const handleSave = async () => {
    if (!selectedParty) {
      toast.error("Please select a Party first.");
      setIsPartyDrawerOpen(true);
      return;
    }

    const validItems = items.filter((it) => it.sku.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please add at least one Material item.");
      return;
    }

    const payload = {
      supplierId: selectedParty.id,
      supplierName: selectedParty.partyName,
      contactNo: selectedParty.phone || selectedParty.whatsapp || "",
      debitNoteNo: debitNoteNo.trim(),
      debitNoteDate,
      debitNoteType,
      invoiceType,
      preparedBy: preparedBy || getCurrentUserName() || "User",
      remarks: remarks.trim() || null,
      tdsPercent: Number(tdsPercent) || 0,
      tcsPercent: Number(tcsPercent) || 0,
      otherExpense: Number(otherExpense) || 0,
      otherExpenses,
      items: validItems.map((it, idx) => ({ ...it, itemNo: idx + 1 })),
    };

    try {
      setSaving(true);
      if (isEdit && debitNoteToEdit?.id) {
        await materialDebitNoteService.updateDebitNote(debitNoteToEdit.id, payload);
        toast.success("Material Return Debit Note updated successfully.");
      } else {
        await materialDebitNoteService.createDebitNote(payload);
        toast.success("Material Return Debit Note created successfully.");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Material Return Debit Note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Header Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
              <FileMinus2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#0A0E1A] dark:text-white">
                Debit Note [ Material &amp; Service ]
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-4 rounded-full border border-[#E7E0D2] dark:border-[#E8C16D]/30 bg-white dark:bg-[#1A160E] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#262014] transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to List</span>
            </button>

            <input
              type="text"
              value={debitNoteNo}
              onChange={(e) => setDebitNoteNo(e.target.value)}
              placeholder="DN/2026-2027/1"
              className="h-9 sm:h-10 w-36 sm:w-44 px-3 text-xs sm:text-sm font-bold bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] rounded-xl text-[#B88728] dark:text-[#E8C16D] outline-none font-mono text-center"
            />

            <div className="w-36 sm:w-40">
              <DatePicker
                allowInput
                value={debitNoteDate}
                onChange={(_, d) => setDebitNoteDate(d || todayStr)}
                placeholder="YYYY-MM-DD"
                dateFormat="yyyy-MM-dd"
                className="w-full"
                buttonClassName="w-full h-9 sm:h-10 px-2.5 rounded-xl text-xs sm:text-sm font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsPartyDrawerOpen(true)}
              className="inline-flex items-center gap-2 h-9 sm:h-10 px-4 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs sm:text-sm font-bold hover:bg-[#FFF3D6] dark:hover:bg-[#262014] cursor-pointer"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[180px]">
                {selectedParty ? selectedParty.partyName : "Select Party"}
              </span>
            </button>

            {selectedParty?.gstNumber && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
                <span className="px-2.5 h-9 inline-flex items-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 font-bold">
                  {selectedParty.gstNumber.slice(0, 2)}
                </span>
                <span className="text-slate-400">-</span>
                <span className="px-3 h-9 inline-flex items-center rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 font-semibold">
                  {selectedParty.gstNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content & Drawer Container */}
      <div className="space-y-4 relative min-h-[560px] overflow-x-clip">
        {/* Meta Row Card: Debit Note Type + Invoice Type */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Debit Note Type
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={debitNoteType}
                  onChange={setDebitNoteType}
                  options={debitNoteTypeOptions}
                  className="w-full"
                  buttonClassName="w-full h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Invoice Type
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={invoiceType}
                  onChange={setInvoiceType}
                  options={invoiceTypeOptions}
                  className="w-full"
                  buttonClassName="w-full h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Table & Bottom Panels */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm space-y-4">
          <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08]">
            <table className="w-full text-left border-collapse min-w-[1620px]">
              <thead>
                <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                  <th className="py-2.5 px-3 w-12">No.</th>
                  <th className="py-2.5 px-3 w-52 min-w-[190px]">Material.</th>
                  <th className="py-2.5 px-3 w-44">Ref Invoice No.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Qty.</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Rate.</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amount.</th>
                  <th className="py-2.5 px-3 w-20 text-right">Dis. (%)</th>
                  <th className="py-2.5 px-3 w-24 text-right">Discount ₹</th>
                  <th className="py-2.5 px-3 w-28 text-right">Taxable Amt.</th>
                  <th className="py-2.5 px-3 w-20 text-right">SGST %</th>
                  <th className="py-2.5 px-3 w-24 text-right">SGST Amt.</th>
                  <th className="py-2.5 px-3 w-20 text-right">CGST %</th>
                  <th className="py-2.5 px-3 w-24 text-right">CGST Amt.</th>
                  <th className="py-2.5 px-3 w-20 text-right">IGST %</th>
                  <th className="py-2.5 px-3 w-24 text-right">IGST Amt.</th>
                  <th className="py-2.5 px-3 w-28 text-right">Total</th>
                  <th className="py-2.5 px-3 w-12 text-center" />
                  <th className="py-2.5 px-3 w-12 text-center" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          No data available
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]">
                      <td className="py-2 px-3 font-mono text-slate-500">{row.itemNo}</td>
                      <td className="py-2 px-3">
                        <MaterialSkuDropdown
                          value={row.sku}
                          category=""
                          materials={materials}
                          onSelectMaterial={(mat) => handleSelectMaterial(idx, mat)}
                          onSelectCustom={(txt) => handleSelectCustomSku(idx, txt)}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.refInvoiceNo || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const found = supplierInvoices.find(
                              (i) => i.invoiceNo.toLowerCase() === val.trim().toLowerCase()
                            );
                            updateItem(idx, {
                              refInvoiceNo: val,
                              refInvoiceId: found?.id || null,
                            });
                          }}
                          placeholder="Ref Invoice No."
                          className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={row.qty || ""}
                          onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3 text-center font-semibold text-xs text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                        {row.unit || "—"}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={row.rate || ""}
                          onChange={(e) =>
                            updateItem(idx, { rate: Number(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                        ₹ {Number(row.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          value={row.discPercent || ""}
                          onChange={(e) =>
                            updateItem(idx, { discPercent: Number(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={row.discAmount || ""}
                          onChange={(e) =>
                            updateItem(idx, {
                              discAmount: Number(e.target.value) || 0,
                              discPercent: 0,
                            })
                          }
                          placeholder="0"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                        ₹ {Number(row.taxableAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          value={row.sgstPercent || ""}
                          onChange={(e) =>
                            updateItem(idx, { sgstPercent: Number(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        ₹ {Number(row.sgstAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          value={row.cgstPercent || ""}
                          onChange={(e) =>
                            updateItem(idx, { cgstPercent: Number(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        ₹ {Number(row.cgstAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          value={row.igstPercent || ""}
                          onChange={(e) =>
                            updateItem(idx, { igstPercent: Number(e.target.value) || 0 })
                          }
                          placeholder="0"
                          className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        ₹ {Number(row.igstAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                        ₹ {Number(row.netAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveRollIdx(idx)}
                          title="Roll / Packet Details"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            row.rollDetails && row.rollDetails.length > 0
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                          }`}
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
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

          {/* Lower Split: Left (+ Add, Scan Barcode, Purchase Invoices) & Right (Tax Summary) */}
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5 pt-1">
            <div className="space-y-4 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-xs font-bold text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>

                <div className="relative w-52">
                  <QrCode className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={barcodeScan}
                    onChange={(e) => setBarcodeScan(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Scan Barcode"
                    className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
                  />
                </div>
              </div>

              {/* Purchase Invoices Reference Box */}
              <div className="space-y-2 max-w-[960px]">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Purchase Invoices
                </p>
                <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#0B0E14]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                        <th className="py-2 px-3 w-10">No.</th>
                        <th className="py-2 px-3">Invoice No.</th>
                        <th className="py-2 px-3">Date.</th>
                        <th className="py-2 px-3 text-right">Quantity.</th>
                        <th className="py-2 px-3 text-right">Limit Amount.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {supplierInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        supplierInvoices.map((inv, i) => (
                          <tr
                            key={inv.id}
                            onClick={() => handleImportInvoiceRow(inv)}
                            title="Click to add items from this invoice"
                            className="hover:bg-[#FFF9EC]/70 dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                          >
                            <td className="py-2 px-3 font-mono text-slate-500">{i + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                              {inv.invoiceNo}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                              {formatDate(inv.invoiceDate)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              {Number(inv.totalQty || 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                              ₹ {Number(inv.balanceAmount ?? inv.netAmount ?? 0).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Tax Summary Panel */}
            <div className="w-full xl:w-[390px] shrink-0 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B0E14] p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  Gross Amount
                </span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.grossAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  Discount Amount
                </span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.discountAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">
                  Before Tax Amount
                </span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.beforeTaxAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">SGST.</span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.sgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">CGST.</span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.cgstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-semibold">IGST.</span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.igstAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.08] pt-2">
                <span className="text-slate-700 dark:text-slate-200 font-bold">
                  After Tax Amount
                </span>
                <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                  ₹ {summary.afterTaxAmount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-4 text-slate-600 dark:text-slate-300 font-semibold">
                  TDS %
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={tdsPercent || ""}
                  onChange={(e) => setTdsPercent(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="col-span-3 h-7 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-right font-mono text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                />
                <span className="col-span-5 text-right font-mono font-semibold text-slate-600 dark:text-slate-300">
                  TDS Amt: ₹ {summary.tdsAmount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-4 text-slate-600 dark:text-slate-300 font-semibold">
                  TCS %
                </span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={tcsPercent || ""}
                  onChange={(e) => setTcsPercent(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="col-span-3 h-7 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-right font-mono text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                />
                <span className="col-span-5 text-right font-mono font-semibold text-slate-600 dark:text-slate-300">
                  TCS Amt: ₹ {summary.tcsAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsOtherExpenseOpen(true)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer text-left"
                >
                  Other Expense
                </button>
                <button
                  type="button"
                  onClick={() => setIsOtherExpenseOpen(true)}
                  className="font-mono font-bold text-[#0A0E1A] dark:text-white hover:text-[#B88728] dark:hover:text-[#E8C16D] cursor-pointer"
                >
                  ₹ {Number(otherExpense || 0).toFixed(2)}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/[0.08] pt-2 text-sm">
                <span className="font-bold text-[#0A0E1A] dark:text-white">Net Amount</span>
                <span className="font-mono font-bold text-[#B88728] dark:text-[#E8C16D]">
                  ₹ {summary.netAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Remarks & Save Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 flex-1 min-w-[240px] max-w-xl">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks"
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] disabled:opacity-60 text-xs sm:text-sm font-bold text-[#0A0E1A] shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <MaterialDebitNotePartyDrawer
          isOpen={isPartyDrawerOpen}
          onClose={() => setIsPartyDrawerOpen(false)}
          parties={parties}
          loadingParties={loadingParties}
          selectedParty={selectedParty}
          onSelectParty={(p) => setSelectedPartyId(p.id)}
          onPartyCreated={(p) => {
            setParties((prev) =>
              prev.some((x) => x.id === p.id) ? prev : [p, ...prev]
            );
            setSelectedPartyId(p.id);
          }}
        />

        <OtherExpensesModal
          isOpen={isOtherExpenseOpen}
          onClose={() => setIsOtherExpenseOpen(false)}
          title="Other Expenses"
          subtitle="Manage other expenses for this debit note"
          expenses={otherExpenses}
          onSave={(expensesList, totalAmt) => {
            setOtherExpenses(expensesList);
            setOtherExpense(totalAmt);
          }}
        />

        <RollDetailsModal
          isOpen={activeRollIdx !== null}
          unit={activeRollIdx !== null ? items[activeRollIdx]?.unit || "Pcs" : "Pcs"}
          defaultRate={activeRollIdx !== null ? items[activeRollIdx]?.rate || 0 : 0}
          initialRows={
            activeRollIdx !== null ? items[activeRollIdx]?.rollDetails || [] : []
          }
          onClose={() => setActiveRollIdx(null)}
          onSave={handleSaveRollDetails}
        />
      </div>
    </div>
  );
}
