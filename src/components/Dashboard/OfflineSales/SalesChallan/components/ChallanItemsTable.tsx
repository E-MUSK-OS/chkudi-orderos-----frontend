"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Printer, Upload, Download, ScanBarcode, Check } from "lucide-react";
import { SalesChallanItem, ProductSkuSuggestion } from "../types/challan.types";
import { challanService } from "../services/challan.service";
import {
  downloadBlankExcelFormat,
  parseChallanItemsFromExcel,
} from "../utils/excelHelper";
import { toast } from "sonner";
import BarcodeScanModal from "./BarcodeScanModal";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";

interface ChallanItemsTableProps {
  items: SalesChallanItem[];
  onChangeItems: (items: SalesChallanItem[]) => void;
  deliveryBy: string;
  onChangeDeliveryBy: (val: string) => void;
  preparedBy: string;
  onChangePreparedBy: (val: string) => void;
  deliveryTerms: string;
  onChangeDeliveryTerms: (val: string) => void;
}

export default function ChallanItemsTable({
  items,
  onChangeItems,
  deliveryBy,
  onChangeDeliveryBy,
  preparedBy,
  onChangePreparedBy,
  deliveryTerms,
  onChangeDeliveryTerms,
}: ChallanItemsTableProps) {
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

  // Fetch SKU suggestions when typing in Particulars [SKU] with debounce and race condition guards
  const handleSkuChange = (idx: number, skuValue: string) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      sku: skuValue,
    };
    onChangeItems(updated);
    setActiveRowIdx(idx);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = skuValue.trim();
    if (!trimmed) {
      setSkuSuggestions([]);
      return;
    }

    // Immediately filter current suggestions so non-matching items vanish instantly
    setSkuSuggestions((prev) =>
      prev.filter(
        (s) =>
          s.sku.toLowerCase().includes(trimmed.toLowerCase()) ||
          (s.name && s.name.toLowerCase().includes(trimmed.toLowerCase()))
      )
    );

    const currentSeq = ++searchSeqRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const results = await challanService.searchSkus(trimmed);

        // Discard result if user typed something else while request was in-flight
        if (searchSeqRef.current !== currentSeq) {
          return;
        }

        setSkuSuggestions(results);
        if (activeInputRef.current) {
          updateDropdownCoords(activeInputRef.current);
        }
      } catch (err) {
        console.error("SKU Search Error:", err);
      } finally {
        if (searchSeqRef.current === currentSeq) {
          setLoadingSuggestions(false);
        }
      }
    }, 180);
  };

  const handleSelectSku = (idx: number, suggestion: ProductSkuSuggestion) => {
    const updated = [...items];
    const prevQty = updated[idx]?.quantity || 1;
    const rate = Number(suggestion.rate) || 0;

    updated[idx] = {
      ...updated[idx],
      sku: suggestion.sku,
      name: suggestion.name || suggestion.sku,
      rate: rate,
      quantity: prevQty,
      amount: prevQty * rate,
    };

    onChangeItems(updated);
    setActiveRowIdx(null);
    setSkuSuggestions([]);
    setDropdownCoords(null);
  };

  const handleRowChange = (
    idx: number,
    field: keyof SalesChallanItem,
    val: any
  ) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    };
    if (field === "quantity" || field === "rate") {
      const q = field === "quantity" ? Number(val) || 0 : updated[idx].quantity;
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
        quantity: 0,
        rate: 0.0,
        amount: 0.0,
        dispatchDate: "1",
        subCn: "",
        remarks: "",
        printBarcode: true,
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
      toast.loading("Importing excel sheet...", { id: "excel-import" });
      const imported = await parseChallanItemsFromExcel(file);
      if (imported.length === 0) {
        toast.error("No valid items found in excel file.", { id: "excel-import" });
        return;
      }
      onChangeItems(imported);
      toast.success(`Successfully imported ${imported.length} items!`, {
        id: "excel-import",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to import excel sheet.", {
        id: "excel-import",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Calculate total quantity
  const totalQuantity = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header & Excel action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-bold text-[#0A0E1A] dark:text-white">Challan Details</h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadBlankExcelFormat}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Download Blank Format</span>
            </button>

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

        {/* Table of items */}
        <div className="overflow-x-auto rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] mb-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FEFAEE] dark:bg-none text-[#6A4D1D] dark:bg-[#080B11] dark:text-[#E8C16D] font-bold select-none whitespace-nowrap border-b border-[#F5E6BE] dark:border-white/[0.08]">
                <th className="py-2.5 px-3 font-semibold text-center w-10 border-r border-[#F5E6BE] dark:border-white/[0.06]">
                  No.
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-[#F5E6BE] dark:border-white/[0.06] min-w-[170px]">
                  Particulars [SKU]
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-[#F5E6BE] dark:border-white/[0.06] min-w-[200px]">
                  Particulars [Name]
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-[#F5E6BE] dark:border-white/[0.06] text-center w-20">
                  Quantity
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-[#F5E6BE] dark:border-white/[0.06] text-center w-20">
                  Rate
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-[#F5E6BE] dark:border-white/[0.06] text-center w-20">
                  Dis.Date
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-[#F5E6BE] dark:border-white/[0.06] min-w-[90px]">
                  Sub C.N
                </th>
                <th className="py-2.5 px-3 font-semibold border-r border-[#F5E6BE] dark:border-white/[0.06] min-w-[130px]">
                  Remarks
                </th>
                <th className="py-2.5 px-2 font-semibold border-r border-[#F5E6BE] dark:border-white/[0.06] text-center w-12">
                  Del.
                </th>
                <th className="py-2.5 px-2 font-semibold text-center w-10">
                  <Printer className="w-3.5 h-3.5 mx-auto" />
                </th>
              </tr>
            </thead>

            <tbody>
              {items.length === 0 ? (
                <tr className="border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
                  <td
                    colSpan={10}
                    className="py-6 px-4 text-slate-400 dark:text-slate-500 font-normal italic text-center"
                  >
                    No detail records found.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                return (
                  <tr
                    key={idx}
                    className="border-b border-[#E7E0D2]/60 dark:border-white/[0.06] hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {/* No. */}
                    <td className="py-2 px-2.5 text-center text-slate-700 dark:text-slate-300 font-semibold border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                      {idx + 1}
                    </td>

                    {/* Particulars [SKU] with Autocomplete */}
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

                    {/* Quantity */}
                    <td className="py-1.5 px-1.5 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          handleRowChange(idx, "quantity", e.target.value)
                        }
                        className="w-full h-8.5 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-semibold focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all shadow-2xs"
                      />
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
                        className="w-full h-8.5 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-medium focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Dis.Date */}
                    <td className="py-1.5 px-1.5 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] text-center">
                      <input
                        type="text"
                        value={item.dispatchDate || ""}
                        onChange={(e) =>
                          handleRowChange(idx, "dispatchDate", e.target.value)
                        }
                        placeholder="1"
                        className="w-full h-8.5 px-1 text-xs text-center bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Sub C.N */}
                    <td className="py-1.5 px-2 border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                      <input
                        type="text"
                        value={item.subCn || ""}
                        onChange={(e) =>
                          handleRowChange(idx, "subCn", e.target.value)
                        }
                        className="w-full h-8.5 px-2 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none transition-all shadow-2xs"
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
                        className="w-full h-8.5 px-2 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] focus:outline-none transition-all shadow-2xs"
                      />
                    </td>

                    {/* Del. */}
                    <td className="py-1.5 px-1 border-r border-[#E7E0D2]/60 dark:border-white/[0.06] text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        title="Delete item"
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* Print Barcode Checkbox */}
                    <td className="py-1.5 px-1 text-center">
                      <input
                        type="checkbox"
                        checked={item.printBarcode !== false}
                        onChange={(e) =>
                          handleRowChange(idx, "printBarcode", e.target.checked)
                        }
                        className="cursor-pointer rounded accent-[#0A0E1A] dark:accent-[#F5C451] w-4 h-4"
                        style={{ accentColor: "#0A0E1A" }}
                      />
                    </td>
                  </tr>
                );
              }))}

              {/* Total Row */}
              {items.length > 0 && (
                <tr className="bg-slate-50/80 dark:bg-white/[0.03] border-t-2 border-[#E7E0D2] dark:border-white/[0.08] font-bold text-xs">
                  <td colSpan={3} className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200">
                    Total:
                  </td>
                  <td className="py-2.5 px-1 text-center text-slate-900 dark:text-white font-bold border-r border-[#E7E0D2]/60 dark:border-white/[0.06]">
                    {totalQuantity}
                  </td>
                  <td colSpan={6}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action icons below table (+ button) */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={handleAddRow}
            title="Add New Row"
            className="h-9 w-9 border border-[#E8C16D]/60 bg-[#FEFAEE] text-[#6A4D1D] hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 dark:bg-[#080B11] dark:border dark:border-white/[0.15] dark:text-[#E8C16D] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Form Fields */}
      <div className="pt-4 border-t border-[#E7E0D2] dark:border-white/[0.08] space-y-3 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Delivery by */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[80px]">
              Delivery by
            </label>
            <ThemeSelectDropdown
              value={deliveryBy}
              onChange={onChangeDeliveryBy}
              options={[
                { value: "Buyer", label: "Buyer" },
                { value: "Seller", label: "Seller" },
                { value: "Courier", label: "Courier" },
                { value: "Transporter", label: "Transporter" },
                { value: "Self", label: "Self" },
              ]}
              buttonClassName="h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white w-36 justify-between"
              menuClassName="min-w-[150px]"
            />
          </div>

          {/* Prepared by */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[80px]">
              Prepared by
            </label>
            <input
              type="text"
              value={preparedBy}
              onChange={(e) => onChangePreparedBy(e.target.value)}
              placeholder="Ramesh"
              className="h-10 px-3.5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 focus:outline-none transition-all flex-1 shadow-xs"
            />
          </div>
        </div>

        {/* Delivery Terms */}
        <div className="flex items-start gap-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[80px] pt-2">
            Delivery Terms
          </label>
          <textarea
            rows={2}
            value={deliveryTerms}
            onChange={(e) => onChangeDeliveryTerms(e.target.value)}
            placeholder="Specify any delivery instructions or terms..."
            className="w-full p-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 focus:outline-none resize-none transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Portal-rendered Autocomplete Dropdown */}
      {(() => {
        const currentSearchText =
          activeRowIdx !== null ? (items[activeRowIdx]?.sku || "").trim().toLowerCase() : "";

        const visibleSuggestions = skuSuggestions.filter((s) => {
          if (!currentSearchText) return true;
          return (
            s.sku.toLowerCase().includes(currentSearchText) ||
            (s.name && s.name.toLowerCase().includes(currentSearchText))
          );
        });

        if (
          activeRowIdx === null ||
          visibleSuggestions.length === 0 ||
          dropdownCoords === null ||
          typeof document === "undefined"
        ) {
          return null;
        }

        return createPortal(
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
            className="bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] rounded-2xl shadow-2xl max-h-60 overflow-y-auto text-xs py-1.5 animate-in fade-in zoom-in-95 duration-100"
          >
            {visibleSuggestions.map((sugg, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => handleSelectSku(activeRowIdx, sugg)}
                className="w-full text-left px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.04] last:border-none hover:bg-[#FFF9EC]/60 dark:hover:bg-white/[0.04] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-xs">
                    {sugg.sku}
                  </div>
                  {sugg.name && sugg.name.toLowerCase() !== sugg.sku.toLowerCase() && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                      {sugg.name}
                    </div>
                  )}
                </div>
                {sugg.rate > 0 && (
                  <div className="text-[11px] font-bold text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] px-2 py-0.5 rounded-lg border border-[#E8C16D]/30">
                    ₹{sugg.rate.toFixed(2)}
                  </div>
                )}
              </button>
            ))}
          </div>,
          document.body
        );
      })()}

      {/* Barcode / SKU Scanner Modal */}
      <BarcodeScanModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        items={items}
        onUpdateItems={onChangeItems}
      />
    </div>
  );
}
