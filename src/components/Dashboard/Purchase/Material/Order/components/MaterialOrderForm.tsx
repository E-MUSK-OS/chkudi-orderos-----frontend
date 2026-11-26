"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Eye,
  Plus,
  Save,
  Trash2,
  ClipboardList,
  List,
} from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { getCurrentUserName } from "@/utils/auth";
import MaterialPartyDetailsDrawer from "./MaterialPartyDetailsDrawer";
import MaterialSkuDropdown from "./MaterialSkuDropdown";
import RollDetailsModal from "./RollDetailsModal";
import {
  MaterialCatalogOption,
  MaterialOrderParty,
  MaterialPurchaseOrder,
  MaterialPurchaseOrderItem,
  MaterialRollDetail,
} from "../types/materialOrder.types";
import { materialOrderService } from "../services/materialOrder.service";

interface MaterialOrderFormProps {
  orderToEdit?: MaterialPurchaseOrder | null;
  onBack: () => void;
  onSaved: () => void;
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function addDaysToDateStr(baseDateStr: string, days: number): string {
  const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
  if (isNaN(base.getTime())) return getTodayStr();
  const next = new Date(base);
  next.setDate(next.getDate() + (Number(days) || 0));
  return next.toISOString().split("T")[0];
}

function diffDaysBetween(fromStr: string, toStr: string): number {
  if (!fromStr || !toStr) return 0;
  const a = new Date(`${fromStr}T00:00:00`);
  const b = new Date(`${toStr}T00:00:00`);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

function createEmptyItem(itemNo: number): MaterialPurchaseOrderItem {
  return {
    itemNo,
    category: "",
    materialId: null,
    sku: "",
    partySku: "",
    detail: "",
    orderedQty: 0,
    unit: "",
    refNo: "",
    rate: 0,
    amount: 0,
  };
}

export default function MaterialOrderForm({
  orderToEdit,
  onBack,
  onSaved,
}: MaterialOrderFormProps) {
  const todayStr = getTodayStr();
  const isEdit = Boolean(orderToEdit?.id);

  const [orderNo, setOrderNo] = useState(orderToEdit?.orderNo || "");
  const [orderDate, setOrderDate] = useState(
    orderToEdit?.orderDate ? orderToEdit.orderDate.split("T")[0] : todayStr
  );
  const [remarks, setRemarks] = useState(orderToEdit?.remarks || "");
  const [expRequiredDays, setExpRequiredDays] = useState<number>(
    orderToEdit?.expRequiredDays || 0
  );
  const [expRequiredDate, setExpRequiredDate] = useState(
    orderToEdit?.expRequiredDate ? orderToEdit.expRequiredDate.split("T")[0] : todayStr
  );
  const [preparedBy, setPreparedBy] = useState(
    orderToEdit?.preparedBy || getCurrentUserName() || "User"
  );
  const [poDays, setPoDays] = useState<number>(orderToEdit?.poDays || 0);

  const [parties, setParties] = useState<MaterialOrderParty[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [materials, setMaterials] = useState<MaterialCatalogOption[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    orderToEdit?.supplierId || ""
  );
  const [isPartyDrawerOpen, setIsPartyDrawerOpen] = useState(false);

  useEffect(() => {
    if (isEdit) return;
    const timer = setTimeout(() => {
      setIsPartyDrawerOpen(true);
    }, 60);
    return () => clearTimeout(timer);
  }, [isEdit]);

  const [items, setItems] = useState<MaterialPurchaseOrderItem[]>(() => {
    if (orderToEdit?.items && orderToEdit.items.length > 0) {
      return orderToEdit.items.map((it, idx) => ({
        id: it.id,
        itemNo: it.itemNo || idx + 1,
        category: it.category || "Material",
        materialId: it.materialId || null,
        sku: it.sku || "",
        partySku: it.partySku || "",
        detail: it.detail || "",
        orderedQty: Number(it.orderedQty) || 0,
        unit: it.unit || "PCS",
        refNo: it.refNo || "",
        rate: Number(it.rate) || 0,
        amount: Number(it.amount) || 0,
        rollDetails: Array.isArray(it.rollDetails) ? it.rollDetails : [],
      }));
    }
    return [createEmptyItem(1)];
  });

  const [rollModalIndex, setRollModalIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const categoryOptions: ThemeSelectOption[] = useMemo(() => {
    const fromMaterials = materials.map((m) => (m.category || "").trim()).filter(Boolean);
    const merged = Array.from(new Set([...fromMaterials, ...catalogCategories]));
    return merged.map((c) => ({ value: c, label: c }));
  }, [materials, catalogCategories]);

  useEffect(() => {
    if (!orderToEdit?.preparedBy) {
      setPreparedBy(getCurrentUserName() || "User");
    }
  }, [orderToEdit]);

  useEffect(() => {
    let active = true;

    if (!isEdit) {
      materialOrderService
        .getNextOrderNo()
        .then((nextNo) => {
          if (active && nextNo) setOrderNo(nextNo);
        })
        .catch((err) => console.error("Failed to fetch next order no", err));
    }

    setLoadingParties(true);
    materialOrderService
      .getParties()
      .then((partyList) => {
        if (active) setParties(partyList);
      })
      .catch((err) => console.error("Failed to fetch parties", err))
      .finally(() => {
        if (active) setLoadingParties(false);
      });

    materialOrderService
      .getMaterials()
      .then((matList) => {
        if (active) setMaterials(matList);
      })
      .catch((err) => console.error("Failed to fetch materials", err));

    materialOrderService
      .getMaterialDropdownOptions()
      .then((opts) => {
        if (!active) return;
        setCatalogCategories(opts.categories);
      })
      .catch((err) => console.error("Failed to fetch material dropdown options", err));

    return () => {
      active = false;
    };
  }, [isEdit]);

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId) || orderToEdit?.supplier || null,
    [parties, selectedPartyId, orderToEdit]
  );

  const partyOptions: ThemeSelectOption[] = useMemo(
    () => [
      { value: "", label: "Select..." },
      ...parties.map((p) => ({ value: p.id, label: p.partyName })),
    ],
    [parties]
  );

  const totalOrderQty = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.orderedQty) || 0), 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [items]
  );

  const handleOrderDateChange = (dateStr: string) => {
    const nextDate = dateStr || todayStr;
    setOrderDate(nextDate);
    setPoDays(diffDaysBetween(nextDate, todayStr));
    if (expRequiredDays > 0) {
      setExpRequiredDate(addDaysToDateStr(nextDate, expRequiredDays));
    }
  };

  const handleExpDaysChange = (val: number) => {
    const days = Math.max(0, Number(val) || 0);
    setExpRequiredDays(days);
    setExpRequiredDate(addDaysToDateStr(orderDate, days));
  };

  const handleExpDateChange = (dateStr: string) => {
    const target = dateStr || todayStr;
    setExpRequiredDate(target);
    setExpRequiredDays(diffDaysBetween(orderDate, target));
  };

  const updateItem = (idx: number, patch: Partial<MaterialPurchaseOrderItem>) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        const updated = { ...row, ...patch };
        updated.amount =
          Math.round((Number(updated.orderedQty) || 0) * (Number(updated.rate) || 0) * 100) / 100;
        return updated;
      })
    );
  };

  const handleSelectMaterial = (idx: number, matched: MaterialCatalogOption) => {
    const skuVal = matched.sku || matched.masterSku || matched.materialName;
    updateItem(idx, {
      sku: skuVal,
      partySku: skuVal,
      materialId: matched.id,
      category: matched.category || items[idx]?.category || "",
      unit: matched.unit || items[idx]?.unit || "",
      rate: matched.materialCost !== undefined ? Number(matched.materialCost) : 0,
    });
  };

  const handleSelectCustomSku = (idx: number, skuText: string) => {
    updateItem(idx, {
      sku: skuText,
      partySku: items[idx]?.partySku || skuText,
      materialId: null,
    });
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, createEmptyItem(prev.length + 1)]);
  };

  const removeItemRow = (idx: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return [createEmptyItem(1)];
      return prev
        .filter((_, i) => i !== idx)
        .map((row, i) => ({ ...row, itemNo: i + 1 }));
    });
  };

  const handleSave = async () => {
    if (!selectedParty && !orderToEdit?.supplierName) {
      toast.error("Please select a Party before saving.");
      setIsPartyDrawerOpen(true);
      return;
    }
    const validItems = items.filter((it) => it.sku.trim() && (Number(it.orderedQty) || 0) > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with SKU and Order Qty > 0.");
      return;
    }

    const partyAddress = selectedParty
      ? [selectedParty.addressLine1, selectedParty.city, selectedParty.state, selectedParty.pincode]
          .filter(Boolean)
          .join(", ")
      : orderToEdit?.partyAddress || "";

    const payload = {
      orderNo: orderNo.trim(),
      orderDate,
      supplierId: selectedParty?.id || orderToEdit?.supplierId || null,
      supplierName: selectedParty?.partyName || orderToEdit?.supplierName || "Direct Supplier",
      contactNo: selectedParty?.phone || selectedParty?.whatsapp || orderToEdit?.contactNo || null,
      partyGstn: selectedParty?.gstNumber || orderToEdit?.partyGstn || null,
      partyAddress: partyAddress || null,
      remarks: remarks.trim() || null,
      expRequiredDays,
      expRequiredDate,
      poDays,
      preparedBy,
      items: validItems.map((it, idx) => ({
        ...it,
        itemNo: idx + 1,
      })),
    };

    try {
      setSaving(true);
      if (isEdit && orderToEdit?.id) {
        await materialOrderService.updateOrder(orderToEdit.id, payload);
        toast.success("Material Purchase Order updated successfully.");
      } else {
        await materialOrderService.createOrder(payload);
        toast.success("Material Purchase Order created successfully.");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Material Purchase Order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans relative">
      {/* Top Header Bar matching screenshots */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
                Order [ Purchase Material &amp; Service ]
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
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
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="PO/2026-2027/1"
              className="h-9 sm:h-10 w-36 sm:w-44 px-3 text-xs sm:text-sm font-bold bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] rounded-xl text-[#B88728] dark:text-[#E8C16D] outline-none font-mono text-center"
            />
            <div className="w-36 sm:w-40">
              <DatePicker
                allowInput
                value={orderDate}
                onChange={(_, d) => handleOrderDateChange(d || todayStr)}
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
          </div>
        </div>
      </div>

      {/* Content & Drawer Container - Scoped below Header */}
      <div className="space-y-4 relative min-h-[540px] overflow-x-clip">
      {/* Items Table Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm space-y-4">
        <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08]">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-[#FFF9EC] dark:bg-[#141A29] border-b border-[#E7E0D2] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                <th className="py-2.5 px-3 w-12">No.</th>
                <th className="py-2.5 px-3 w-36">Category</th>
                <th className="py-2.5 px-3 w-56 min-w-[210px]">Material / Service SKU.</th>
                <th className="py-2.5 px-3 w-56 min-w-[210px]">Party SKU.</th>
                <th className="py-2.5 px-3 w-16 text-center">Detail.</th>
                <th className="py-2.5 px-3 w-28 text-right">Order Qty.</th>
                <th className="py-2.5 px-3 w-24 text-center">Unit.</th>
                <th className="py-2.5 px-3 w-32">Ref No.</th>
                <th className="py-2.5 px-3 w-28 text-right">Rate.</th>
                <th className="py-2.5 px-3 w-28 text-right">Amount.</th>
                <th className="py-2.5 px-3 w-12 text-center">Del.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    <ClipboardList className="w-6 h-6 mx-auto mb-1 opacity-60" />
                    No data available
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-mono text-slate-500">{row.itemNo}</td>
                    <td className="py-2 px-3">
                      <ThemeSelectDropdown
                        usePortal
                        value={row.category}
                        onChange={(val) => updateItem(idx, { category: val })}
                        options={categoryOptions}
                        placeholder="Category"
                        className="w-full"
                        buttonClassName="w-full h-8 px-2.5 text-xs rounded-lg border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <MaterialSkuDropdown
                        value={row.sku}
                        category={row.category}
                        materials={materials}
                        onSelectMaterial={(mat) => handleSelectMaterial(idx, mat)}
                        onSelectCustom={(txt) => handleSelectCustomSku(idx, txt)}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.partySku || ""}
                        onChange={(e) => updateItem(idx, { partySku: e.target.value })}
                        placeholder="Party SKU"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setRollModalIndex(idx)}
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border transition-colors cursor-pointer ${
                          row.rollDetails && row.rollDetails.length > 0
                            ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D]"
                            : "border-red-200 dark:border-red-500/30 bg-red-50/60 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20"
                        }`}
                        title="Roll Details"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.orderedQty || ""}
                        onChange={(e) =>
                          updateItem(idx, { orderedQty: Number(e.target.value) || 0 })
                        }
                        placeholder="0"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-xs text-slate-600 dark:text-slate-300 uppercase whitespace-nowrap">
                      {row.unit || "—"}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={row.refNo || ""}
                        onChange={(e) => updateItem(idx, { refNo: e.target.value })}
                        placeholder="Ref No"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.rate || ""}
                        onChange={(e) => updateItem(idx, { rate: Number(e.target.value) || 0 })}
                        placeholder="0"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                      ₹ {Number(row.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                        title="Remove row"
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

        {/* + Add & Totals Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={addItemRow}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] text-xs font-bold hover:bg-[#FFF3D6] dark:hover:bg-[#262014] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>

          <div className="flex flex-wrap items-center gap-5 text-xs whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Qty:</span>
              <span className="font-mono font-bold text-sm text-[#0A0E1A] dark:text-white">
                {totalOrderQty}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">Total:</span>
              <span className="font-mono font-bold text-sm text-[#B88728] dark:text-[#E8C16D]">
                ₹ {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Remarks, Dates & Save Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center text-xs">
          <div className="sm:col-span-2 lg:col-span-5 flex items-center gap-2 min-w-0">
            <label className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
              Remarks.
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Write remarks"
              className="w-full min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
            />
          </div>

          <div className="lg:col-span-3 flex items-center gap-2 min-w-0">
            <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
              Exp. Required Days
            </label>
            <input
              type="number"
              min={0}
              value={expRequiredDays}
              onChange={(e) => handleExpDaysChange(Number(e.target.value))}
              className="w-full min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono text-right text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
            />
          </div>

          <div className="lg:col-span-4 flex items-center gap-2 min-w-0">
            <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
              Exp. Required Date
            </label>
            <div className="flex-1 min-w-[140px]">
              <DatePicker
                allowInput
                value={expRequiredDate}
                onChange={(_, d) => handleExpDateChange(d || todayStr)}
                placeholder="YYYY-MM-DD"
                dateFormat="yyyy-MM-dd"
                className="w-full"
                buttonClassName="w-full h-9 px-2.5 rounded-xl text-xs font-semibold border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Prepared By
              </label>
              <input
                type="text"
                value={preparedBy}
                readOnly
                className="h-9 w-36 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11]/60 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-default"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                PO Days
              </label>
              <input
                type="number"
                min={0}
                value={poDays}
                onChange={(e) => setPoDays(Math.max(0, Number(e.target.value) || 0))}
                className="h-9 w-24 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono text-right text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 h-9 sm:h-10 px-5 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-[#0A0E1A] font-bold text-xs sm:text-sm shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : isEdit ? "Update Order" : "Save"}</span>
          </button>
        </div>
      </div>

        {/* Slide-over Party Details Drawer */}
        <MaterialPartyDetailsDrawer
          isOpen={isPartyDrawerOpen}
          onClose={() => setIsPartyDrawerOpen(false)}
          parties={parties}
          loadingParties={loadingParties}
          selectedParty={selectedParty}
          onSelectParty={(p) => {
            setSelectedPartyId(p.id);
            setIsPartyDrawerOpen(false);
          }}
          onPartyCreated={(p) => {
            setParties((prev) => [p, ...prev]);
          }}
        />
      </div>

      {/* Roll Details Modal */}
      {rollModalIndex !== null && items[rollModalIndex] && (
        <RollDetailsModal
          isOpen={true}
          unit={items[rollModalIndex].unit || "PCS"}
          defaultRate={items[rollModalIndex].rate || 0}
          initialRows={items[rollModalIndex].rollDetails}
          onClose={() => setRollModalIndex(null)}
          onSave={(rows: MaterialRollDetail[], totalRealQty: number, firstRate?: number) => {
            updateItem(rollModalIndex, {
              rollDetails: rows,
              orderedQty: totalRealQty > 0 ? totalRealQty : items[rollModalIndex].orderedQty,
              ...(firstRate !== undefined && firstRate > 0 ? { rate: firstRate } : {}),
            });
            setRollModalIndex(null);
          }}
        />
      )}
    </div>
  );
}
