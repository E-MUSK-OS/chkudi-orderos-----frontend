"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ClipboardList, Eye, ReceiptText, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { getCurrentUserName } from "@/utils/auth";
import OtherExpensesModal, {
  OtherExpenseItem,
} from "@/components/Dashboard/common/OtherExpensesModal";
import {
  MaterialCatalogOption,
  MaterialOrderParty,
} from "../../Order/types/materialOrder.types";
import { materialOrderService } from "../../Order/services/materialOrder.service";
import MaterialInvoicePartyDrawer from "./MaterialInvoicePartyDrawer";
import {
  MaterialPurchaseInvoice,
  MaterialPurchaseInvoiceItem,
  PendingMaterialChallan,
} from "../types/materialInvoice.types";
import { materialInvoiceService } from "../services/materialInvoice.service";

interface MaterialInvoiceFormProps {
  invoiceToEdit?: MaterialPurchaseInvoice | null;
  onBack: () => void;
  onSaved: () => void;
}

const invoiceTypeOptions: ThemeSelectOption[] = [
  { value: "Tax Invoice", label: "Tax Invoice" },
  { value: "Bill of Supply", label: "Bill of Supply" },
  { value: "Retail Invoice", label: "Retail Invoice" },
  { value: "Proforma Invoice", label: "Proforma Invoice" },
];

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function computeRow(row: MaterialPurchaseInvoiceItem): MaterialPurchaseInvoiceItem {
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

function createEmptyInvoiceItem(itemNo: number): MaterialPurchaseInvoiceItem {
  return {
    itemNo,
    challanId: null,
    challanNo: null,
    materialId: null,
    sku: "",
    partySku: "",
    hsnCode: "",
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
  };
}

export default function MaterialInvoiceForm({
  invoiceToEdit,
  onBack,
  onSaved,
}: MaterialInvoiceFormProps) {
  const todayStr = getTodayStr();
  const isEdit = Boolean(invoiceToEdit?.id);

  const [invoiceNo, setInvoiceNo] = useState(invoiceToEdit?.invoiceNo || "");
  const [invoiceDate, setInvoiceDate] = useState(
    invoiceToEdit?.invoiceDate ? invoiceToEdit.invoiceDate.split("T")[0] : todayStr
  );
  const [invoiceType, setInvoiceType] = useState(
    invoiceToEdit?.invoiceType || "Tax Invoice"
  );
  const [partyBillNo, setPartyBillNo] = useState(invoiceToEdit?.partyBillNo || "");
  const [partyChallanNo, setPartyChallanNo] = useState(
    invoiceToEdit?.partyChallanNo || ""
  );

  const [brokerName, setBrokerName] = useState(invoiceToEdit?.brokerName || "");
  const [consigneeName, setConsigneeName] = useState(invoiceToEdit?.consigneeName || "");
  const [remarks, setRemarks] = useState(invoiceToEdit?.remarks || "");
  const [preparedBy, setPreparedBy] = useState(
    invoiceToEdit?.preparedBy || getCurrentUserName() || "User"
  );

  const [tdsPercent, setTdsPercent] = useState<number>(invoiceToEdit?.tdsPercent || 0);
  const [tcsPercent, setTcsPercent] = useState<number>(invoiceToEdit?.tcsPercent || 0);
  const [otherExpense, setOtherExpense] = useState<number>(
    invoiceToEdit?.otherExpense || 0
  );
  const [otherExpenses, setOtherExpenses] = useState<OtherExpenseItem[]>(
    Array.isArray(invoiceToEdit?.otherExpenses) ? invoiceToEdit.otherExpenses : []
  );
  const [isOtherExpenseOpen, setIsOtherExpenseOpen] = useState(false);
  const [roundOff, setRoundOff] = useState<number>(invoiceToEdit?.roundOff || 0);

  const [parties, setParties] = useState<MaterialOrderParty[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [materials, setMaterials] = useState<MaterialCatalogOption[]>([]);
  const [brokers, setBrokers] = useState<string[]>([]);

  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    invoiceToEdit?.supplierId || ""
  );
  const [isPartyDrawerOpen, setIsPartyDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      const timer = setTimeout(() => setIsPartyDrawerOpen(true), 80);
      return () => clearTimeout(timer);
    }
  }, [isEdit]);

  const [items, setItems] = useState<MaterialPurchaseInvoiceItem[]>(() => {
    if (invoiceToEdit?.items && invoiceToEdit.items.length > 0) {
      return invoiceToEdit.items.map((it, idx) =>
        computeRow({
          id: it.id,
          itemNo: it.itemNo || idx + 1,
          challanId: it.challanId || null,
          challanNo: it.challanNo || null,
          materialId: it.materialId || null,
          sku: it.sku || "",
          partySku: it.partySku || "",
          hsnCode: it.hsnCode || "",
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
        })
      );
    }
    return [];
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    if (!isEdit) {
      materialInvoiceService
        .getNextInvoiceNo()
        .then((no) => {
          if (active) setInvoiceNo(no);
        })
        .catch(() => {
          if (active) setInvoiceNo("PI/2026-2027/1");
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

    materialInvoiceService
      .getBrokers()
      .then((list) => {
        if (active) setBrokers(list);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isEdit]);

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId) || invoiceToEdit?.supplier || null,
    [parties, selectedPartyId, invoiceToEdit]
  );

  const brokerOptions: ThemeSelectOption[] = useMemo(() => {
    const unique = Array.from(new Set(brokers.filter(Boolean)));
    return [
      { value: "", label: "Select Agent / Broker" },
      ...unique.map((b) => ({ value: b, label: b })),
    ];
  }, [brokers]);

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
    const roundOffValue = Number(roundOff) || 0;
    const netAmount =
      Math.round(
        (afterTaxAmount - tdsAmount + tcsAmount + (Number(otherExpense) || 0) + roundOffValue) *
          100
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
      roundOffValue,
      netAmount,
    };
  }, [items, tdsPercent, tcsPercent, otherExpense, roundOff]);

  const updateItem = (idx: number, patch: Partial<MaterialPurchaseInvoiceItem>) => {
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? computeRow({ ...row, ...patch }) : row))
    );
  };

  const handleSelectMaterial = (idx: number, mat: MaterialCatalogOption) => {
    const skuVal = mat.sku || mat.masterSku || mat.materialName;
    const gst = Number(mat.gstRate) || 0;
    const halfGst = gst > 0 ? Math.round((gst / 2) * 100) / 100 : 0;
    updateItem(idx, {
      sku: skuVal,
      materialId: mat.id,
      hsnCode: mat.hsnCode || items[idx]?.hsnCode || "",
      unit: mat.unit || items[idx]?.unit || "",
      rate: mat.materialCost !== undefined ? Number(mat.materialCost) : 0,
      sgstPercent: halfGst,
      cgstPercent: halfGst,
      igstPercent: 0,
    });
  };

  const handleSelectCustomSku = (idx: number, skuText: string) => {
    updateItem(idx, {
      sku: skuText,
      materialId: null,
    });
  };

  const handleSyncPendingChallans = (challans: PendingMaterialChallan[]) => {
    const selectedIdsSet = new Set(challans.map((c) => c.id));
    const challanNos: string[] = [];

    for (const ch of challans) {
      if (ch.partyChallanNo) challanNos.push(ch.partyChallanNo);
      else if (ch.challanNo) challanNos.push(ch.challanNo);
    }

    setPartyChallanNo(
      challanNos.length > 0 ? Array.from(new Set(challanNos)).join(", ") : ""
    );

    setItems((prev) => {
      // Keep any existing items belonging to still-selected challans (preserving user edits like rate/disc/GST)
      const kept = prev.filter(
        (r) => r.challanId && selectedIdsSet.has(r.challanId)
      );
      const keptChallanIds = new Set(kept.map((r) => r.challanId).filter(Boolean));

      const added: MaterialPurchaseInvoiceItem[] = [];
      for (const ch of challans) {
        if (keptChallanIds.has(ch.id)) continue;
        for (const it of ch.items || []) {
          const matchedMat = materials.find(
            (m) =>
              (it.materialId && m.id === it.materialId) ||
              (it.sku &&
                ((m.sku || "").toLowerCase() === it.sku.toLowerCase() ||
                  (m.masterSku || "").toLowerCase() === it.sku.toLowerCase()))
          );
          const gst = Number(matchedMat?.gstRate) || 0;
          const halfGst = gst > 0 ? Math.round((gst / 2) * 100) / 100 : 0;

          added.push(
            computeRow({
              itemNo: 0,
              challanId: ch.id,
              challanNo: ch.challanNo,
              materialId: it.materialId || matchedMat?.id || null,
              sku: it.sku,
              partySku: it.partySku || "",
              hsnCode: matchedMat?.hsnCode || "",
              qty: Number(it.realQty || it.receivedQty) || 0,
              unit: it.unit || matchedMat?.unit || "Pcs",
              rate: Number(it.rate) || 0,
              amount: 0,
              discPercent: 0,
              discAmount: 0,
              taxableAmount: 0,
              sgstPercent: halfGst,
              sgstAmount: 0,
              cgstPercent: halfGst,
              cgstAmount: 0,
              igstPercent: 0,
              igstAmount: 0,
              netAmount: 0,
            })
          );
        }
      }

      return [...kept, ...added].map((r, i) => ({ ...r, itemNo: i + 1 }));
    });
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

    const challanIds = Array.from(
      new Set(validItems.map((it) => it.challanId).filter(Boolean))
    );

    const payload = {
      supplierId: selectedParty.id,
      supplierName: selectedParty.partyName,
      contactNo: selectedParty.phone || selectedParty.whatsapp || "",
      invoiceNo: invoiceNo.trim(),
      invoiceDate,
      invoiceType,
      partyBillNo: partyBillNo.trim() || null,
      partyChallanNo: partyChallanNo.trim() || null,
      challanIds,
      brokerName: brokerName.trim() || null,
      consigneeName: consigneeName.trim() || null,
      preparedBy: preparedBy.trim() || getCurrentUserName() || "User",
      remarks: remarks.trim() || null,
      tdsPercent: Number(tdsPercent) || 0,
      tcsPercent: Number(tcsPercent) || 0,
      otherExpense: Number(otherExpense) || 0,
      otherExpenses,
      roundOff: Number(roundOff) || 0,
      roundOffValue: Number(roundOff) || 0,
      items: validItems.map((it, idx) => ({ ...it, itemNo: idx + 1 })),
    };

    try {
      setSaving(true);
      if (isEdit && invoiceToEdit?.id) {
        await materialInvoiceService.updateInvoice(invoiceToEdit.id, payload);
        toast.success("Material Purchase Invoice updated successfully.");
      } else {
        await materialInvoiceService.createInvoice(payload);
        toast.success("Material Purchase Invoice created successfully.");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Material Purchase Invoice");
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
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#0A0E1A] dark:text-white">
                Invoice [ Purchase Material &amp; Service ]
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
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="PI/2026-2027/1"
              className="h-9 sm:h-10 w-36 sm:w-44 px-3 text-xs sm:text-sm font-bold bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] rounded-xl text-[#B88728] dark:text-[#E8C16D] outline-none font-mono text-center"
            />

            <div className="w-36 sm:w-40">
              <DatePicker
                allowInput
                value={invoiceDate}
                onChange={(_, d) => setInvoiceDate(d || todayStr)}
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
        {/* Meta Row Card: Invoice Type + Party Bill No + Party Challan No */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Invoice Type
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={invoiceType}
                  onChange={setInvoiceType}
                  options={invoiceTypeOptions}
                  placeholder="Select Invoice Type"
                  className="w-full"
                  buttonClassName="w-full h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Party Bill No
              </label>
              <input
                type="text"
                value={partyBillNo}
                onChange={(e) => setPartyBillNo(e.target.value)}
                placeholder="Party Bill No"
                className="flex-1 min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Items Table & Tax Summary Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm space-y-4">
          <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08]">
            <table className="w-full text-left border-collapse min-w-[1380px]">
              <thead>
                <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                  <th className="py-2.5 px-3 w-12">No.</th>
                  <th className="py-2.5 px-3 w-52 min-w-[190px]">Material.</th>
                  <th className="py-2.5 px-3 w-28">HSN Code.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Qty.</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Rate.</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amt.</th>
                  <th className="py-2.5 px-3 w-20 text-right">Disc %.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Disc Amt.</th>
                  <th className="py-2.5 px-3 w-28 text-right">Taxable Amt.</th>
                  <th className="py-2.5 px-3 w-20 text-right">SGST %.</th>
                  <th className="py-2.5 px-3 w-24 text-right">SGST Amt.</th>
                  <th className="py-2.5 px-3 w-20 text-right">CGST %.</th>
                  <th className="py-2.5 px-3 w-24 text-right">CGST Amt.</th>
                  <th className="py-2.5 px-3 w-28 text-right">Net Amt.</th>
                  <th className="py-2.5 px-3 w-12 text-center">Del.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                          <ClipboardList className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          No data available
                        </p>
                        <p className="text-xs text-slate-400">
                          Select a Party and import Pending Challans to add items.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]">
                      <td className="py-2 px-3 font-mono text-slate-500">{row.itemNo}</td>
                      <td className="py-2 px-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-[#0A0E1A] dark:text-white truncate">
                            {row.sku}
                          </div>
                          {row.challanNo && (
                            <div className="text-[11px] font-mono text-slate-400 truncate">
                              {row.challanNo}
                            </div>
                          )}
                        </div>
                      </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.hsnCode || ""}
                        onChange={(e) => updateItem(idx, { hsnCode: e.target.value })}
                        placeholder="HSN"
                        className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
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
                        onChange={(e) => updateItem(idx, { rate: Number(e.target.value) || 0 })}
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
                    <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      ₹ {Number(row.discAmount || 0).toFixed(2)}
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
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                      ₹ {Number(row.netAmount || 0).toFixed(2)}
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

          <div className="flex flex-col lg:flex-row lg:items-start justify-end gap-4 pt-1">

            {/* Totals & Tax Breakdown matching screenshot */}
            <div className="w-full lg:w-[440px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B0E14] p-4 space-y-2 text-xs">
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

              <div className="grid grid-cols-12 items-center gap-2">
                <span className="col-span-4 text-blue-600 dark:text-blue-400 font-semibold">
                  Round Off
                </span>
                <input
                  type="number"
                  step="any"
                  value={roundOff || ""}
                  onChange={(e) => setRoundOff(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="col-span-3 h-7 px-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-right font-mono text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                />
                <span className="col-span-5 text-right font-mono font-semibold text-slate-600 dark:text-slate-300">
                  Value: ₹ {summary.roundOffValue.toFixed(2)}
                </span>
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

        {/* Bottom Metadata & Save Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Broker Name
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={brokerName}
                  onChange={setBrokerName}
                  options={brokerOptions}
                  placeholder="Select Agent / Broker"
                  className="w-full"
                  buttonClassName="w-full h-9 px-3 text-xs rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Consignee Name
              </label>
              <input
                type="text"
                value={consigneeName}
                onChange={(e) => setConsigneeName(e.target.value)}
                placeholder="Enter consignee name"
                className="flex-1 min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any remarks or notes here."
                className="flex-1 min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Prepared By
              </label>
              <input
                type="text"
                value={preparedBy}
                readOnly
                className="h-9 w-36 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white outline-none cursor-not-allowed opacity-80"
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

        {/* Party Details & Pending Challans Slide-Over Drawer */}
        <MaterialInvoicePartyDrawer
          isOpen={isPartyDrawerOpen}
          onClose={() => setIsPartyDrawerOpen(false)}
          parties={parties}
          loadingParties={loadingParties}
          selectedParty={selectedParty}
          linkedChallanIds={Array.from(
            new Set(items.map((r) => r.challanId).filter((id): id is string => Boolean(id)))
          )}
          onSelectParty={(p) => setSelectedPartyId(p.id)}
          onPartyCreated={(p) => {
            setParties((prev) =>
              prev.some((x) => x.id === p.id) ? prev : [p, ...prev]
            );
            setSelectedPartyId(p.id);
          }}
          onSyncPendingChallans={handleSyncPendingChallans}
        />

        {/* Other Expenses Modal */}
        <OtherExpensesModal
          isOpen={isOtherExpenseOpen}
          onClose={() => setIsOtherExpenseOpen(false)}
          title="Other Expenses"
          subtitle="Manage other expenses for this purchase invoice"
          expenses={otherExpenses}
          onSave={(expensesList, totalAmt) => {
            setOtherExpenses(expensesList);
            setOtherExpense(totalAmt);
          }}
        />
      </div>
    </div>
  );
}
