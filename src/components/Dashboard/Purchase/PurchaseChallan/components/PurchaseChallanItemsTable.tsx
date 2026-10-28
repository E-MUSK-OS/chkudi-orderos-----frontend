"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Upload, Download, ScanBarcode } from "lucide-react";
import Button from "@/components/ui/Button";
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
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSkuChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], sku: val };
    onChangeItems(updated);

    setActiveRowIdx(index);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      const seq = ++searchSeqRef.current;
      setLoadingSuggestions(true);
      try {
        const results = await purchaseChallanService.searchSkus(val);
        if (seq === searchSeqRef.current) {
          setSkuSuggestions(results);
        }
      } catch (err) {
        console.error("SKU search failed:", err);
      } finally {
        if (seq === searchSeqRef.current) {
          setLoadingSuggestions(false);
        }
      }
    }, 200);
  };

  const handleSelectSku = (index: number, suggestion: ProductSkuSuggestion) => {
    const updated = [...items];
    const realProductName =
      suggestion.name &&
      suggestion.name.trim().toLowerCase() !== suggestion.sku.trim().toLowerCase()
        ? suggestion.name.trim()
        : "";

    updated[index] = {
      ...updated[index],
      sku: suggestion.sku,
      name: realProductName || updated[index].name || "",
      rate: suggestion.rate || updated[index].rate || 0,
      amount: (updated[index].receivedQty || 0) * (suggestion.rate || updated[index].rate || 0),
    };
    onChangeItems(updated);
    setActiveRowIdx(null);
    setSkuSuggestions([]);
  };

  const handleRowChange = (
    index: number,
    field: keyof PurchaseChallanItem,
    val: any
  ) => {
    const updated = [...items];
    const targetItem = { ...updated[index], [field]: val };

    if (field === "receivedQty" || field === "rate") {
      const rec = Number(field === "receivedQty" ? val : targetItem.receivedQty) || 0;
      const rate = Number(field === "rate" ? val : targetItem.rate) || 0;
      targetItem.amount = rec * rate;
    }

    updated[index] = targetItem;
    onChangeItems(updated);
  };

  const handleAddRow = () => {
    const newItem: PurchaseChallanItem = {
      itemNo: items.length + 1,
      sku: "",
      name: "",
      orderedQty: 0,
      receivedQty: 0,
      rate: 0,
      amount: 0,
      poNo: "",
      partyChallanNo: "",
      receivedDate: "",
      remarks: "",
      printBarcode: true,
    };
    onChangeItems([...items, newItem]);
  };

  const handleDeleteRow = (index: number) => {
    const filtered = items
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, itemNo: idx + 1 }));
    onChangeItems(filtered);
    if (activeRowIdx === index) {
      setActiveRowIdx(null);
      setSkuSuggestions([]);
    } else if (activeRowIdx !== null && activeRowIdx > index) {
      setActiveRowIdx(activeRowIdx - 1);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedItems = await parsePurchaseItemsFromExcel(file);
      if (parsedItems.length === 0) {
        toast.warning("No valid items found in excel file.");
        return;
      }
      onChangeItems(parsedItems);
      toast.success(`Successfully imported ${parsedItems.length} items.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to parse excel file.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const totalOrderedQty = items.reduce(
    (sum, item) => sum + (Number(item.orderedQty) || 0),
    0
  );
  const totalReceivedQty = items.reduce(
    (sum, item) => sum + (Number(item.receivedQty) || 0),
    0
  );

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]">
      {/* Table Header Row: Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Challan Details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Specify SKU, ordered vs. received quantities, and unit rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Download Template Button */}
          <Button
            variant="outline"
            fullWidth={false}
            className="h-8.5 px-3.5 rounded-xl text-xs font-semibold"
            leftIcon={<Download size={14} />}
            onClick={downloadPurchaseBlankFormatExcel}
          >
            Download Template
          </Button>

          {/* Import from Excelsheet Button */}
          <Button
            variant="primary"
            fullWidth={false}
            className="h-8.5 px-3.5 rounded-xl text-xs font-bold"
            leftIcon={<Upload size={14} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Import from Excelsheet
          </Button>
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
      <div className="overflow-x-auto rounded-xl border border-[#E7E0D2] dark:border-white/[0.08] mb-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Header styled with SaaS Dark Obsidian & Gold palette */}
            <tr className="bg-[#0A0E1A] text-white dark:bg-[#080B11] dark:text-[#E8C16D] select-none whitespace-nowrap">
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
              <th className="py-2.5 px-2 font-semibold border-r border-slate-800 dark:border-white/[0.06] min-w-[130px]">
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
                      className="w-full h-8 px-2 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none transition-all"
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
                      className="w-full h-8 px-2 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none transition-all"
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
                      className="w-full h-8 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-white font-semibold focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
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
                        className="w-full h-8 pl-1.5 pr-8 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-white font-bold focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
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
                      className="w-full h-8 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
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
                      className="w-full h-8 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none transition-all"
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
                      className="w-full h-8 px-2 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none transition-all"
                    />
                  </td>

                  {/* Rec.Date */}
                  <td className="py-1.5 px-2 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] min-w-[130px]">
                    <DatePicker
                      value={item.receivedDate || ""}
                      onChange={(_, dateStr) =>
                        handleRowChange(idx, "receivedDate", dateStr || "")
                      }
                      placeholder="DD-MM-YYYY"
                      className="w-full"
                      buttonClassName="h-8 sm:h-8 !h-8 px-2 text-xs rounded-lg bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-white hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] justify-between"
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
                      className="w-full h-8 px-2 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none transition-all"
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

      {/* Action icons below table (+ and Barcode scanner) */}
      <div className="flex items-center gap-2 my-3.5">
        {/* Gold + Button */}
        <button
          type="button"
          onClick={handleAddRow}
          title="Add New Row"
          className="h-8 w-8 bg-[#0A0E1A] hover:bg-[#161D2E] text-white dark:bg-[#F5C451] dark:text-[#080B11] dark:hover:bg-[#E8B83D] rounded-xl flex items-center justify-center transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Gold Barcode Scanner Gun Button (Commented out) */}
        {/*
        <button
          type="button"
          onClick={() => setIsBarcodeModalOpen(true)}
          title="Scan Inward Barcodes"
          className="h-8 w-8 bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#1A160E] dark:text-[#E8C16D] hover:bg-[#F5C451] hover:text-[#0A0E1A] rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <ScanBarcode className="w-4 h-4" />
        </button>
        */}
      </div>

      {/* Bottom Form Fields: Delivery & Inward Verification */}
      <div className="pt-4 border-t border-[#E7E0D2] dark:border-white/[0.08] space-y-2.5">
        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
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
              className="h-9 w-full px-3 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
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
              className="h-9 w-full px-3 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
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
              className="h-9 w-full px-3 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
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
              className="h-9 w-full px-3 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
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
              className="h-9 w-full px-3 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
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
            style={{
              position: "fixed",
              top: `${dropdownCoords.top}px`,
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
            }}
            className="z-[9999] max-h-56 overflow-y-auto bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.12] rounded-xl shadow-2xl divide-y divide-slate-100 dark:divide-white/[0.04] text-xs"
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectSku(activeRowIdx, s);
                  }}
                  className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {s.sku}
                    </span>
                    {s.rate > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{s.rate}
                      </span>
                    )}
                  </div>
                  {s.name && s.name.trim().toLowerCase() !== s.sku.trim().toLowerCase() && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
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
