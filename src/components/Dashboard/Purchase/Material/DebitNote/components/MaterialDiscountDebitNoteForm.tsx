"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Eye, FileMinus2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { API_BASE_URL } from "@/lib/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { getCurrentUserName } from "@/utils/auth";
import MaterialSkuDropdown from "../../Order/components/MaterialSkuDropdown";
import {
  MaterialCatalogOption,
  MaterialOrderParty,
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

interface MaterialDiscountDebitNoteFormProps {
  debitNoteToEdit?: MaterialPurchaseDebitNote | null;
  initialInvoiceId?: string | null;
  onBack: () => void;
  onSaved: () => void;
}

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "URD Tax Invoice", label: "URD Tax Invoice" },
];

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
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

function createEmptyItem(itemNo: number): MaterialPurchaseDebitNoteItem {
  return {
    itemNo,
    materialId: null,
    sku: "",
    hsnCode: "",
    refInvoiceId: null,
    refInvoiceNo: "",
    qty: 0,
    unit: "Pcs",
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

export default function MaterialDiscountDebitNoteForm({
  debitNoteToEdit,
  initialInvoiceId,
  onBack,
  onSaved,
}: MaterialDiscountDebitNoteFormProps) {
  const isEdit = Boolean(debitNoteToEdit?.id);

  const [debitNoteNo, setDebitNoteNo] = useState(
    debitNoteToEdit?.debitNoteNo || "DDN/2026-2027/1"
  );
  const [debitNoteDate, setDebitNoteDate] = useState(
    debitNoteToEdit?.debitNoteDate
      ? debitNoteToEdit.debitNoteDate.split("T")[0]
      : getTodayStr()
  );
  const [invoiceType, setInvoiceType] = useState(
    debitNoteToEdit?.invoiceType || "Tax Invoice"
  );
  const [partyBillNo, setPartyBillNo] = useState(debitNoteToEdit?.partyBillNo || "");
  const [preparedBy, setPreparedBy] = useState(debitNoteToEdit?.preparedBy || "");
  const [remarks, setRemarks] = useState(debitNoteToEdit?.remarks || "");

  const [tdsPercent, setTdsPercent] = useState(debitNoteToEdit?.tdsPercent || 0);
  const [tcsPercent, setTcsPercent] = useState(debitNoteToEdit?.tcsPercent || 0);
  const [roundOff, setRoundOff] = useState(debitNoteToEdit?.roundOff || 0);
  const [roundOffValue, setRoundOffValue] = useState(
    debitNoteToEdit?.roundOffValue || 0
  );

  const [parties, setParties] = useState<MaterialOrderParty[]>([]);
  const [materials, setMaterials] = useState<MaterialCatalogOption[]>([]);
  const [companyState, setCompanyState] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    debitNoteToEdit?.supplierId || ""
  );
  const [partyDrawerOpen, setPartyDrawerOpen] = useState(false);
  const [supplierInvoices, setSupplierInvoices] = useState<MaterialPurchaseInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [items, setItems] = useState<MaterialPurchaseDebitNoteItem[]>(() => {
    if (debitNoteToEdit?.items && debitNoteToEdit.items.length > 0) {
      return debitNoteToEdit.items.map((it, idx) =>
        computeRow({
          ...it,
          itemNo: it.itemNo || idx + 1,
          unit: it.unit || "Pcs",
        })
      );
    }
    return [];
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      const userName = getCurrentUserName();
      if (userName) setPreparedBy(userName);

      materialDebitNoteService
        .getNextDebitNoteNo("Discount")
        .then((next) => setDebitNoteNo(next))
        .catch(() => {});
    }
  }, [isEdit]);

  const loadParties = async () => {
    try {
      const list = await materialOrderService.getParties();
      setParties(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadParties();
    materialOrderService
      .getMaterials()
      .then((list) => setMaterials(list))
      .catch(() => {});

    fetchWithAuth(`${API_BASE_URL}/companies`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const list = json?.data?.companies || json?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const active = list.find((c: any) => c.isDefault || c.isActive) || list[0];
          if (active?.state) setCompanyState(String(active.state));
        }
      })
      .catch(() => {});
  }, []);

  // Auto-open Party Details drawer on Create when no invoiceId is pre-selected
  useEffect(() => {
    if (!isEdit && !initialInvoiceId) {
      const t = setTimeout(() => setPartyDrawerOpen(true), 120);
      return () => clearTimeout(t);
    }
  }, [isEdit, initialInvoiceId]);

  // Fetch supplier purchase invoices whenever party changes
  useEffect(() => {
    if (!selectedPartyId) {
      setSupplierInvoices([]);
      return;
    }
    setLoadingInvoices(true);
    materialDebitNoteService
      .getSupplierInvoices(selectedPartyId)
      .then((list) => setSupplierInvoices(list))
      .catch(() => setSupplierInvoices([]))
      .finally(() => setLoadingInvoices(false));
  }, [selectedPartyId]);

  const applyInvoicesToForm = (selectedInvs: MaterialPurchaseInvoice[]) => {
    if (!selectedInvs || selectedInvs.length === 0) return;
    const first = selectedInvs[0];
    if (first.supplierId) setSelectedPartyId(first.supplierId);
    if (first.invoiceType) setInvoiceType(first.invoiceType);
    if (first.partyBillNo) setPartyBillNo(first.partyBillNo);

    const importedItems: MaterialPurchaseDebitNoteItem[] = [];
    selectedInvs.forEach((inv) => {
      (inv.items || []).forEach((it) => {
        importedItems.push(
          computeRow({
            itemNo: importedItems.length + 1,
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
            discAmount: Number(it.discAmount) || 0,
            taxableAmount: 0,
            sgstPercent: Number(it.sgstPercent) || 0,
            sgstAmount: 0,
            cgstPercent: Number(it.cgstPercent) || 0,
            cgstAmount: 0,
            igstPercent: Number(it.igstPercent) || 0,
            igstAmount: 0,
            netAmount: 0,
            rollDetails: [],
          })
        );
      });
    });

    if (importedItems.length > 0) {
      setItems(importedItems);
    }
  };

  // Pre-fill from Material Invoice when opened from Invoice action menu -> Discount Debit Note
  useEffect(() => {
    if (isEdit || !initialInvoiceId) return;
    materialInvoiceService
      .getInvoiceById(initialInvoiceId)
      .then((inv) => {
        applyInvoicesToForm([inv]);
      })
      .catch(() => {});
  }, [isEdit, initialInvoiceId]);

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId) || debitNoteToEdit?.supplier || null,
    [parties, selectedPartyId, debitNoteToEdit?.supplier]
  );

  const isInterState = useMemo(() => {
    if (!selectedParty?.state || !companyState) return false;
    return (
      selectedParty.state.trim().toLowerCase() !== companyState.trim().toLowerCase()
    );
  }, [selectedParty?.state, companyState]);

  const partyGst = selectedParty?.gstNumber || "";
  const partyStateCode = partyGst.length >= 2 ? partyGst.slice(0, 2) : "";

  const updateRow = (
    idx: number,
    patch: Partial<MaterialPurchaseDebitNoteItem>
  ) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        return computeRow({ ...row, ...patch });
      })
    );
  };

  const handleMaterialSelect = (idx: number, mat: MaterialCatalogOption) => {
    const gstRate = Number(mat.gstRate) || 0;
    const rate =
      Number(mat.materialCost ?? mat.dealerRate ?? mat.retailRate ?? mat.salesRate ?? 0) || 0;
    const isInter = isInterState;
    const half = gstRate / 2;

    updateRow(idx, {
      materialId: mat.id,
      sku: mat.sku || mat.masterSku || mat.materialName,
      hsnCode: mat.hsnCode || "",
      unit: mat.unit || "Pcs",
      rate,
      sgstPercent: isInter ? 0 : half,
      cgstPercent: isInter ? 0 : half,
      igstPercent: isInter ? gstRate : 0,
    });
  };

  const removeRow = (idx: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.map((r, i) => ({ ...r, itemNo: i + 1 }));
    });
  };

  const totals = useMemo(() => {
    const grossAmount =
      Math.round(items.reduce((s, r) => s + (r.amount || 0), 0) * 100) / 100;
    const discountAmount =
      Math.round(items.reduce((s, r) => s + (r.discAmount || 0), 0) * 100) / 100;
    const beforeTaxAmount =
      Math.round(items.reduce((s, r) => s + (r.taxableAmount || 0), 0) * 100) / 100;
    const sgstAmount =
      Math.round(items.reduce((s, r) => s + (r.sgstAmount || 0), 0) * 100) / 100;
    const cgstAmount =
      Math.round(items.reduce((s, r) => s + (r.cgstAmount || 0), 0) * 100) / 100;
    const igstAmount =
      Math.round(items.reduce((s, r) => s + (r.igstAmount || 0), 0) * 100) / 100;
    const afterTaxAmount =
      Math.round((beforeTaxAmount + sgstAmount + cgstAmount + igstAmount) * 100) /
      100;
    const tdsAmount =
      Math.round(beforeTaxAmount * ((Number(tdsPercent) || 0) / 100) * 100) / 100;
    const tcsAmount =
      Math.round(afterTaxAmount * ((Number(tcsPercent) || 0) / 100) * 100) / 100;
    const rOffVal = Number(roundOffValue) || 0;
    const netAmount =
      Math.round((afterTaxAmount - tdsAmount + tcsAmount + rOffVal) * 100) / 100;

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
  }, [items, tdsPercent, tcsPercent, roundOffValue]);

  const handleSave = async () => {
    if (!selectedPartyId && !selectedParty?.partyName) {
      toast.error("Please select a Party first.");
      setPartyDrawerOpen(true);
      return;
    }

    const validItems = items.filter((it) => it.sku && it.sku.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Please add at least one Material item.");
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        supplierId: selectedPartyId || null,
        supplierName: selectedParty?.partyName || "Supplier",
        contactNo: selectedParty?.phone || null,
        debitNoteNo,
        debitNoteDate,
        debitNoteType: "Discount",
        invoiceType,
        partyBillNo: partyBillNo.trim() || null,
        preparedBy: preparedBy || getCurrentUserName() || "User",
        remarks: remarks.trim() || null,
        tdsPercent: Number(tdsPercent) || 0,
        tcsPercent: Number(tcsPercent) || 0,
        roundOff: Number(roundOff) || 0,
        roundOffValue: Number(roundOffValue) || 0,
        items: validItems.map((it, idx) => ({
          ...it,
          itemNo: idx + 1,
        })),
      };

      if (isEdit && debitNoteToEdit?.id) {
        await materialDebitNoteService.updateDebitNote(debitNoteToEdit.id, payload);
        toast.success("Discount Debit Note updated successfully.");
      } else {
        await materialDebitNoteService.createDebitNote(payload);
        toast.success("Discount Debit Note created successfully.");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Discount Debit Note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
            <FileMinus2 className="w-5 h-5" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white tracking-tight">
            Discount Debit Note [ Material &amp; Service ]
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-4 rounded-full border border-[#E7E0D2] dark:border-[#E8C16D]/30 bg-white dark:bg-[#1A160E] text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#262014] transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to List</span>
          </button>

          <div className="h-9 px-4 inline-flex items-center rounded-full border border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold font-mono">
            {debitNoteNo}
          </div>

          <div className="w-36">
            <DatePicker
              value={debitNoteDate}
              onChange={(_, dateStr) => {
                if (dateStr) setDebitNoteDate(dateStr);
              }}
              className="w-full"
            />
          </div>

          <button
            type="button"
            onClick={() => setPartyDrawerOpen(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-xs font-semibold border border-[#E8C16D]/50 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#E8C16D]/15 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{selectedParty?.partyName || "Select Party"}</span>
          </button>
        </div>
      </div>

      {/* Content & Drawer Container */}
      <div className="space-y-4 relative min-h-[560px] overflow-x-clip">
        {/* Meta Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Invoice Type
            </span>
            <div className="w-44">
              <ThemeSelectDropdown
                value={invoiceType}
                onChange={setInvoiceType}
                options={invoiceTypeOptions}
                placeholder="Select..."
                buttonClassName="w-full justify-between h-9 px-3.5 text-xs rounded-full border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] font-semibold text-[#0A0E1A] dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Party Bill No
            </span>
            <input
              type="text"
              value={partyBillNo}
              onChange={(e) => setPartyBillNo(e.target.value)}
              placeholder="Party Bill No"
              className="w-44 h-9 px-3.5 text-xs rounded-full border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
            />
          </div>
        </div>

        {selectedParty && (
          <div className="flex items-center gap-2 text-xs font-mono">
            {partyStateCode && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 font-bold">
                {partyStateCode}
              </span>
            )}
            {partyGst && (
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300">
                {partyGst}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Items Table + Tax Summary Container */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 shadow-sm space-y-4">
        <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1320px]">
            <thead className="bg-[#FEFAEE] dark:bg-[#080B11]">
              <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                <th className="py-3 px-3 whitespace-nowrap">No.</th>
                <th className="py-3 px-3 whitespace-nowrap min-w-[190px]">Material.</th>
                <th className="py-3 px-3 whitespace-nowrap w-24">HSN Code.</th>
                <th className="py-3 px-3 whitespace-nowrap w-20 text-right">Qty.</th>
                <th className="py-3 px-3 whitespace-nowrap w-16 text-center">Unit.</th>
                <th className="py-3 px-3 whitespace-nowrap w-24 text-right">Rate.</th>
                <th className="py-3 px-3 whitespace-nowrap w-24 text-right">Amt.</th>
                <th className="py-3 px-3 whitespace-nowrap w-20 text-right">Disc %.</th>
                <th className="py-3 px-3 whitespace-nowrap w-24 text-right">Disc Amt.</th>
                <th className="py-3 px-3 whitespace-nowrap w-24 text-right">
                  Taxable Amt.
                </th>
                <th className="py-3 px-3 whitespace-nowrap w-16 text-right">SGST %.</th>
                <th className="py-3 px-3 whitespace-nowrap w-24 text-right">
                  SGST Amt.
                </th>
                <th className="py-3 px-3 whitespace-nowrap w-16 text-right">CGST %.</th>
                <th className="py-3 px-3 whitespace-nowrap w-24 text-right">
                  CGST Amt.
                </th>
                <th className="py-3 px-3 whitespace-nowrap w-16 text-right">IGST %.</th>
                <th className="py-3 px-3 whitespace-nowrap w-24 text-right">
                  IGST Amt.
                </th>
                <th className="py-3 px-3 whitespace-nowrap w-24 text-right">
                  Net Amt.
                </th>
                <th className="py-3 px-3 whitespace-nowrap w-12 text-center">Del.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={18} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No data available
                      </p>
                      <p className="text-xs text-slate-400">
                        Select a Party and import Invoices to add items.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]">
                  <td className="py-2.5 px-2 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <MaterialSkuDropdown
                      value={row.sku}
                      category=""
                      materials={materials}
                      onSelectMaterial={(mat) => handleMaterialSelect(idx, mat)}
                      onSelectCustom={(skuText) => updateRow(idx, { sku: skuText })}
                    />
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={row.hsnCode || ""}
                      onChange={(e) => updateRow(idx, { hsnCode: e.target.value })}
                      placeholder="HSN"
                      className="w-full h-8 px-2 text-xs rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.qty}
                      onChange={(e) =>
                        updateRow(idx, { qty: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-300 font-semibold">
                    {row.unit || "Pcs"}
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.rate}
                      onChange={(e) =>
                        updateRow(idx, { rate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    ₹ {Number(row.amount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.discPercent}
                      onChange={(e) =>
                        updateRow(idx, {
                          discPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.discAmount}
                      onChange={(e) =>
                        updateRow(idx, {
                          discPercent: 0,
                          discAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    ₹ {Number(row.taxableAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.sgstPercent}
                      onChange={(e) =>
                        updateRow(idx, {
                          sgstPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    ₹ {Number(row.sgstAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.cgstPercent}
                      onChange={(e) =>
                        updateRow(idx, {
                          cgstPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    ₹ {Number(row.cgstAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.igstPercent}
                      onChange={(e) =>
                        updateRow(idx, {
                          igstPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-8 px-2 text-xs text-right font-mono rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    ₹ {Number(row.igstAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                    ₹ {Number(row.netAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="grid h-7 w-7 mx-auto place-items-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete Row"
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

        {/* Summary Panel */}
        <div className="flex justify-end pt-2">
          <div className="w-full lg:w-[340px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFFDF8] dark:bg-[#080B11] p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Gross Amount
              </span>
              <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                ₹ {totals.grossAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Discount Amount
              </span>
              <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                ₹ {totals.discountAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Before Tax Amount
              </span>
              <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                ₹ {totals.beforeTaxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                SGST
              </span>
              <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                ₹ {totals.sgstAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                CGST
              </span>
              <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                ₹ {totals.cgstAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                IGST
              </span>
              <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                ₹ {totals.igstAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-white/[0.08]">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                After Tax Amount
              </span>
              <span className="font-mono font-bold text-[#0A0E1A] dark:text-white">
                ₹ {totals.afterTaxAmount.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_72px_118px] items-center gap-2 pt-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                TDS %
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={tdsPercent}
                onChange={(e) => setTdsPercent(parseFloat(e.target.value) || 0)}
                className="w-full h-7 px-2 text-right font-mono text-xs rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
              <span className="font-mono text-slate-500 text-right whitespace-nowrap">
                TDS Amt: ₹ {totals.tdsAmount.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_72px_118px] items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                TCS %
              </span>
              <input
                type="number"
                min={0}
                step="any"
                value={tcsPercent}
                onChange={(e) => setTcsPercent(parseFloat(e.target.value) || 0)}
                className="w-full h-7 px-2 text-right font-mono text-xs rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
              <span className="font-mono text-slate-500 text-right whitespace-nowrap">
                TCS Amt: ₹ {totals.tcsAmount.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_72px_118px] items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Round Off
              </span>
              <input
                type="number"
                step="any"
                value={roundOff}
                onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                className="w-full h-7 px-2 text-right font-mono text-xs rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
              <div className="flex items-center justify-end gap-1.5">
                <span className="font-mono text-slate-500">₹</span>
                <input
                  type="number"
                  step="any"
                  value={roundOffValue}
                  onChange={(e) =>
                    setRoundOffValue(parseFloat(e.target.value) || 0)
                  }
                  className="w-20 h-7 px-2 text-right font-mono text-xs rounded-lg border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E7E0D2] dark:border-white/[0.1]">
              <span className="font-bold text-[#0A0E1A] dark:text-white">
                Net Amount
              </span>
              <span className="font-mono text-sm font-extrabold text-[#B88728] dark:text-[#E8C16D]">
                ₹ {totals.netAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Remarks & Save Bar */}
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-5 py-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="w-24 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            Remarks
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter any remarks or notes here."
            className="w-full max-w-xl h-9 px-3.5 text-xs rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="w-24 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              Prepared By
            </label>
            <input
              type="text"
              readOnly
              value={preparedBy || "User"}
              className="w-44 h-9 px-3.5 text-xs font-semibold rounded-xl border border-[#E7E0D2] dark:border-white/[0.1] bg-slate-50 dark:bg-[#080B11] text-slate-700 dark:text-slate-200 outline-none cursor-default"
            />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 h-9 px-6 rounded-xl text-xs font-bold bg-[#E8C16D] hover:bg-[#d9b25e] text-[#0A0E1A] shadow-sm transition disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
      </div>

      {/* Party Details Slide-Over Drawer */}
      <MaterialDebitNotePartyDrawer
        isOpen={partyDrawerOpen}
        onClose={() => setPartyDrawerOpen(false)}
        parties={parties}
        loadingParties={false}
        selectedParty={selectedParty}
        onSelectParty={(party) => {
          setSelectedPartyId(party.id);
        }}
        onPartyCreated={() => loadParties()}
        invoices={supplierInvoices}
        loadingInvoices={loadingInvoices}
        onImportInvoices={(chosenInvs) => {
          applyInvoicesToForm(chosenInvs);
          toast.success(
            `Imported items from ${chosenInvs.map((i) => i.invoiceNo).join(", ")}`
          );
        }}
      />
      </div>
    </div>
  );
}
