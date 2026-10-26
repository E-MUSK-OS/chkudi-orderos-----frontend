"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Order } from "../types";

interface Props {
  orders: Order[];
  selectedRows: number[];
  onSelectionChange: (rows: number[]) => void;
}

const OrderTable = ({
  orders,
  selectedRows,
  onSelectionChange,
}: Props) => {
  const allSelected =
    orders.length > 0 && orders.every((order) => selectedRows.includes(order.id));

  const toggleAll = () => {
    if (allSelected) {
      const currentPageIds = new Set(orders.map((o) => o.id));
      onSelectionChange(selectedRows.filter((id) => !currentPageIds.has(id)));
    } else {
      const combined = Array.from(
        new Set([...selectedRows, ...orders.map((order) => order.id)])
      );
      onSelectionChange(combined);
    }
  };

  const toggleRow = (id: number) => {
    if (selectedRows.includes(id)) {
      onSelectionChange(selectedRows.filter((item) => item !== id));
    } else {
      onSelectionChange([...selectedRows, id]);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[800px] border-collapse text-left font-sans">
          <thead className="bg-[#0A0E1A] dark:bg-[#080B11] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2] dark:border-white/[0.08]">
            <tr>
              <th className="w-12 min-w-[44px] px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                </div>
              </th>

              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Order ID
              </th>

              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Ordered On
              </th>

              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                On Hold
              </th>

              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Quantity
              </th>

              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Process Start Time
              </th>

              <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap">
                Store
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                  No orders match your current search or filter.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const isSelected = selectedRows.includes(order.id);
                return (
                  <tr
                    key={order.id}
                    className={`transition ${
                      isSelected
                        ? "bg-[#FFF9EC]/70 dark:bg-[#1A160E]/70 hover:bg-[#FFF9EC]/90 dark:hover:bg-[#1A160E]/90"
                        : "hover:bg-[#FAF8F5] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="w-12 min-w-[44px] px-3 sm:px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(order.id)}
                        />
                      </div>
                    </td>

                    {/* Order ID */}
                    <td className="px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <span>{order.orderId}</span>
                    </td>

                    {/* Ordered On */}
                    <td className="px-3 sm:px-4 py-3.5 text-center font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span>{order.orderedOn}</span>
                    </td>

                    {/* On Hold */}
                    <td className="px-3 sm:px-4 py-3.5 text-center font-medium whitespace-nowrap">
                      {order.onHold ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                          No
                        </span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <span>{order.quantity}</span>
                    </td>

                    {/* Process Start Time */}
                    <td className="px-3 sm:px-4 py-3.5 text-center font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span>{order.processStartTime}</span>
                    </td>

                    {/* Store */}
                    <td className="px-3 sm:px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 px-2 py-0.5 text-xs font-semibold text-[#0A0E1A] dark:text-[#E8C16D]">
                        {order.store}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
