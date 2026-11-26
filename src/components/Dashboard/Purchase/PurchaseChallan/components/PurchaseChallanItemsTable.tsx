"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Plus, Trash2, Upload, Download, Save, CheckCircle2, FileText } from "lucide-react";
import { PurchaseChallanItem, ProductSkuSuggestion } from "../types/purchaseChallan.types";
import { purchaseChallanService } from "../services/purchaseChallan.service";
import {
  downloadPurchaseBlankFormatExcel,
  parsePurchaseItemsFromExcel,
} from "../utils/purchaseExcelHelper";
import { toast } from "sonner";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";

interface PurchaseChallanItemsTableProps {
  items: PurchaseChallanItem[];
  onChangeItems: (items: PurchaseChallanItem[]) => void;
  courierPartner: string;
  onChangeCourierPartner: (val: string) => void;
  lrNo?: string;
  onChangeLrNo?: (val: string) => void;
  receivedBy: string;
  onChangeReceivedBy: (val: string) => void;
  checkedBy: string;
  onChangeCheckedBy: (val: string) => void;
  preparedBy: string;
  onChangePreparedBy: (val: string) => void;
  additionalExpense: number;
  onChangeAdditionalExpense: (val: number) => void;
  onOpenAdditionalExpenseModal?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

const employeeOptions = [
  { value: "Ramesh", label: "Ramesh" },
  { value: "Suresh", label: "Suresh" },
  { value: "TOPLOT CK", label: "TOPLOT CK" },
  { value: "Devang", label: "Devang" },
  { value: "Warehouse Staff", label: "Warehouse Staff" },
];

export default function PurchaseChallanItemsTable({
  items,
  onChangeItems,
  courierPartner,
  onChangeCourierPartner,
  receivedBy,
  onChangeReceivedBy,
  checkedBy,
  onChangeCheckedBy,
  preparedBy,
  onChangePreparedBy,
  additionalExpense,
  onChangeAdditionalExpense,
  onOpenAdditionalExpenseModal,
  onSave,
  isSaving = false,
}: PurchaseChallanItemsTableProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active SKU autocomplete dropdown state
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [skuSuggestions, setSkuSuggestions] = useState<ProductSkuSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchSeqRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const updateDropdownCoords = (el: HTMLElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setDropdownCoords({
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(280, rect.width),
    });
  };

  useEffect(() => {
    if (activeRowIdx === null) return;

    const handleScrollOrResize = () => {
      if (activeInputRef.current) {
        updateDropdownCoords(activeInputRef.current);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeRowIdx]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        activeInputRef.current &&
        !activeInputRef.current.contains(target)
      ) {
        setActiveRowIdx(null);
        setSkuSuggestions([]);
        setDropdownCoords(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch SKU suggestions with debounce
  const handleSkuChange = (idx: number, val: string) => {
    handleRowChange(idx, "sku", val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const query = val.trim();
    if (!query) {
      setActiveRowIdx(null);
      setSkuSuggestions([]);
      setDropdownCoords(null);
      return;
    }

    setActiveRowIdx(idx);
    const seq = ++searchSeqRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const results = await purchaseChallanService.searchSkus(query);
        if (seq === searchSeqRef.current) {
          setSkuSuggestions(results);
          if (activeInputRef.current) {
            updateDropdownCoords(activeInputRef.current);
          }
        }
      } catch (err) {
        console.error("SKU suggestions error", err);
      } finally {
        if (seq === searchSeqRef.current) {
          setLoadingSuggestions(false);
        }
      }
    }, 200);
  };

  const handleSelectSku = (idx: number, sugg: ProductSkuSuggestion) => {
    const updated = [...items];
    const prev = updated[idx];
    const newRate = sugg.rate > 0 ? sugg.rate : prev.rate;
    const qty = Number(prev.receivedQty) || 0;

    updated[idx] = {
      ...prev,
      sku: sugg.sku,
      name: sugg.name || prev.name,
      rate: newRate,
      amount: qty * Number(newRate || 0),
    };

    onChangeItems(updated);
    setActiveRowIdx(null);
    setSkuSuggestions([]);
    setDropdownCoords(null);
  };

  const handleRowChange = (
    idx: number,
    field: keyof PurchaseChallanItem,
    val: any,
    extraUpdates?: Partial<PurchaseChallanItem>
  ) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
      ...(extraUpdates || {}),
    };

    // Auto-calculate amount when receivedQty or rate changes
    if (
      field === "receivedQty" ||
      field === "rate" ||
      extraUpdates?.receivedQty !== undefined ||
      extraUpdates?.rate !== undefined
    ) {
      const q =
        val === "" && field === "receivedQty"
          ? 0
          : Number(updated[idx].receivedQty) || 0;
      const r =
        val === "" && field === "rate"
          ? 0
          : Number(updated[idx].rate) || 0;
      updated[idx].amount = q * r;
    }

    // Do NOT auto-calculate or overwrite pendingQty or receivedQty when orderedQty changes!

    onChangeItems(updated);
  };

  const handleAddRow = () => {
    const nextNo = items.length + 1;
    onChangeItems([
      ...items,
      {
        itemNo: nextNo,
        sku: "",
        poNo: "",
        size: "",
        orderedQty: 0,
        pendingQty: 0,
        name: "",
        receivedQty: 0,
        rate: 0.0,
        amount: 0.0,
        lotNo: "",
        partyChallanNo: "",
        receivedDate: "",
        remarks: "",
      },
    ]);
  };

  const handleDeleteRow = (idx: number) => {
    const filtered = items
      .filter((_, i) => i !== idx)
      .map((item, i) => ({ ...item, itemNo: i + 1 }));
    onChangeItems(filtered);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Importing inward excel sheet...", { id: "purchase-excel-import" });
      const imported = await parsePurchaseItemsFromExcel(file);
      if (imported.length === 0) {
        toast.error("No valid items found in excel file.", { id: "purchase-excel-import" });
        return;
      }
      onChangeItems(imported);
      toast.success(`Successfully imported ${imported.length} inward items!`, {
        id: "purchase-excel-import",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to import inward excel sheet.", {
        id: "purchase-excel-import",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Calculate totals
  const totalOrderedQty = items.reduce(
    (sum, item) => sum + (Number(item.orderedQty) || 0),
    0
  );
  const totalReceivedQty = items.reduce(
    (sum, item) => sum + (Number(item.receivedQty) || 0),
    0
  );
  const totalAmount = items.reduce(
    (sum, item) =>
      sum + (Number(item.receivedQty) || 0) * (Number(item.rate) || 0),
    0
  );

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-5 shadow-sm space-y-3.5">
      {/* Top action toolbar (Challan Details title + Download template + Import) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          Challan Details
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadPurchaseBlankFormatExcel}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-[#E8C16D] dark:border-[#E8C16D]/60 bg-transparent text-[#B88728] dark:text-[#E8C16D] hover:bg-[#E8C16D]/10 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
            <span>Download Template</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#141B2D] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#1E293B] text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
            <span>Import from Excelsheet</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
        </div>
      </div>

      {/* Main Inward Items Table matching user uploaded image */}
      <div className="overflow-x-auto rounded-2xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#080B11] shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Header styled with gold text in light and dark mode with vertical dividers */}
            <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] font-bold text-xs select-none whitespace-nowrap">
              <th className="py-2.5 px-2 font-bold text-center w-12 border-r border-[#F5E6BE] dark:border-white/[0.08]">
                No.
              </th>
              <th className="py-2.5 px-3 font-bold min-w-[170px] border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Product SKU.
              </th>
              <th className="py-2.5 px-2 font-bold w-24 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                PO No.
              </th>
              <th className="py-2.5 px-2 font-bold w-20 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Size.
              </th>
              <th className="py-2.5 px-2 font-bold w-24 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Order Qty.
              </th>
              <th className="py-2.5 px-2 font-bold w-24 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Pending Qty.
              </th>
              <th className="py-2.5 px-3 font-bold min-w-[180px] border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Detail.
              </th>
              <th className="py-2.5 px-2 font-bold w-24 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Received Qty.
              </th>
              <th className="py-2.5 px-2 font-bold w-20 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Rate.
              </th>
              <th className="py-2.5 px-3 font-bold min-w-[100px] text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Amount.
              </th>
              <th className="py-2.5 px-2 font-bold text-center w-12">
                Del.
              </th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              /* Empty state matching Image clipboard icon */
              <tr>
                <td colSpan={11} className="py-16 px-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-14 rounded-lg border-2 border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/[0.04] flex flex-col items-center justify-center p-2 shadow-2xs">
                      <div className="w-5 h-1.5 bg-amber-500 rounded-xs mb-1.5" />
                      <div className="w-full space-y-1">
                        <div className="h-1 bg-slate-300 dark:bg-white/20 rounded-full w-full" />
                        <div className="h-1 bg-slate-300 dark:bg-white/20 rounded-full w-3/4" />
                        <div className="h-1 bg-slate-300 dark:bg-white/20 rounded-full w-1/2" />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      No data available
                    </p>
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#B88728] dark:text-[#E8C16D] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Item</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[#F5E6BE]/60 dark:border-white/[0.06] hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* 1. No. */}
                  <td className="py-2 px-2 text-center text-slate-700 dark:text-slate-200 font-bold text-xs border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    {idx + 1}
                  </td>

                  {/* 2. Product SKU. */}
                  <td className="py-1.5 px-2 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="text"
                      value={item.sku}
                      onChange={(e) => {
                        activeInputRef.current = e.currentTarget;
                        updateDropdownCoords(e.currentTarget);
                        handleSkuChange(idx, e.target.value);
                      }}
                      onFocus={(e) => {
                        activeInputRef.current = e.currentTarget;
                        updateDropdownCoords(e.currentTarget);
                        if (item.sku) handleSkuChange(idx, item.sku);
                      }}
                      placeholder="Product SKU"
                      className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none font-mono"
                    />
                  </td>

                  {/* 3. PO No. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="text"
                      value={item.poNo || ""}
                      onChange={(e) =>
                        handleRowChange(idx, "poNo", e.target.value)
                      }
                      placeholder="PO No."
                      className="w-full h-8 px-2 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none"
                    />
                  </td>

                  {/* 4. Size. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="text"
                      value={item.size || ""}
                      onChange={(e) =>
                        handleRowChange(idx, "size", e.target.value)
                      }
                      placeholder="Size"
                      className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none"
                    />
                  </td>

                  {/* 5. Order Qty. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="number"
                      min="0"
                      value={item.orderedQty === undefined || item.orderedQty === null ? "" : item.orderedQty}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? "" : Number(raw);
                        handleRowChange(idx, "orderedQty", val);
                      }}
                      className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-bold font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* 6. Pending Qty. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="number"
                      min="0"
                      value={item.pendingQty === undefined || item.pendingQty === null ? "" : item.pendingQty}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? "" : Number(raw);
                        handleRowChange(idx, "pendingQty", val);
                      }}
                      className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-bold font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* 7. Detail. */}
                  <td className="py-1.5 px-2 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleRowChange(idx, "name", e.target.value)
                      }
                      placeholder="Detail / Particulars"
                      className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none"
                    />
                  </td>

                  {/* 8. Received Qty. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="number"
                      min="0"
                      value={item.receivedQty === undefined || item.receivedQty === null ? "" : item.receivedQty}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? "" : Number(raw);
                        handleRowChange(idx, "receivedQty", val);
                      }}
                      className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-bold font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* 9. Rate. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.rate === undefined || item.rate === null ? "" : item.rate}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? "" : Number(raw);
                        handleRowChange(idx, "rate", val);
                      }}
                      className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* 10. Amount. */}
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-[#E8C16D] border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    ₹ {(item.amount ?? (Number(item.receivedQty) || 0) * (Number(item.rate) || 0)).toFixed(2)}
                  </td>

                  {/* 11. Delete */}
                  <td className="py-1.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      title="Delete row"
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Summary Row matching user image */}
          <tfoot className="border-t border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] select-none text-xs font-bold">
            <tr>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-3 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-3 text-right font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase tracking-wider border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                Total:
              </td>
              <td className="py-2.5 px-2 text-center font-bold font-mono text-[#0A0E1A] dark:text-white border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                {totalReceivedQty}
              </td>
              <td className="py-2.5 px-2 text-right font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase tracking-wider border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                Total:
              </td>
              <td className="py-2.5 px-3 text-right font-bold font-mono text-[#B88728] dark:text-[#E8C16D] border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                ₹ {totalAmount.toFixed(2)}
              </td>
              <td className="py-2.5 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Circular + Add Row Button matching user image */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleAddRow}
          title="Add Row"
          className="grid h-7 w-7 sm:h-7.5 sm:w-7.5 place-items-center rounded-full border border-[#E8C16D] dark:border-[#E8C16D]/50 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-1 ring-[#E8C16D]/30 transition-all shadow-2xs active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
        </button>
      </div>

      {/* Bottom Footer Verification & Expense bar matching Image 2 */}
      <div className="pt-3 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left Side: Prepared By, Received By, Checked By */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Prepared By */}
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Prepared By
            </label>
            <input
              type="text"
              value={preparedBy}
              readOnly
              placeholder="Prepared By"
              className="h-9 w-28 sm:w-36 px-3 bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-medium outline-none cursor-not-allowed"
            />
          </div>

          {/* Received By */}
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Received By
            </label>
            <div className="w-28 sm:w-32">
              <ThemeSelectDropdown
                value={receivedBy}
                onChange={onChangeReceivedBy}
                options={employeeOptions}
                buttonClassName="h-9 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white"
                menuClassName="min-w-[140px]"
              />
            </div>
          </div>

          {/* Checked By */}
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Checked By
            </label>
            <div className="w-28 sm:w-32">
              <ThemeSelectDropdown
                value={checkedBy}
                onChange={onChangeCheckedBy}
                options={employeeOptions}
                buttonClassName="h-9 px-2.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-900 dark:text-white"
                menuClassName="min-w-[140px]"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Additional Expense, Courier Partner, Save button */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Additional Expense. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAdditionalExpenseModal}
              className="font-semibold text-slate-700 dark:text-slate-300 underline decoration-dotted underline-offset-4 hover:text-[#B88728] dark:hover:text-[#E8C16D] whitespace-nowrap cursor-pointer transition-colors"
              title="Click to manage additional expenses"
            >
              Additional Expense.
            </button>
            <input
              type="number"
              step="0.01"
              min="0"
              value={additionalExpense}
              onChange={(e) =>
                onChangeAdditionalExpense(Number(e.target.value) || 0)
              }
              placeholder="0"
              className="h-9 w-20 sm:w-24 px-2.5 text-center font-mono font-semibold bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Courier Partner. */}
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Courier Partner.
            </label>
            <input
              type="text"
              value={courierPartner}
              onChange={(e) => onChangeCourierPartner(e.target.value)}
              placeholder="Courier Partner"
              className="h-9 w-32 sm:w-40 px-3 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-900 dark:text-white font-medium focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none"
            />
          </div>

          {/* Save Button */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete SKU Portal */}
      {typeof document !== "undefined" &&
        activeRowIdx !== null &&
        dropdownCoords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${dropdownCoords.top}px`,
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-[#0F1626] border border-[#E8C16D]/40 dark:border-[#E8C16D]/30 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100"
          >
            {loadingSuggestions ? (
              <div className="py-3 px-4 text-xs text-slate-400 text-center font-medium">
                Searching SKUs...
              </div>
            ) : skuSuggestions.length === 0 ? (
              <div className="py-3 px-4 text-xs text-slate-400 text-center">
                No matching SKU found.
              </div>
            ) : (
              skuSuggestions.map((sugg, i) => (
                <button
                  key={`${sugg.sku}-${i}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSku(activeRowIdx, sugg);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] transition-colors border-b border-slate-100 dark:border-white/[0.04] last:border-b-0 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white font-mono">
                      {sugg.sku}
                    </span>
                    {sugg.rate > 0 && (
                      <span className="text-[11px] font-semibold text-[#B88728] dark:text-[#E8C16D] font-mono">
                        ₹ {sugg.rate}
                      </span>
                    )}
                  </div>
                  {sugg.name && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {sugg.name}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
