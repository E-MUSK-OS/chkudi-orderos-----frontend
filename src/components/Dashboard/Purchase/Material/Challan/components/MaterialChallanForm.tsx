"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Eye,
  List,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import DatePicker from "@/components/ui/DatePicker";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { getCurrentUserName } from "@/utils/auth";
import MaterialSkuDropdown from "../../Order/components/MaterialSkuDropdown";
import RollDetailsModal from "../../Order/components/RollDetailsModal";
import {
  MaterialCatalogOption,
  MaterialOrderParty,
  MaterialRollDetail,
} from "../../Order/types/materialOrder.types";
import { materialOrderService } from "../../Order/services/materialOrder.service";
import MaterialChallanPartyDrawer from "./MaterialChallanPartyDrawer";
import PartySkuDropdown from "./PartySkuDropdown";
import {
  MaterialPurchaseChallan,
  MaterialPurchaseChallanItem,
  PartySkuOption,
  PendingMaterialOrder,
} from "../types/materialChallan.types";
import { materialChallanService } from "../services/materialChallan.service";

interface MaterialChallanFormProps {
  challanToEdit?: MaterialPurchaseChallan | null;
  onBack: () => void;
  onSaved: () => void;
}

const challanForOptions: ThemeSelectOption[] = [
  { value: "Purchase", label: "Purchase" },
  { value: "Job Work", label: "Job Work" },
  { value: "Return", label: "Return" },
  { value: "Other", label: "Other" },
];

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function computeRow(row: MaterialPurchaseChallanItem): MaterialPurchaseChallanItem {
  const receivedQty = Number(row.receivedQty) || 0;
  const lessPercent = Number(row.lessPercent) || 0;
  const rate = Number(row.rate) || 0;
  const realQty =
    Math.round(Math.max(0, receivedQty * (1 - lessPercent / 100)) * 100) / 100;
  const amount = Math.round(realQty * rate * 100) / 100;
  return { ...row, realQty, amount };
}

function createEmptyChallanItem(itemNo: number): MaterialPurchaseChallanItem {
  return {
    itemNo,
    materialId: null,
    partySku: "",
    sku: "",
    poNo: "",
    orderedQty: 0,
    receivedQty: 0,
    unit: "",
    lessPercent: 0,
    rate: 0,
    amount: 0,
    realQty: 0,
    rollDetails: [],
  };
}

export default function MaterialChallanForm({
  challanToEdit,
  onBack,
  onSaved,
}: MaterialChallanFormProps) {
  const todayStr = getTodayStr();
  const isEdit = Boolean(challanToEdit?.id);

  const [challanNo, setChallanNo] = useState(challanToEdit?.challanNo || "");
  const [challanDate, setChallanDate] = useState(
    challanToEdit?.challanDate ? challanToEdit.challanDate.split("T")[0] : todayStr
  );
  const [challanFor, setChallanFor] = useState(challanToEdit?.challanFor || "Purchase");
  const [partyChallanNo, setPartyChallanNo] = useState(challanToEdit?.partyChallanNo || "");

  const [additionalExpense, setAdditionalExpense] = useState<number>(
    challanToEdit?.additionalExpense || 0
  );
  const [courierPartner, setCourierPartner] = useState(challanToEdit?.courierPartner || "");
  const [lrNo, setLrNo] = useState(challanToEdit?.lrNo || "");
  const [preparedBy, setPreparedBy] = useState(
    challanToEdit?.preparedBy || getCurrentUserName() || "User"
  );
  const [receivedBy, setReceivedBy] = useState(challanToEdit?.receivedBy || "");
  const [checkedBy, setCheckedBy] = useState(challanToEdit?.checkedBy || "");

  const [parties, setParties] = useState<MaterialOrderParty[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [materials, setMaterials] = useState<MaterialCatalogOption[]>([]);
  const [partySkus, setPartySkus] = useState<PartySkuOption[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);

  const [selectedPartyId, setSelectedPartyId] = useState<string>(
    challanToEdit?.supplierId || ""
  );
  const [isPartyDrawerOpen, setIsPartyDrawerOpen] = useState(false);

  const [items, setItems] = useState<MaterialPurchaseChallanItem[]>(() => {
    if (challanToEdit?.items && challanToEdit.items.length > 0) {
      return challanToEdit.items.map((it, idx) =>
        computeRow({
          id: it.id,
          itemNo: it.itemNo || idx + 1,
          materialId: it.materialId || null,
          partySku: it.partySku || "",
          sku: it.sku || "",
          poNo: it.poNo || "",
          orderedQty: Number(it.orderedQty) || 0,
          receivedQty: Number(it.receivedQty) || 0,
          unit: it.unit || "",
          lessPercent: Number(it.lessPercent) || 0,
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || 0,
          realQty: Number(it.realQty) || 0,
          rollDetails: Array.isArray(it.rollDetails) ? it.rollDetails : [],
        })
      );
    }
    return [createEmptyChallanItem(1)];
  });

  const [rollModalIndex, setRollModalIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!challanToEdit?.preparedBy) {
      setPreparedBy(getCurrentUserName() || "User");
    }
  }, [challanToEdit]);

  useEffect(() => {
    if (isEdit) return;
    const timer = setTimeout(() => setIsPartyDrawerOpen(true), 60);
    return () => clearTimeout(timer);
  }, [isEdit]);

  useEffect(() => {
    let active = true;

    if (!isEdit) {
      materialChallanService
        .getNextChallanNo()
        .then((nextNo) => {
          if (active && nextNo) setChallanNo(nextNo);
        })
        .catch((err) => console.error("Failed to fetch next challan no", err));
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

    materialChallanService
      .getEmployees()
      .then((list) => {
        if (active) setEmployees(list);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isEdit]);

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId) || challanToEdit?.supplier || null,
    [parties, selectedPartyId, challanToEdit]
  );

  useEffect(() => {
    if (!selectedPartyId) {
      setPartySkus([]);
      return;
    }
    let active = true;
    materialChallanService
      .getPartySkus(selectedPartyId)
      .then((list) => {
        if (active) setPartySkus(list);
      })
      .catch(() => {
        if (active) setPartySkus([]);
      });
    return () => {
      active = false;
    };
  }, [selectedPartyId]);

  const staffOptions: ThemeSelectOption[] = useMemo(() => {
    const names = Array.from(
      new Set([getCurrentUserName(), ...employees].filter(Boolean))
    );
    return [
      { value: "", label: "Select..." },
      ...names.map((n) => ({ value: n, label: n })),
    ];
  }, [employees]);

  const totalReceivedQty = useMemo(
    () => items.reduce((s, r) => s + (Number(r.receivedQty) || 0), 0),
    [items]
  );

  const totalAmount = useMemo(
    () =>
      items.reduce((s, r) => s + (Number(r.amount) || 0), 0) +
      (Number(additionalExpense) || 0),
    [items, additionalExpense]
  );

  const updateItem = (idx: number, patch: Partial<MaterialPurchaseChallanItem>) => {
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? computeRow({ ...row, ...patch }) : row))
    );
  };

  const handleSelectMaterial = (idx: number, mat: MaterialCatalogOption) => {
    const skuVal = mat.sku || mat.masterSku || mat.materialName;
    updateItem(idx, {
      sku: skuVal,
      partySku: items[idx]?.partySku || skuVal,
      materialId: mat.id,
      unit: mat.unit || items[idx]?.unit || "",
      rate: mat.materialCost !== undefined ? Number(mat.materialCost) : 0,
    });
  };

  const handleSelectCustomSku = (idx: number, skuText: string) => {
    updateItem(idx, {
      sku: skuText,
      partySku: items[idx]?.partySku || skuText,
      materialId: null,
    });
  };

  const handleSelectPartySku = (idx: number, opt: PartySkuOption) => {
    const matchedMat = materials.find(
      (m) =>
        (opt.materialId && m.id === opt.materialId) ||
        (opt.sku &&
          ((m.sku || "").toLowerCase() === opt.sku.toLowerCase() ||
            (m.masterSku || "").toLowerCase() === opt.sku.toLowerCase() ||
            (m.materialName || "").toLowerCase() === opt.sku.toLowerCase()))
    );
    const current = items[idx];
    updateItem(idx, {
      partySku: opt.partySku,
      sku: current?.sku || matchedMat?.sku || matchedMat?.masterSku || opt.sku || "",
      materialId: current?.materialId || matchedMat?.id || opt.materialId || null,
      unit: current?.unit || matchedMat?.unit || opt.unit || "",
      rate:
        current?.rate && current.rate > 0
          ? current.rate
          : matchedMat?.materialCost !== undefined
          ? Number(matchedMat.materialCost)
          : Number(opt.rate) || 0,
    });
  };

  const handleImportPendingOrders = (orders: PendingMaterialOrder[]) => {
    const imported: MaterialPurchaseChallanItem[] = [];
    for (const ord of orders) {
      for (const it of ord.items || []) {
        const pending = Number(it.pendingQty ?? it.orderedQty) || 0;
        if (pending <= 0) continue;
        imported.push(
          computeRow({
            itemNo: imported.length + 1,
            materialId: it.materialId || null,
            partySku: it.partySku || it.sku,
            sku: it.sku,
            poNo: ord.orderNo,
            orderedQty: Number(it.orderedQty) || 0,
            receivedQty: pending,
            unit: it.unit || "",
            lessPercent: 0,
            rate: Number(it.rate) || 0,
            amount: 0,
            realQty: 0,
            rollDetails: Array.isArray(it.rollDetails) ? it.rollDetails : [],
          })
        );
      }
    }

    if (imported.length === 0) return;

    setItems((prev) => {
      const nonEmpty = prev.filter((r) => r.sku.trim() !== "");
      const combined = [...nonEmpty, ...imported];
      return combined.map((r, i) => ({ ...r, itemNo: i + 1 }));
    });
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, createEmptyChallanItem(prev.length + 1)]);
  };

  const removeItemRow = (idx: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return [createEmptyChallanItem(1)];
      return prev
        .filter((_, i) => i !== idx)
        .map((row, i) => ({ ...row, itemNo: i + 1 }));
    });
  };

  const handleSave = async () => {
    if (!selectedParty && !challanToEdit?.supplierName) {
      toast.error("Please select a Party before saving.");
      setIsPartyDrawerOpen(true);
      return;
    }

    const validItems = items.filter(
      (it) => it.sku.trim() && (Number(it.receivedQty) || 0) > 0
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one item with Material SKU and Received Qty > 0.");
      return;
    }

    const payload = {
      challanNo: challanNo.trim(),
      challanDate,
      challanFor,
      partyChallanNo: partyChallanNo.trim() || null,
      supplierId: selectedParty?.id || challanToEdit?.supplierId || null,
      supplierName:
        selectedParty?.partyName || challanToEdit?.supplierName || "Direct Supplier",
      contactNo:
        selectedParty?.phone ||
        selectedParty?.whatsapp ||
        challanToEdit?.contactNo ||
        null,
      additionalExpense: Number(additionalExpense) || 0,
      courierPartner: courierPartner.trim() || null,
      lrNo: lrNo.trim() || null,
      preparedBy,
      receivedBy: receivedBy || null,
      checkedBy: checkedBy || null,
      items: validItems.map((it, idx) => ({
        ...it,
        itemNo: idx + 1,
      })),
    };

    try {
      setSaving(true);
      if (isEdit && challanToEdit?.id) {
        await materialChallanService.updateChallan(challanToEdit.id, payload);
        toast.success("Material Purchase Challan updated successfully.");
      } else {
        await materialChallanService.createChallan(payload);
        toast.success("Material Purchase Challan created successfully.");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save Material Purchase Challan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans relative">
      {/* Top Header Bar */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
              Challan [ Purchase Material &amp; Service ]
            </h1>
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
              value={challanNo}
              onChange={(e) => setChallanNo(e.target.value)}
              placeholder="PC/2026-2027/1"
              className="h-9 sm:h-10 w-36 sm:w-44 px-3 text-xs sm:text-sm font-bold bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D] rounded-xl text-[#B88728] dark:text-[#E8C16D] outline-none font-mono text-center"
            />

            <div className="w-36 sm:w-40">
              <DatePicker
                allowInput
                value={challanDate}
                onChange={(_, d) => setChallanDate(d || todayStr)}
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

      {/* Content & Drawer Container */}
      <div className="space-y-4 relative min-h-[540px] overflow-x-clip">
        {/* Meta Row Card: Challan For + Party Challan No */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Challan For
              </label>
              <div className="flex-1 min-w-0">
                <ThemeSelectDropdown
                  value={challanFor}
                  onChange={setChallanFor}
                  options={challanForOptions}
                  className="w-full"
                  buttonClassName="w-full h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Party Challan No
              </label>
              <input
                type="text"
                value={partyChallanNo}
                onChange={(e) => setPartyChallanNo(e.target.value)}
                placeholder="Party Challan No"
                className="flex-1 min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Items Table Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm space-y-4">
          <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08]">
            <table className="w-full text-left border-collapse min-w-[1180px]">
              <thead>
                <tr className="bg-[#FFF9EC] dark:bg-[#141A29] border-b border-[#E7E0D2] dark:border-white/[0.08] text-[11px] font-bold text-[#6A4D1D] dark:text-[#E8C16D]">
                  <th className="py-2.5 px-3 w-12">No.</th>
                  <th className="py-2.5 px-3 w-52 min-w-[190px]">Party SKU.</th>
                  <th className="py-2.5 px-3 w-52 min-w-[190px]">Material SKU.</th>
                  <th className="py-2.5 px-3 w-36">PO No.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Order Qty.</th>
                  <th className="py-2.5 px-3 w-28 text-right">Received Qty.</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Less %.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Rate.</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amount.</th>
                  <th className="py-2.5 px-3 w-16 text-center">Detail.</th>
                  <th className="py-2.5 px-3 w-24 text-right">Real Qty.</th>
                  <th className="py-2.5 px-3 w-12 text-center">Del.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
                {items.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]">
                    <td className="py-2 px-3 font-mono text-slate-500">{row.itemNo}</td>
                    <td className="py-2 px-3">
                      <PartySkuDropdown
                        value={row.partySku || ""}
                        options={partySkus}
                        onSelectOption={(opt) => handleSelectPartySku(idx, opt)}
                        onSelectCustom={(txt) => updateItem(idx, { partySku: txt })}
                      />
                    </td>
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
                        value={row.poNo || ""}
                        onChange={(e) => updateItem(idx, { poNo: e.target.value })}
                        placeholder="PO No."
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">
                      {Number(row.orderedQty || 0)}
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.receivedQty || ""}
                        onChange={(e) =>
                          updateItem(idx, { receivedQty: Number(e.target.value) || 0 })
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
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={row.lessPercent || ""}
                        onChange={(e) =>
                          updateItem(idx, { lessPercent: Number(e.target.value) || 0 })
                        }
                        placeholder="0"
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                      />
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
                        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-right font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#0A0E1A] dark:text-white whitespace-nowrap">
                      ₹ {Number(row.amount || 0).toFixed(2)}
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
                    <td className="py-2 px-3 text-right font-mono font-semibold text-slate-600 dark:text-slate-300">
                      {Number(row.realQty || 0).toFixed(2)}
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
                ))}
              </tbody>
            </table>
          </div>

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
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  Total Qty:
                </span>
                <span className="font-mono font-bold text-sm text-[#0A0E1A] dark:text-white">
                  {totalReceivedQty}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  Total:
                </span>
                <span className="font-mono font-bold text-sm text-[#B88728] dark:text-[#E8C16D]">
                  ₹ {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Expense, Courier, Staff & Save Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Additional Expense.
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={additionalExpense || ""}
                onChange={(e) => setAdditionalExpense(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono text-right text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                Courier Partner.
              </label>
              <input
                type="text"
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                placeholder="Courier Partner."
                className="w-full min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                LR No.
              </label>
              <input
                type="text"
                value={lrNo}
                onChange={(e) => setLrNo(e.target.value)}
                placeholder="LR No"
                className="w-full min-w-0 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-mono text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
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
                  Received By
                </label>
                <div className="w-36">
                  <ThemeSelectDropdown
                    value={receivedBy}
                    onChange={setReceivedBy}
                    options={staffOptions}
                    placeholder="Select ..."
                    className="w-full"
                    buttonClassName="w-full h-9 px-2.5 text-xs rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  Checked By
                </label>
                <div className="w-36">
                  <ThemeSelectDropdown
                    value={checkedBy}
                    onChange={setCheckedBy}
                    options={staffOptions}
                    placeholder="Select ..."
                    className="w-full"
                    buttonClassName="w-full h-9 px-2.5 text-xs rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 h-9 sm:h-10 px-5 rounded-xl bg-[#E8C16D] hover:bg-[#d9b25d] text-[#0A0E1A] font-bold text-xs sm:text-sm shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : isEdit ? "Update Challan" : "Save"}</span>
            </button>
          </div>
        </div>

        {/* Slide-over Party Details & Pending Orders Drawer */}
        <MaterialChallanPartyDrawer
          isOpen={isPartyDrawerOpen}
          onClose={() => setIsPartyDrawerOpen(false)}
          parties={parties}
          loadingParties={loadingParties}
          selectedParty={selectedParty}
          onSelectParty={(p) => setSelectedPartyId(p.id)}
          onPartyCreated={(p) => setParties((prev) => [p, ...prev])}
          onImportPendingOrders={handleImportPendingOrders}
        />
      </div>

      {/* Roll Details Modal */}
      {rollModalIndex !== null && items[rollModalIndex] && (
        <RollDetailsModal
          isOpen={true}
          unit={items[rollModalIndex].unit || "Pcs"}
          defaultRate={items[rollModalIndex].rate || 0}
          initialRows={items[rollModalIndex].rollDetails}
          onClose={() => setRollModalIndex(null)}
          onSave={(rows: MaterialRollDetail[], totalRealQty: number, firstRate?: number) => {
            updateItem(rollModalIndex, {
              rollDetails: rows,
              receivedQty:
                totalRealQty > 0 ? totalRealQty : items[rollModalIndex].receivedQty,
              ...(firstRate !== undefined && firstRate > 0 ? { rate: firstRate } : {}),
            });
            setRollModalIndex(null);
          }}
        />
      )}
    </div>
  );
}
