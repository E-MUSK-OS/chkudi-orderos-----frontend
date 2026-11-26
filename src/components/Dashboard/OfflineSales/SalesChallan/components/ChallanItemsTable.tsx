"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Plus,
  Trash2,
  ScanBarcode,
  ArrowUp,
  PlusCircle,
  Download,
  Upload,
} from "lucide-react";
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
  additionalExpense: number;
  onChangeAdditionalExpense: (val: number) => void;
  onOpenAdditionalExpenseModal?: () => void;
  deliveryTerms: string;
  onChangeDeliveryTerms: (val: string) => void;
  preparedBy: string;
  onChangePreparedBy: (val: string) => void;
  deliveryBy: string;
  onChangeDeliveryBy: (val: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

const deliveryByOptions = [
  { value: "Select ...", label: "Select ..." },
  { value: "Buyer", label: "Buyer" },
  { value: "Courier", label: "Courier" },
  { value: "Transport", label: "Transport" },
  { value: "Self", label: "Self" },
  { value: "Other", label: "Other" },
];

export default function ChallanItemsTable({
  items,
  onChangeItems,
  additionalExpense,
  onChangeAdditionalExpense,
  onOpenAdditionalExpenseModal,
  deliveryTerms,
  onChangeDeliveryTerms,
  preparedBy,
  onChangePreparedBy,
  deliveryBy,
  onChangeDeliveryBy,
  onSave,
  isSaving = false,
}: ChallanItemsTableProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete state
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [skuSuggestions, setSkuSuggestions] = useState<ProductSkuSuggestion[]>([]);
  const [, setLoadingSuggestions] = useState(false);
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

        if (searchSeqRef.current !== currentSeq) return;

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
    const prevDelivered =
      updated[idx]?.deliveredQty ?? updated[idx]?.quantity ?? 0;
    const rate = Number(suggestion.rate) || 0;

    updated[idx] = {
      ...updated[idx],
      sku: suggestion.sku,
      name: suggestion.name || suggestion.sku,
      rate: rate,
      deliveredQty: prevDelivered,
      quantity: prevDelivered,
      amount: (Number(prevDelivered) || 0) * rate,
    };

    onChangeItems(updated);
    setActiveRowIdx(null);
    setSkuSuggestions([]);
    setDropdownCoords(null);
  };

  const handleRowChange = (
    idx: number,
    field: keyof SalesChallanItem,
    val: any,
    extraUpdates?: Partial<SalesChallanItem>
  ) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
      ...(extraUpdates || {}),
    };

    if (
      field === "deliveredQty" ||
      field === "quantity" ||
      field === "rate" ||
      extraUpdates?.deliveredQty !== undefined ||
      extraUpdates?.quantity !== undefined ||
      extraUpdates?.rate !== undefined
    ) {
      const dQty =
        val === "" && (field === "deliveredQty" || field === "quantity")
          ? 0
          : Number(updated[idx].deliveredQty) || Number(updated[idx].quantity) || 0;
      const r =
        val === "" && field === "rate"
          ? 0
          : Number(updated[idx].rate) || 0;
      updated[idx].quantity = dQty;
      updated[idx].amount = dQty * r;
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
        size: "",
        soNo: "",
        realStock: 0,
        orderQty: 0,
        deliveredQty: 0,
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

  // Dispatch All: copies Order Qty to Delivered Qty for all rows
  const handleDispatchAll = () => {
    if (items.length === 0) return;
    const updated = items.map((it) => {
      const oQty = Number(it.orderQty) || 0;
      const rate = Number(it.rate) || 0;
      const dQty =
        oQty > 0 ? oQty : Number(it.deliveredQty) || Number(it.quantity) || 0;
      return {
        ...it,
        deliveredQty: dQty,
        quantity: dQty,
        amount: dQty * rate,
      };
    });
    onChangeItems(updated);
    toast.success("Order quantities copied to delivered quantities.");
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

  // Calculate totals
  const totalDeliveredQty = items.reduce(
    (sum, item) =>
      sum + (Number(item.deliveredQty) || Number(item.quantity) || 0),
    0
  );
  const totalAmount = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.amount) ||
        (Number(item.deliveredQty) || Number(item.quantity) || 0) *
          (Number(item.rate) || 0)),
    0
  );

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm space-y-4">
      {/* Challan Details Title + Download Blank Format & Import from Excelsheet */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
          Challan Details
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadBlankExcelFormat}
            className="inline-flex items-center gap-1.5 h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
            <span>Download Blank Format</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard/settings/upload-excel?tab=salesChallan")}
            className="inline-flex items-center gap-1.5 h-8.5 sm:h-9 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl bg-[#0A0E1A] hover:bg-[#161D2E] text-[#E8C16D] dark:bg-[#080B11] dark:border dark:border-white/[0.15] dark:text-[#E8C16D] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
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

      {/* Items Table matching exact styling in Image 2 */}
      <div className="overflow-x-auto rounded-2xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#080B11] shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#F5E6BE] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] font-bold text-xs select-none whitespace-nowrap">
              <th className="py-2.5 px-2 font-bold text-center w-12 border-r border-[#F5E6BE] dark:border-white/[0.08]">
                No.
              </th>
              <th className="py-2.5 px-3 font-bold min-w-[180px] border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Product / Material / Service SKU.
              </th>
              <th className="py-2.5 px-2 font-bold w-20 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Size
              </th>
              <th className="py-2.5 px-2 font-bold w-24 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                SO No.
              </th>
              <th className="py-2.5 px-2 font-bold w-24 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Real Stock.
              </th>
              <th className="py-2.5 px-2 font-bold w-24 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Order Qty.
              </th>
              <th className="py-2.5 px-2 font-bold w-24 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Delivered Qty.
              </th>
              <th className="py-2.5 px-2 font-bold w-20 text-center border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Rate.
              </th>
              <th className="py-2.5 px-3 font-bold min-w-[100px] text-right border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Amount.
              </th>
              <th className="py-2.5 px-3 font-bold min-w-[160px] border-r border-[#F5E6BE] dark:border-white/[0.08]">
                Remark.
              </th>
              <th className="py-2.5 px-2 font-bold text-center w-12">
                Del.
              </th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              /* Empty state matching Image 2 */
              <tr>
                <td colSpan={11} className="py-16 px-4 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl select-none" role="img" aria-label="No data">
                      📋
                    </span>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      No data available
                    </p>
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

                  {/* 2. Product / Material / Service SKU. */}
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
                      placeholder="Product / Material / Service SKU"
                      className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none font-mono"
                    />
                  </td>

                  {/* 3. Size */}
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

                  {/* 4. SO No. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="text"
                      value={item.soNo || ""}
                      onChange={(e) =>
                        handleRowChange(idx, "soNo", e.target.value)
                      }
                      placeholder="SO No."
                      className="w-full h-8 px-2 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none"
                    />
                  </td>

                  {/* 5. Real Stock. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="number"
                      min="0"
                      value={item.realStock === undefined || item.realStock === null ? "" : item.realStock}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? "" : Number(raw);
                        handleRowChange(idx, "realStock", val, { pendingQty: typeof val === "number" ? val : 0 });
                      }}
                      className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-bold font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* 6. Order Qty. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="number"
                      min="0"
                      value={item.orderQty === undefined || item.orderQty === null ? "" : item.orderQty}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? "" : Number(raw);
                        handleRowChange(idx, "orderQty", val);
                      }}
                      className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white font-bold font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* 7. Delivered Qty. */}
                  <td className="py-1.5 px-2 text-center border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="number"
                      min="0"
                      value={item.deliveredQty === undefined || item.deliveredQty === null ? "" : item.deliveredQty}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const val = raw === "" ? "" : Number(raw);
                        handleRowChange(idx, "deliveredQty", val, { quantity: typeof val === "number" ? val : 0 });
                      }}
                      className="w-full h-8 px-1 text-xs text-center bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-[#B88728] dark:text-[#E8C16D] font-bold font-mono focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>

                  {/* 8. Rate. */}
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

                  {/* 9. Amount. */}
                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-[#E8C16D] border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    ₹{" "}
                    {(
                      item.amount ??
                      (Number(item.deliveredQty || item.quantity) || 0) *
                        (Number(item.rate) || 0)
                    ).toFixed(2)}
                  </td>

                  {/* 10. Remark. */}
                  <td className="py-1.5 px-2 border-r border-[#F5E6BE]/60 dark:border-white/[0.06]">
                    <input
                      type="text"
                      value={item.remarks || item.name || ""}
                      onChange={(e) => {
                        handleRowChange(idx, "remarks", e.target.value, { name: e.target.value });
                      }}
                      placeholder="Remark"
                      className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-[#0A0E1A] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none"
                    />
                  </td>

                  {/* 11. Delete */}
                  <td className="py-1.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(idx)}
                      title="Delete item"
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Summary Row matching Image 2 */}
          <tfoot className="border-t border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] select-none text-xs font-bold">
            <tr>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-3 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-2 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              {/* Total Label under Order Qty. (Column 6) */}
              <td className="py-2.5 px-2 text-right font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase tracking-wider border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                Total:
              </td>
              {/* Delivered Qty Total (Column 7) */}
              <td className="py-2.5 px-2 text-center font-bold font-mono text-[#0A0E1A] dark:text-white border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                {totalDeliveredQty}
              </td>
              {/* Total Label under Rate. (Column 8) */}
              <td className="py-2.5 px-2 text-right font-bold text-[#6A4D1D] dark:text-[#E8C16D] uppercase tracking-wider border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                Total:
              </td>
              {/* Amount Total (Column 9) */}
              <td className="py-2.5 px-3 text-right font-bold font-mono text-[#B88728] dark:text-[#E8C16D] border-r border-[#E8C16D]/30 dark:border-white/[0.08]">
                ₹ {totalAmount.toFixed(2)}
              </td>
              <td className="py-2.5 px-3 border-r border-[#E8C16D]/30 dark:border-white/[0.08]"></td>
              <td className="py-2.5 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Row Below Table: Action Buttons on Left, Additional Expense & Delivery Terms on Right */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: [+ Add] */}
        <div className="flex flex-wrap items-center gap-2">
          {/* + Add Button */}
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 h-8.5 sm:h-9 px-3.5 sm:px-4 rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
            <span>Add</span>
          </button>
        </div>

        {/* Right: Additional Expense. & Delivery Terms. */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Additional Expense. */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAdditionalExpenseModal}
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 underline decoration-dotted underline-offset-4 hover:text-[#B88728] dark:hover:text-[#E8C16D] whitespace-nowrap cursor-pointer transition-colors"
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
              className="h-8.5 sm:h-9 w-24 px-2.5 text-center font-mono font-semibold bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Delivery Terms. */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Delivery Terms.
            </label>
            <input
              type="text"
              value={deliveryTerms}
              onChange={(e) => onChangeDeliveryTerms(e.target.value)}
              placeholder="Delivery Terms."
              className="h-8.5 sm:h-9 w-48 sm:w-56 px-3 text-xs bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar: Prepared By, Delivered By on Left, [+ Save] on Right matching Image 3 & 4 */}
      <div className="pt-4 border-t border-[#E7E0D2] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left Side: Prepared By, Delivered By */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Prepared By */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Prepared by
            </label>
            <input
              type="text"
              value={preparedBy}
              readOnly
              placeholder="Prepared by"
              className="h-9 sm:h-10 px-3.5 text-xs sm:text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl sm:rounded-2xl text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none transition-all shadow-xs cursor-not-allowed"
            />
          </div>

          {/* Delivered By */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Delivery by
            </label>
            <ThemeSelectDropdown
              value={deliveryBy}
              onChange={onChangeDeliveryBy}
              options={deliveryByOptions}
              buttonClassName="h-9 sm:h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white w-36 justify-between"
              menuClassName="min-w-[150px]"
            />
          </div>
        </div>

        {/* Right Side: Save Challan Button */}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-transparent bg-[#E8C16D] px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer shrink-0 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.2]" />
            <span>{isSaving ? "Saving..." : "Save Challan"}</span>
          </button>
        )}
      </div>

      {/* Portal Autocomplete Dropdown */}
      {(() => {
        const currentSearchText =
          activeRowIdx !== null
            ? (items[activeRowIdx]?.sku || "").trim().toLowerCase()
            : "";

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
                  {sugg.name &&
                    sugg.name.toLowerCase() !== sugg.sku.toLowerCase() && (
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

      {/* Barcode Scanner Modal */}
      <BarcodeScanModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        items={items}
        onUpdateItems={onChangeItems}
      />
    </div>
  );
}
