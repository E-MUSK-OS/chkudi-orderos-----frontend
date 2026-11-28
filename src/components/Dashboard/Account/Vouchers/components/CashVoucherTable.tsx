"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Pin,
  PinOff,
  EyeOff,
  Edit3,
  Eye,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import type { CashVoucher } from "../types/cashVoucher.types";

export type PinnedSide = "left" | "right";

interface CashVoucherTableProps {
  vouchers: CashVoucher[];
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  totalPaymentSum: number;
  totalReceiptSum: number;
  visibleColumns: Record<string, boolean>;
  pinnedColumns: Record<string, PinnedSide>;
  showAggregations: boolean;
  sortField: string;
  sortAsc: boolean;
  onSortChange: (field: string, asc?: boolean) => void;
  onClearSort: () => void;
  onPinColumn: (colKey: string, side: PinnedSide | null) => void;
  onHideColumn: (colKey: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onView: (voucher: CashVoucher) => void;
  onEdit: (voucher: CashVoucher) => void;
  onDelete: (voucher: CashVoucher) => void;
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
}

function formatDateDisplay(dateVal?: string | null): string {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatINR(amount: number): string {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSum(amount: number): string {
  return Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ColumnDef {
  key: string;
  label: string;
  sortKey?: string;
  align?: "left" | "center" | "right";
  widthClass?: string;
  defaultWidth: number;
}

const COLUMNS: ColumnDef[] = [
  { key: "no", label: "No.", align: "center", widthClass: "w-14", defaultWidth: 56 },
  { key: "voucherNo", label: "Voucher No.", sortKey: "voucherNo", defaultWidth: 120 },
  { key: "date", label: "Date.", sortKey: "date", defaultWidth: 120 },
  { key: "entryType", label: "Entry Type.", sortKey: "entryType", defaultWidth: 140 },
  { key: "cashBookName", label: "Cash Book.", sortKey: "cashBookName", defaultWidth: 170 },
  { key: "partyName", label: "Party.", sortKey: "partyName", defaultWidth: 220 },
  { key: "payment", label: "Payment", sortKey: "amount", align: "right", defaultWidth: 150 },
  { key: "receipt", label: "Receipt", sortKey: "amount", align: "right", defaultWidth: 150 },
  { key: "actions", label: "Actions", align: "center", widthClass: "w-28", defaultWidth: 112 },
];

export default function CashVoucherTable({
  vouchers,
  loading,
  page,
  limit,
  total,
  totalPages,
  totalPaymentSum,
  totalReceiptSum,
  visibleColumns,
  pinnedColumns,
  showAggregations,
  sortField,
  sortAsc,
  onSortChange,
  onClearSort,
  onPinColumn,
  onHideColumn,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onDelete,
  tableContainerRef,
}: CashVoucherTableProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const resolvedTableRef = tableContainerRef || internalRef;

  const [openMenuCol, setOpenMenuCol] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);
  const thRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  const isColVisible = (key: string) => visibleColumns[key] !== false;

  const orderedColumns = useMemo(() => {
    const visible = COLUMNS.filter((c) => isColVisible(c.key));
    const left = visible.filter((c) => pinnedColumns[c.key] === "left");
    const middle = visible.filter((c) => !pinnedColumns[c.key]);
    const right = visible.filter((c) => pinnedColumns[c.key] === "right");
    return [...left, ...middle, ...right];
  }, [visibleColumns, pinnedColumns]);

  useEffect(() => {
    const measured: Record<string, number> = {};
    for (const col of orderedColumns) {
      const el = thRefs.current[col.key];
      if (el) measured[col.key] = el.offsetWidth;
    }
    setColWidths(measured);
  }, [orderedColumns, vouchers.length]);

  const stickyOffsets = useMemo(() => {
    const leftOffsets: Record<string, number> = {};
    let accLeft = 0;
    for (const col of orderedColumns) {
      if (pinnedColumns[col.key] === "left") {
        leftOffsets[col.key] = accLeft;
        accLeft += colWidths[col.key] || col.defaultWidth;
      }
    }

    const rightOffsets: Record<string, number> = {};
    let accRight = 0;
    for (let i = orderedColumns.length - 1; i >= 0; i--) {
      const col = orderedColumns[i];
      if (pinnedColumns[col.key] === "right") {
        rightOffsets[col.key] = accRight;
        accRight += colWidths[col.key] || col.defaultWidth;
      }
    }

    return { leftOffsets, rightOffsets };
  }, [orderedColumns, pinnedColumns, colWidths]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = menuContainerRef.current?.contains(target);
      const inPortal = portalMenuRef.current?.contains(target);
      if (!inTrigger && !inPortal) {
        setOpenMenuCol(null);
      }
    };
    const handleScrollOrResize = () => setOpenMenuCol(null);

    if (openMenuCol) {
      document.addEventListener("mousedown", handleOutside);
      window.addEventListener("resize", handleScrollOrResize);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [openMenuCol]);

  const handleOpenColMenu = (e: React.MouseEvent<HTMLButtonElement>, colKey: string) => {
    e.stopPropagation();
    if (openMenuCol === colKey) {
      setOpenMenuCol(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 192;
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8
    );
    const top = Math.min(rect.bottom + 6, window.innerHeight - 260);
    setMenuPosition({ top, left });
    setOpenMenuCol(colKey);
  };

  const startIndex = (page - 1) * limit;
  const cellBorder = "border-r border-[#F0EAE0] dark:border-white/[0.06] last:border-r-0";
  const headBorder = "border-r border-[#F5E6BE] dark:border-white/[0.08] last:border-r-0";

  const getPinStyleAndClass = (key: string, surface: "head" | "body" | "foot") => {
    const side = pinnedColumns[key];
    if (!side) return { className: "", style: undefined as React.CSSProperties | undefined };

    const bg =
      surface === "head"
        ? "bg-[#FEFAEE] dark:bg-[#080B11] z-20"
        : surface === "foot"
        ? "bg-[#FEFAEE] dark:bg-[#080B11] z-20"
        : "bg-white dark:bg-[#0F1626] z-10";

    if (side === "left") {
      return {
        className: `sticky ${bg} shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]`,
        style: { left: `${stickyOffsets.leftOffsets[key] ?? 0}px` },
      };
    }

    return {
      className: `sticky ${bg} shadow-[-2px_0_6px_-2px_rgba(0,0,0,0.08)]`,
      style: { right: `${stickyOffsets.rightOffsets[key] ?? 0}px` },
    };
  };

  const renderBodyCell = (col: ColumnDef, v: CashVoucher, rowIdx: number) => {
    const isPayment = v.entryType === "Payment" || v.entryType === "Advanced Payment";
    const isReceipt = v.entryType === "Receipt" || v.entryType === "Advance Receipt";
    const pin = getPinStyleAndClass(col.key, "body");

    switch (col.key) {
      case "no":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 text-center text-[#8B7D65] dark:text-slate-400 tabular-nums ${cellBorder} ${pin.className}`}
          >
            {startIndex + rowIdx + 1}
          </td>
        );
      case "voucherNo":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 font-medium tabular-nums ${cellBorder} ${pin.className}`}
          >
            {v.voucherNo}
          </td>
        );
      case "date":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 whitespace-nowrap tabular-nums ${cellBorder} ${pin.className}`}
          >
            {formatDateDisplay(v.date)}
          </td>
        );
      case "entryType":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 whitespace-nowrap ${cellBorder} ${pin.className}`}
          >
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                isReceipt
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
              }`}
            >
              {v.entryType}
            </span>
          </td>
        );
      case "cashBookName":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 whitespace-nowrap font-medium ${cellBorder} ${pin.className}`}
          >
            {v.cashBookName}
          </td>
        );
      case "partyName":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 whitespace-nowrap ${cellBorder} ${pin.className}`}
          >
            {v.partyName}
          </td>
        );
      case "payment":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 whitespace-nowrap text-right font-medium tabular-nums ${cellBorder} ${pin.className}`}
          >
            {isPayment ? `₹ ${formatINR(v.amount)} Cr.` : "0"}
          </td>
        );
      case "receipt":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 whitespace-nowrap text-right font-medium tabular-nums ${cellBorder} ${pin.className}`}
          >
            {isReceipt ? `₹ ${formatINR(v.amount)} Dr.` : "0"}
          </td>
        );
      case "actions":
        return (
          <td
            key={col.key}
            style={pin.style}
            className={`px-3 sm:px-4 py-2.5 text-center whitespace-nowrap ${cellBorder} ${pin.className}`}
          >
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => onView(v)}
                title="View Cash Voucher"
                className="inline-flex items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(v)}
                title="Edit Cash Voucher"
                className="inline-flex items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#B88728] dark:hover:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] border border-transparent hover:border-[#E8C16D]/30 transition-all cursor-pointer"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(v)}
                title="Delete Cash Voucher"
                className="inline-flex items-center justify-center p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={menuContainerRef}
      className="flex flex-col min-h-0 max-h-full overflow-hidden w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm font-sans"
    >
      <div
        ref={resolvedTableRef}
        className="w-full min-h-0 flex-1 overflow-x-auto overflow-y-auto custom-scrollbar overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[960px] text-left border-collapse">
          <thead className="sticky top-0 z-20 bg-[#FEFAEE] dark:bg-[#080B11] text-xs font-semibold tracking-wide text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08] select-none">
            <tr>
              {orderedColumns.map((col) => {
                const isSorted = col.sortKey && sortField === col.sortKey;
                const isPinned = pinnedColumns[col.key];
                const isMenuOpen = openMenuCol === col.key;
                const pin = getPinStyleAndClass(col.key, "head");

                return (
                  <th
                    key={col.key}
                    ref={(el) => {
                      thRefs.current[col.key] = el;
                    }}
                    style={pin.style}
                    className={`group relative whitespace-nowrap px-3 sm:px-4 py-3 ${col.widthClass || ""} ${headBorder} ${pin.className}`}
                  >
                    <div
                      className={`flex items-center gap-1.5 ${
                        col.align === "right"
                          ? "justify-end"
                          : col.align === "center"
                          ? "justify-center"
                          : "justify-between"
                      }`}
                    >
                      {col.sortKey ? (
                        <button
                          type="button"
                          onClick={() => onSortChange(col.sortKey!)}
                          className="inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
                        >
                          <span>{col.label}</span>
                          <span
                            className={`transition-opacity duration-150 ${
                              isSorted
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {isSorted ? (
                              sortAsc ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            )}
                          </span>
                        </button>
                      ) : (
                        <span>{col.label}</span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleOpenColMenu(e, col.key)}
                        className={`p-1 rounded-md transition-opacity cursor-pointer hover:bg-[#F5E6BE]/60 dark:hover:bg-white/[0.08] ${
                          isPinned || isMenuOpen
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                        title="Column options"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EAE0] dark:divide-white/[0.06] text-xs sm:text-sm text-[#0A0E1A] dark:text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={orderedColumns.length} className="py-16 text-center">
                  <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#8B7D65] dark:text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading cash vouchers...</span>
                  </div>
                </td>
              </tr>
            ) : vouchers.length === 0 ? (
              <tr>
                <td
                  colSpan={orderedColumns.length}
                  className="py-16 text-center text-xs sm:text-sm text-[#8B7D65] dark:text-slate-400"
                >
                  No cash vouchers found. Click &ldquo;+ Create&rdquo; to add a voucher.
                </td>
              </tr>
            ) : (
              vouchers.map((v, rowIdx) => (
                <tr
                  key={v.id}
                  className="hover:bg-[#FFF9EC]/60 dark:hover:bg-white/[0.03] transition-colors"
                >
                  {orderedColumns.map((col) => renderBodyCell(col, v, rowIdx))}
                </tr>
              ))
            )}
          </tbody>

          {showAggregations && (
            <tfoot className="sticky bottom-0 z-20 bg-[#FEFAEE] dark:bg-[#080B11] border-t border-[#F5E6BE] dark:border-white/[0.08] text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white">
              <tr>
                {orderedColumns.map((col, idx) => {
                  const pin = getPinStyleAndClass(col.key, "foot");
                  if (idx === 0) {
                    return (
                      <td
                        key={col.key}
                        style={pin.style}
                        className={`px-3 sm:px-4 py-2.5 text-[#6A4D1D] dark:text-[#E8C16D] ${headBorder} ${pin.className}`}
                      >
                        Total. {total}
                      </td>
                    );
                  }
                  if (col.key === "payment") {
                    return (
                      <td
                        key={col.key}
                        style={pin.style}
                        className={`px-3 sm:px-4 py-2.5 whitespace-nowrap ${headBorder} ${pin.className}`}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[#8B7D65] dark:text-slate-400 font-semibold">
                            Sum.
                          </span>
                          <span className="tabular-nums">{formatSum(totalPaymentSum)}</span>
                        </div>
                      </td>
                    );
                  }
                  if (col.key === "receipt") {
                    return (
                      <td
                        key={col.key}
                        style={pin.style}
                        className={`px-3 sm:px-4 py-2.5 whitespace-nowrap ${headBorder} ${pin.className}`}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-[#8B7D65] dark:text-slate-400 font-semibold">
                            Sum.
                          </span>
                          <span className="tabular-nums">{formatSum(totalReceiptSum)}</span>
                        </div>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col.key}
                      style={pin.style}
                      className={`px-3 sm:px-4 py-2.5 ${headBorder} ${pin.className}`}
                    />
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!loading && (
        <div className="shrink-0">
          <Pagination
            page={page}
            totalPages={Math.max(1, totalPages)}
            totalRecords={total}
            total={total}
            pageSize={limit}
            limit={limit}
            itemName="entries"
            variant="dark"
            options={[10, 20, 50, 100]}
            className="border-t border-[#F1E8D0] bg-[#FEFAEE] dark:bg-none px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#080B11] rounded-b-2xl sm:rounded-b-3xl"
            onPageChange={onPageChange}
            onLimitChange={(val) => {
              onLimitChange(val);
              onPageChange(1);
            }}
            onPageSizeChange={(val) => {
              onLimitChange(val);
              onPageChange(1);
            }}
          />
        </div>
      )}

      {openMenuCol &&
        typeof document !== "undefined" &&
        (() => {
          const activeCol = COLUMNS.find((c) => c.key === openMenuCol);
          if (!activeCol) return null;
          const activePinned = pinnedColumns[activeCol.key];
          return createPortal(
            <div
              ref={portalMenuRef}
              style={{
                position: "fixed",
                top: `${menuPosition.top}px`,
                left: `${menuPosition.left}px`,
                zIndex: 9999,
              }}
              className="w-48 rounded-2xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-2xl dark:shadow-black/60 p-1.5 text-left font-medium animate-in fade-in zoom-in-95 duration-100"
            >
              {activeCol.sortKey && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange(activeCol.sortKey!, true);
                      setOpenMenuCol(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E] cursor-pointer"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                    Sort Ascending
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSortChange(activeCol.sortKey!, false);
                      setOpenMenuCol(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E] cursor-pointer"
                  >
                    <ArrowDown className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                    Sort Descending
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearSort();
                      setOpenMenuCol(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                    Clear Sort
                  </button>
                  <div className="my-1 border-t border-[#F0EAE0] dark:border-white/[0.08]" />
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  onPinColumn(activeCol.key, "left");
                  setOpenMenuCol(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E] cursor-pointer"
              >
                <Pin className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                Pin to Left
              </button>
              <button
                type="button"
                onClick={() => {
                  onPinColumn(activeCol.key, "right");
                  setOpenMenuCol(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E] cursor-pointer"
              >
                <Pin className="h-3.5 w-3.5 -scale-x-100 text-[#B88728] dark:text-[#F5C451]" />
                Pin to Right
              </button>
              {activePinned && (
                <button
                  type="button"
                  onClick={() => {
                    onPinColumn(activeCol.key, null);
                    setOpenMenuCol(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E] cursor-pointer"
                >
                  <PinOff className="h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451]" />
                  Unpin Column
                </button>
              )}
              <div className="my-1 border-t border-[#F0EAE0] dark:border-white/[0.08]" />
              <button
                type="button"
                onClick={() => {
                  onHideColumn(activeCol.key);
                  setOpenMenuCol(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Hide Column
              </button>
            </div>,
            document.body
          );
        })()}
    </div>
  );
}
