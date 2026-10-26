"use client";

import React, { useMemo, useState } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import { toast } from "sonner";
import { ArrowRight, Printer } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

import Toolbar from "./components/Toolbar";
import OrderTable from "./components/OrderTable";
import { orders as initialOrders } from "./data";
import { generatePicklist } from "./utils/generatePicklist";
import { downloadPicklistPDF } from "./pdf/PicklistPDF";

const Order = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "OPEN" | "PRIORITY" | "PICKING" | "TRANSIT"
  >("OPEN");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Filtered orders matching original logic: Search by Order ID and match Status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch = order.orderId
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchStatus = order.status === status;

      return matchSearch && matchStatus;
    });
  }, [orders, search, status]);

  const totalRecords = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  // Prevent invalid page after filtering or page size change
  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * limit;
  const end = start + limit;
  const currentOrders = filteredOrders.slice(start, end);

  // Stage summary counts
  const counts = useMemo(
    () => ({
      OPEN: orders.filter((o) => o.status === "OPEN").length,
      PRIORITY: orders.filter((o) => o.status === "PRIORITY").length,
      PICKING: orders.filter((o) => o.status === "PICKING").length,
      TRANSIT: orders.filter((o) => o.status === "TRANSIT").length,
    }),
    [orders]
  );

  const moveToPicking = () => {
    if (!selectedRows.length) return;

    setOrders((prev) =>
      prev.map((order) => {
        if (
          selectedRows.includes(order.id) &&
          (order.status === "OPEN" || order.status === "PRIORITY")
        ) {
          return {
            ...order,
            status: "PICKING",
          };
        }
        return order;
      })
    );

    toast.success(`Successfully moved ${selectedRows.length} order(s) to In Picking`);
    setSelectedRows([]);
  };

  const handleGeneratePicklist = () => {
    if (!selectedRows.length) return;

    const picklist = generatePicklist(orders, selectedRows);
    downloadPicklistPDF(picklist);
    toast.success(`Generated picklist for ${selectedRows.length} order(s)`);
  };

  const handleProcessPicking = () => {
    if (!selectedRows.length) return;

    setOrders((prev) =>
      prev.map((order) => {
        if (selectedRows.includes(order.id) && order.status === "PICKING") {
          return {
            ...order,
            status: "TRANSIT",
          };
        }
        return order;
      })
    );

    toast.success(`Processed ${selectedRows.length} order(s) to In Transit`);
    setSelectedRows([]);
  };

  return (
    <DashboardLayout title="Order Process">
      <div className="space-y-6">
        {/* Header Card (Matching Amazon Analytics) */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Myntra Order Process
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage, prioritize, and process Myntra customer orders across Open, Priority, In Picking, and In Transit fulfillment stages.
              </p>
            </div>

            {/* Quick Action Buttons in Header when rows are selected */}
            {selectedRows.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                {(status === "OPEN" || status === "PRIORITY") && (
                  <button
                    type="button"
                    onClick={moveToPicking}
                    className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>Move to In Picking ({selectedRows.length})</span>
                  </button>
                )}

                {status === "PICKING" && (
                  <>
                    <button
                      type="button"
                      onClick={handleGeneratePicklist}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
                      title="Download formatted Picklist PDF"
                    >
                      <Printer className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                      <span>Picklist ({selectedRows.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleProcessPicking}
                      className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Process ({selectedRows.length})</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar: Metric Stage Cards & Search Bar */}
        <Toolbar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setSelectedRows([]);
            setPage(1);
          }}
          counts={counts}
          selectedRows={selectedRows}
          onMoveToPicking={moveToPicking}
          onGeneratePicklist={handleGeneratePicklist}
          onProcess={handleProcessPicking}
        />

        {/* Order Table with Theme Styling (Amazon Order Process result page typography) */}
        <OrderTable
          orders={currentOrders}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
        />

        {/* Pagination Footer with Dark Variant matching Amazon Analytics */}
        {totalRecords > 0 && (
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 dark:border-white/[0.08] shadow-sm">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={totalRecords}
              limit={limit}
              itemName="orders"
              variant="dark"
              className="border-none bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5 text-white"
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Order;
