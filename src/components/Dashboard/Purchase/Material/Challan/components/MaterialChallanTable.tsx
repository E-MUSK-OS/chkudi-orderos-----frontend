"use client";

import React from "react";
import { Edit2, Eye, Trash2, ClipboardList, Phone, FileCheck2 } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { MaterialPurchaseChallan } from "../types/materialChallan.types";
import { MaterialChallanColumnOption } from "./MaterialChallanFilters";

interface MaterialChallanTableProps {
  challans: MaterialPurchaseChallan[];
  loading: boolean;
  columns: MaterialChallanColumnOption[];
  showSumRow: boolean;
  page: number;
  limit: number;
  total: number;
  sumTotalQty: number;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onView?: (ch: MaterialPurchaseChallan) => void;
  onEdit: (ch: MaterialPurchaseChallan) => void;
  onDelete: (ch: MaterialPurchaseChallan) => void;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function MaterialChallanTable({
  challans,
  loading,
  columns,
  showSumRow,
  page,
  limit,
  total,
  sumTotalQty,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onDelete,
}: MaterialChallanTableProps) {
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<string[]>([]);
  const selectedIds = controlledSelectedIds ?? internalSelectedIds;

  const updateSelectedIds = (newIds: string[]) => {
    if (onSelectionChange) {
      onSelectionChange(newIds);
    } else {
      setInternalSelectedIds(newIds);
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = challans.map((c) => c.id);
      updateSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = new Set(challans.map((c) => c.id));
      updateSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    updateSelectedIds(
      selectedIds.includes(id)
        ? selectedIds.filter((item) => item !== id)
        : [...selectedIds, id]
    );
  };

  const isVisible = (id: string) => columns.find((c) => c.id === id)?.visible !== false;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const visibleColCount = columns.filter((c) => c.visible !== false).length + 1;

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F5E6BE] dark:border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D]">
              {isVisible("no") && <th className="py-3 px-4 w-14">No.</th>}
              {isVisible("checkbox") && (
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all challans on this page"
                    checked={
                      challans.length > 0 &&
                      challans.every((c) => selectedIds.includes(c.id))
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                  />
                </th>
              )}
              {isVisible("challanNo") && <th className="py-3 px-4">Challan No.</th>}
              {isVisible("date") && <th className="py-3 px-4">Date</th>}
              {isVisible("party") && <th className="py-3 px-4">Party</th>}
              {isVisible("contactNo") && <th className="py-3 px-4">Contact No</th>}
              {isVisible("partyChallanNo") && <th className="py-3 px-4">Party Challan No.</th>}
              {isVisible("totalQty") && <th className="py-3 px-4 text-right">Total Qty</th>}
              {isVisible("challanFor") && <th className="py-3 px-4 text-center">Challan For</th>}
              {isVisible("preparedBy") && <th className="py-3 px-4">Prepared By</th>}
              {isVisible("status") && <th className="py-3 px-4 text-center">Status</th>}
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05] text-xs">
            {loading ? (
              <tr>
                <td colSpan={visibleColCount} className="py-12 text-center text-slate-400">
                  Loading material purchase challans...
                </td>
              </tr>
            ) : challans.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No data available
                    </p>
                    <p className="text-xs text-slate-400">
                      Click &ldquo;+ Create Challan&rdquo; to create a purchase material challan.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              challans.map((ch, idx) => {
                const isSelected = selectedIds.includes(ch.id);
                return (
                  <tr
                    key={ch.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-[#FFF9EC]/70 dark:bg-[#E8C16D]/[0.06]"
                        : "hover:bg-[#FFFDF7] dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {isVisible("no") && (
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {(page - 1) * limit + idx + 1}
                      </td>
                    )}
                    {isVisible("checkbox") && (
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select challan ${ch.challanNo}`}
                          checked={isSelected}
                          onChange={() => toggleSelectOne(ch.id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] focus:ring-[#E8C16D] dark:border-white/[0.2] dark:bg-[#080B11] cursor-pointer"
                        />
                      </td>
                    )}
                  {isVisible("challanNo") && (
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                        {ch.challanNo}
                      </span>
                    </td>
                  )}
                  {isVisible("date") && (
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-slate-200">
                      {formatDate(ch.challanDate)}
                    </td>
                  )}
                  {isVisible("party") && (
                    <td className="py-3 px-4 font-semibold text-[#0A0E1A] dark:text-white">
                      {ch.supplier?.partyName || ch.supplierName || "-"}
                    </td>
                  )}
                  {isVisible("contactNo") && (
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {ch.contactNo || ch.supplier?.phone || "-"}
                      </span>
                    </td>
                  )}
                  {isVisible("partyChallanNo") && (
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {ch.partyChallanNo || "-"}
                    </td>
                  )}
                  {isVisible("totalQty") && (
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0A0E1A] dark:text-white">
                      {Number(ch.totalReceivedQty || 0).toFixed(2)}
                    </td>
                  )}
                  {isVisible("challanFor") && (
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200">
                        {ch.challanFor || "Purchase"}
                      </span>
                    </td>
                  )}
                  {isVisible("preparedBy") && (
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {ch.preparedBy || "-"}
                    </td>
                  )}
                  {isVisible("status") && (
                    <td className="py-3 px-4 text-center">
                      <span
                        title={ch.invoiceStatus || "Pending"}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          ch.invoiceStatus === "Invoiced"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                        }`}
                      >
                        <FileCheck2 className="w-3 h-3" />
                        <span>{ch.invoiceStatus || "Pending"}</span>
                      </span>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(ch)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                          title="View Challan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(ch)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#B88728] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] cursor-pointer"
                        title="Edit Challan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(ch)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
                        title="Delete Challan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
          {showSumRow && (
            <tfoot>
              <tr className="bg-[#FFF9EC]/70 dark:bg-[#141A29]/80 border-t border-[#E7E0D2] dark:border-white/[0.08] text-xs font-bold text-[#0A0E1A] dark:text-white">
                {isVisible("no") && <td className="py-2.5 px-4" />}
                {isVisible("checkbox") && <td className="py-2.5 px-3" />}
                {isVisible("challanNo") && <td className="py-2.5 px-4 text-slate-500">Total. {total}</td>}
                {isVisible("date") && <td className="py-2.5 px-4" />}
                {isVisible("party") && <td className="py-2.5 px-4" />}
                {isVisible("contactNo") && <td className="py-2.5 px-4" />}
                {isVisible("partyChallanNo") && <td className="py-2.5 px-4" />}
                {isVisible("totalQty") && (
                  <td className="py-2.5 px-4 text-right font-mono text-[#B88728] dark:text-[#E8C16D]">
                    <span className="text-[10px] text-slate-400 mr-1">Sum.</span>
                    {Number(sumTotalQty || 0).toFixed(2)}
                  </td>
                )}
                {isVisible("challanFor") && <td className="py-2.5 px-4" />}
                {isVisible("preparedBy") && <td className="py-2.5 px-4" />}
                {isVisible("status") && <td className="py-2.5 px-4" />}
                <td className="py-2.5 px-4" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {!loading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          options={[10, 20, 50, 100]}
          itemName="entries"
          variant="dark"
          className="shrink-0 border-t border-[#F1E8D0] bg-[#FEFAEE] dark:bg-none px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#080B11]"
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
