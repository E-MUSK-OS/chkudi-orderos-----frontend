"use client";

import React, { useState, useMemo, useRef } from "react";
import { ClipboardList } from "lucide-react";
import { SalesOrder } from "../../SalesOrder/types/salesOrder.types";
import Pagination from "@/components/ui/Pagination";

interface FulfillmentTableProps {
  orders: SalesOrder[];
  loading: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onToggleStatus: (so: SalesOrder, nextStatus: string) => void;
  tableContainerRef?: React.RefObject<HTMLDivElement | null>;
  visibleColumns?: Record<string, boolean>;
  sortField?: keyof SalesOrder;
  sortAsc?: boolean;
  onSortChange?: (field: keyof SalesOrder, asc: boolean) => void;
  showAggregations?: boolean;
}

const NEXT_STATUS: Record<string, string> = {
  Pending: "Partial",
  Partial: "Completed",
  Completed: "Pending",
};

export default function FulfillmentTable({
  orders,
  loading,
  selectedIds = [],
  onSelectionChange,
  onToggleStatus,
  tableContainerRef,
  visibleColumns,
  sortField: externalSortField,
  sortAsc: externalSortAsc,
  onSortChange,
  showAggregations = true,
}: FulfillmentTableProps) {
  const [internalSortField, setInternalSortField] =
    useState<keyof SalesOrder>("orderDate");
  const [internalSortAsc, setInternalSortAsc] = useState(false);

  const sortField = externalSortField ?? internalSortField;
  const sortAsc = externalSortAsc ?? internalSortAsc;

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const internalTableRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = tableContainerRef ?? internalTableRef;

  const isColVisible = (key: string) =>
    visibleColumns ? visibleColumns[key] !== false : true;

  const handleSort = (field: keyof SalesOrder) => {
    const nextAsc = sortField === field ? !sortAsc : true;
    if (onSortChange) {
      onSortChange(field, nextAsc);
    } else {
      setInternalSortField(field);
      setInternalSortAsc(nextAsc);
    }
  };

  const sortedData = useMemo(() => {
    const arr = [...orders];
    arr.sort((a, b) => {
      const valA = a[sortField] ?? "";
      const valB = b[sortField] ?? "";
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [orders, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, safePage, rowsPerPage]);

  const totalOrderQtySum = useMemo(
    () => sortedData.reduce((s, o) => s + (Number(o.orderQty) || 0), 0),
    [sortedData]
  );
  const totalDeliveredQtySum = useMemo(
    () => sortedData.reduce((s, o) => s + (Number(o.deliveredQty) || 0), 0),
    [sortedData]
  );
  const totalPendingQtySum = useMemo(
    () => sortedData.reduce((s, o) => s + (Number(o.pendingQty) || 0), 0),
    [sortedData]
  );
  const totalAmountSum = useMemo(
    () => sortedData.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0),
    [sortedData]
  );

  const visibleColCount =
    [
      "date",
      "orderNo",
      "party",
      "contactNo",
      "orderQty",
      "deliveredQty",
      "pendingQty",
      "totalAmount",
      "expDeliveryDate",
      "status",
    ].filter(isColVisible).length + 2;

  const allVisibleSelected =
    paginated.length > 0 && paginated.every((o) => selectedIds.includes(o.id));

  const toggleAllVisible = () => {
    if (!onSelectionChange) return;
    if (allVisibleSelected) {
      const visibleSet = new Set(paginated.map((o) => o.id));
      onSelectionChange(selectedIds.filter((id) => !visibleSet.has(id)));
    } else {
      const next = new Set(selectedIds);
      paginated.forEach((o) => next.add(o.id));
      onSelectionChange(Array.from(next));
    }
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] overflow-hidden shadow-sm">
      <div ref={scrollContainerRef} className="overflow-x-auto custom-scrollbar">
        <table className="w-full min-w-[1050px] text-left border-collapse text-xs">
          <thead className="bg-[#FEFAEE] dark:bg-[#080B11] border-b border-[#F1E8D0] dark:border-white/[0.08] text-[#6A4D1D] dark:text-[#E8C16D] font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-3 text-center w-12">No.</th>
              <th className="py-3.5 px-2 text-center w-10">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  aria-label="Select all rows"
                  className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/20 accent-[#E8C16D] cursor-pointer align-middle"
                />
              </th>
              {isColVisible("date") && (
                <th
                  className="py-3.5 px-3 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("orderDate")}
                >
                  Date.
                </th>
              )}
              {isColVisible("orderNo") && (
                <th
                  className="py-3.5 px-3 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("orderNo")}
                >
                  Order No.
                </th>
              )}
              {isColVisible("party") && (
                <th
                  className="py-3.5 px-3 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("partyName")}
                >
                  Party.
                </th>
              )}
              {isColVisible("contactNo") && (
                <th className="py-3.5 px-3 whitespace-nowrap">Contact No.</th>
              )}
              {isColVisible("orderQty") && (
                <th
                  className="py-3.5 px-3 text-right cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("orderQty")}
                >
                  Order Qty.
                </th>
              )}
              {isColVisible("deliveredQty") && (
                <th className="py-3.5 px-3 text-right whitespace-nowrap">
                  Delivered Qty.
                </th>
              )}
              {isColVisible("pendingQty") && (
                <th className="py-3.5 px-3 text-right whitespace-nowrap">
                  Pending Qty.
                </th>
              )}
              {isColVisible("totalAmount") && (
                <th
                  className="py-3.5 px-3 text-right cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort("totalAmount")}
                >
                  Total Amount.
                </th>
              )}
              {isColVisible("expDeliveryDate") && (
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Exp. Delivery Date.
                </th>
              )}
              {isColVisible("status") && (
                <th className="py-3.5 px-3 text-center whitespace-nowrap">
                  Status.
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1E8D0]/60 dark:divide-white/[0.06]">
            {loading ? (
              <tr>
                <td colSpan={visibleColCount} className="py-12 text-center text-slate-400">
                  Loading Fulfillment Planning...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={visibleColCount} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-white/[0.04] text-[#B88728] dark:text-[#E8C16D]">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium">No data available</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((so, idx) => {
                const rowNum = (safePage - 1) * rowsPerPage + idx + 1;
                const currentStatus = so.fulfillmentPlan || "Completed";
                const statusClass =
                  currentStatus === "Completed"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    : currentStatus === "Partial"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.1] hover:bg-slate-200/70 dark:hover:bg-white/[0.1]";

                return (
                  <tr
                    key={so.id}
                    className="hover:bg-[#FEFAEE]/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                      {rowNum}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(so.id)}
                        onChange={() => toggleRow(so.id)}
                        aria-label={`Select ${so.orderNo}`}
                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-white/20 accent-[#E8C16D] cursor-pointer align-middle"
                      />
                    </td>
                    {isColVisible("date") && (
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                        {formatDate(so.orderDate)}
                      </td>
                    )}
                    {isColVisible("orderNo") && (
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/40">
                          {so.orderNo}
                        </span>
                      </td>
                    )}
                    {isColVisible("party") && (
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {so.party?.partyName || so.partyName}
                      </td>
                    )}
                    {isColVisible("contactNo") && (
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {so.contactNo || so.party?.phone || "-"}
                      </td>
                    )}
                    {isColVisible("orderQty") && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-white whitespace-nowrap">
                        {Number(so.orderQty || 0).toFixed(2)}
                      </td>
                    )}
                    {isColVisible("deliveredQty") && (
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {Number(so.deliveredQty || 0).toFixed(2)}
                      </td>
                    )}
                    {isColVisible("pendingQty") && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-white whitespace-nowrap">
                        {Number(so.pendingQty || 0).toFixed(2)}
                      </td>
                    )}
                    {isColVisible("totalAmount") && (
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#B88728] dark:text-[#E8C16D] whitespace-nowrap">
                        ₹ {Number(so.totalAmount || 0).toFixed(2)}
                      </td>
                    )}
                    {isColVisible("expDeliveryDate") && (
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                        {formatDate(so.expDeliveryDate)}
                      </td>
                    )}
                    {isColVisible("status") && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleStatus(
                              so,
                              NEXT_STATUS[currentStatus] || "Completed"
                            )
                          }
                          title="Click to cycle fulfillment status"
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${statusClass}`}
                        >
                          {currentStatus}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {showAggregations && (
            <tfoot className="border-t border-[#E8C16D]/40 bg-[#FEFAEE] dark:bg-[#080B11] text-xs font-bold">
              <tr>
                <td className="py-2.5 px-3" />
                <td className="py-2.5 px-2" />
                {isColVisible("date") && (
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                    Total. {sortedData.length}
                  </td>
                )}
                {isColVisible("orderNo") && <td className="py-2.5 px-3" />}
                {isColVisible("party") && <td className="py-2.5 px-3" />}
                {isColVisible("contactNo") && (
                  <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">
                    Sum.
                  </td>
                )}
                {isColVisible("orderQty") && (
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white">
                    {totalOrderQtySum.toFixed(2)}
                  </td>
                )}
                {isColVisible("deliveredQty") && (
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white">
                    {totalDeliveredQtySum.toFixed(2)}
                  </td>
                )}
                {isColVisible("pendingQty") && (
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 dark:text-white">
                    {totalPendingQtySum.toFixed(2)}
                  </td>
                )}
                {isColVisible("totalAmount") && (
                  <td className="py-2.5 px-3 text-right font-mono text-[#B88728] dark:text-[#E8C16D]">
                    {totalAmountSum.toFixed(2)}
                  </td>
                )}
                {isColVisible("expDeliveryDate") && <td className="py-2.5 px-3" />}
                {isColVisible("status") && <td className="py-2.5 px-3" />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Pagination
        variant="dark"
        itemName="entries"
        page={safePage}
        totalPages={totalPages}
        total={sortedData.length}
        limit={rowsPerPage}
        className="shrink-0 border-t border-[#F1E8D0] bg-[#FEFAEE] dark:bg-none px-4 sm:px-6 py-3 sm:py-3.5 dark:border-white/[0.08] dark:bg-[#080B11]"
        onPageChange={(p) => setCurrentPage(p)}
        onLimitChange={(lim) => {
          setRowsPerPage(lim);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
