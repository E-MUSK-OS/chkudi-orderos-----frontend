"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Upload, Download, ScanBarcode } from "lucide-react";
import { PurchaseChallanItem, ProductSkuSuggestion } from "../types/purchaseChallan.types";
import { purchaseChallanService } from "../services/purchaseChallan.service";
import {
  downloadPurchaseBlankFormatExcel,
  parsePurchaseItemsFromExcel,
} from "../utils/purchaseExcelHelper";
import { toast } from "sonner";
import PurchaseBarcodeScanModal from "./PurchaseBarcodeScanModal";
import DatePicker from "@/components/ui/DatePicker";

interface PurchaseChallanItemsTableProps {
  items: PurchaseChallanItem[];
  onChangeItems: (items: PurchaseChallanItem[]) => void;
  courierPartner: string;
  onChangeCourierPartner: (val: string) => void;
  lrNo: string;
  onChangeLrNo: (val: string) => void;
  receivedBy: string;
  onChangeReceivedBy: (val: string) => void;
  checkedBy: string;
  onChangeCheckedBy: (val: string) => void;
  preparedBy: string;
  onChangePreparedBy: (val: string) => void;
}

export default function PurchaseChallanItemsTable({
  items,
  onChangeItems,
  courierPartner,
  onChangeCourierPartner,
  lrNo,
  onChangeLrNo,
  receivedBy,
  onChangeReceivedBy,
  checkedBy,
  onChangeCheckedBy,
  preparedBy,
  onChangePreparedBy,
}: PurchaseChallanItemsTableProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active SKU autocomplete dropdown state
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [skuSuggestions, setSkuSuggestions] = useState<ProductSkuSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
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
    const qty = prev.receivedQty || prev.orderedQty || 0;

    updated[idx] = {
      ...prev,
      sku: sugg.sku,
      name: sugg.name || prev.name,
      rate: newRate,
      amount: qty * newRate,
    };

    onChangeItems(updated);
    setActiveRowIdx(null);
    setSkuSuggestions([]);
    setDropdownCoords(null);
  };

  const handleRowChange = (
    idx: number,
    field: keyof PurchaseChallanItem,
    val: any
  ) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };

    // Auto-calculate amount when receivedQty or rate changes
    if (field === "receivedQty" || field === "rate") {
      const q =
        field === "receivedQty" ? Number(val) || 0 : updated[idx].receivedQty;
      const r = field === "rate" ? Number(val) || 0 : updated[idx].rate;
      updated[idx].amount = q * r;
    }

    onChangeItems(updated);
  };

  const handleAddRow = () => {
    const nextNo = items.length + 1;
    onChangeItems([
      ...items,
      {
        itemNo: nextNo,
        sku: "",
        name: "",
        orderedQty: 0,
        receivedQty: 0,
        rate: 0.0,
        amount: 0.0,
        poNo: "",
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

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header & Excel action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white">Challan Details</h2>

          <div className="flex items-center gap-2">
            {/* Download Template Button */}
            <button
              type="button"
              onClick={downloadPurchaseBlankFormatExcel}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Download Template</span>
            </button>

            {/* Import from Excelsheet Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-2xl bg-[#0A0E1A] hover:bg-[#161D2E] text-[#E8C16D] dark:bg-[#080B11] dark:border dark:border-white/[0.15] dark:text-[#E8C16D] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Upload className="w-3.5 h-3.5" />
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

        {/* Inward Items Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] mb-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Header styled with SaaS Dark Obsidian & Gold palette */}
              <tr className="bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#080B11] select-none whitespace-nowrap">
                <th className="py-2.5 px-3 font-semibold text-center w-10 border-r border-slate-800 dark:border-white/[0.06]">
                  No.
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 dark:border-white/[0.06] min-w-[160px]">
                  Particulars [SKU]
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 dark:border-white/[0.06] min-w-[200px]">
                  Particulars [Name]
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-slate-800 dark:border-white/[0.06] text-center w-20">
                  Ord.Qty
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-slate-800 dark:border-white/[0.06] text-center w-24">
                  Rec.Qty
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-slate-800 dark:border-white/[0.06] text-center w-20">
                  Rate
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-slate-800 dark:border-white/[0.06] text-center min-w-[90px]">
                  PO No
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-slate-800 dark:border-white/[0.06] min-w-[110px]">
                  Challan No
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-slate-800 dark:border-white/[0.06] min-w-[145px]">
                  Rec.Date
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-slate-800 dark:border-white/[0.06] min-w-[130px]">
                  Remarks
                </th>
                <th className="py-2.5 px-2 font-semibold text-center w-10">
                  Del.
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr className="border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
                  <td
                    colSpan={11}
                    className="py-6 px-4 text-slate-400 dark:text-slate-500 font-normal italic text-center"
                  >
                    No detail records found.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-[#E7E0D2]/60 dark:border-white/[0.06] hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {/* No. */}
                    <td className="py-2 px-2.5 text-center text-slate-700 dark:text-slate-300 font-semibold border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                      {idx + 1}
                    </td>

                    {/* Particulars [SKU] */}
                    <td className="py-1.5 px-2 border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
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
                        placeholder="Find Product SKU"
                        className="w-full h-8.5 px-2.5 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Particulars [Name] */}
                    <td className="py-1.5 px-2 border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleRowChange(idx, "name", e.target.value)
                        }
                        placeholder="Product Name"
                        className="w-full h-8.5 px-2.5 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Ord.Qty */}
                    <td className="py-1.5 px-1.5 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.orderedQty}
                        onChange={(e) =>
                          handleRowChange(idx, "orderedQty", e.target.value)
                        }
                        className="w-full h-8.5 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-semibold focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Rec.Qty with Pcs. */}
                    <td className="py-1.5 px-1.5 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] text-center">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          value={item.receivedQty}
                          onChange={(e) =>
                            handleRowChange(idx, "receivedQty", e.target.value)
                          }
                          className="w-full h-8.5 pl-1.5 pr-8 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-bold focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all shadow-2xs"
                        />
                        <span className="absolute right-1 text-[10px] text-slate-400 pointer-events-none font-medium">
                          Pcs.
                        </span>
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="py-1.5 px-1.5 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] text-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.rate}
                        onChange={(e) =>
                          handleRowChange(idx, "rate", e.target.value)
                        }
                        className="w-full h-8.5 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* PO No */}
                    <td className="py-1.5 px-1.5 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] text-center">
                      <input
                        type="text"
                        value={item.poNo || ""}
                        onChange={(e) =>
                          handleRowChange(idx, "poNo", e.target.value)
                        }
                        placeholder="PO-"
                        className="w-full h-8.5 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Challan No */}
                    <td className="py-1.5 px-2 border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                      <input
                        type="text"
                        value={item.partyChallanNo || ""}
                        onChange={(e) =>
                          handleRowChange(idx, "partyChallanNo", e.target.value)
                        }
                        placeholder="Challan No"
                        className="w-full h-8.5 px-2 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Rec.Date */}
                    <td className="py-1.5 px-2 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] min-w-[145px]">
                      <DatePicker
                        allowInput
                        value={item.receivedDate || ""}
                        onChange={(_, dateStr) =>
                          handleRowChange(idx, "receivedDate", dateStr || "")
                        }
                        placeholder="YYYY-MM-DD"
                        dateFormat="yyyy-MM-dd"
                        className="w-full"
                        buttonClassName="h-8.5 pl-2.5 pr-8 text-xs rounded-xl bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] shadow-2xs"
                      />
                    </td>

                    {/* Remarks */}
                    <td className="py-1.5 px-2 border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                      <input
                        type="text"
                        value={item.remarks || ""}
                        onChange={(e) =>
                          handleRowChange(idx, "remarks", e.target.value)
                        }
                        placeholder="Remarks"
                        className="w-full h-8.5 px-2 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Delete Button */}
                    <td className="py-1.5 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        title="Delete row"
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {/* Total Row */}
              {items.length > 0 && (
                <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-t-2 border-[#E7E0D2] dark:border-white/[0.08] font-bold text-xs">
                  <td colSpan={3} className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                    Total:
                  </td>
                  <td className="py-2.5 px-1 text-center text-slate-900 dark:text-white font-bold border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                    {totalOrderedQty}
                  </td>
                  <td className="py-2.5 px-1 text-center text-slate-900 dark:text-white font-bold border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                    {totalReceivedQty}
                  </td>
                  <td colSpan={6}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action icons below table (+ button) */}
        <div className="flex items-center gap-2 mb-4">
          {/* Gold + Button */}
          <button
            type="button"
            onClick={handleAddRow}
            title="Add New Row"
            className="h-9 w-9 bg-[#0A0E1A] hover:bg-[#161D2E] text-[#E8C16D] dark:bg-[#080B11] dark:border dark:border-white/[0.15] dark:text-[#E8C16D] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Bottom Form Fields: Delivery & Inward Verification */}
      <div className="pt-4 border-t border-[#E7E0D2] dark:border-white/[0.08] space-y-2.5">
        <h4 className="text-xs font-bold text-[#0A0E1A] dark:text-white uppercase tracking-wider">
          Delivery &amp; Inward Verification
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* Courier Partner */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Courier Partner
            </label>
            <input
              type="text"
              value={courierPartner}
              onChange={(e) => onChangeCourierPartner(e.target.value)}
              placeholder="e.g. BlueDart"
              className="h-10 w-full px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 focus:outline-none transition-all shadow-xs"
            />
          </div>

          {/* LR No. */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              LR No.
            </label>
            <input
              type="text"
              value={lrNo}
              onChange={(e) => onChangeLrNo(e.target.value)}
              placeholder="e.g. 10293847"
              className="h-10 w-full px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 focus:outline-none transition-all shadow-xs"
            />
          </div>

          {/* Received by */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Received by
            </label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => onChangeReceivedBy(e.target.value)}
              placeholder="Ramesh"
              className="h-10 w-full px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 focus:outline-none transition-all shadow-xs"
            />
          </div>

          {/* Checked by */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Checked by
            </label>
            <input
              type="text"
              value={checkedBy}
              onChange={(e) => onChangeCheckedBy(e.target.value)}
              placeholder="Ramesh"
              className="h-10 w-full px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 focus:outline-none transition-all shadow-xs"
            />
          </div>

          {/* Prepared by */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Prepared by
            </label>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => onChangePreparedBy(e.target.value)}
              placeholder="Ramesh"
              className="h-10 w-full px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 focus:outline-none transition-all shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Floating SKU Autocomplete Suggestions Dropdown Portal */}
      {typeof window !== "undefined" &&
        activeRowIdx !== null &&
        dropdownCoords &&
        createPortal(
          <div
            ref={dropdownRef}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              position: "fixed",
              top: `${dropdownCoords.top}px`,
              left: `${dropdownCoords.left}px`,
              minWidth: `${dropdownCoords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] rounded-2xl shadow-2xl max-h-60 overflow-y-auto text-xs py-1.5 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-white/[0.04]"
          >
            {loadingSuggestions ? (
              <div className="p-3 text-center text-slate-400">Searching products...</div>
            ) : skuSuggestions.length === 0 ? (
              <div className="p-3 text-center text-slate-400">No matching SKU found.</div>
            ) : (
              skuSuggestions.map((s) => (
                <button
                  key={s.sku}
                  type="button"
                  onClick={() => handleSelectSku(activeRowIdx, s)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[#FFF9EC]/60 dark:hover:bg-white/[0.04] transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white text-xs">
                      {s.sku}
                    </span>
                    {s.rate > 0 && (
                      <span className="text-[11px] font-bold text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] px-2 py-0.5 rounded-lg border border-[#E8C16D]/30">
                        ₹{s.rate.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {s.name && s.name.trim().toLowerCase() !== s.sku.trim().toLowerCase() && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                      {s.name}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>,
          document.body
        )}

      {/* Inward Barcode Scanner Modal */}
      <PurchaseBarcodeScanModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        items={items}
        onUpdateItems={onChangeItems}
      />
    </div>
  );
}
