"use client";

import { useMemo, useState } from "react";

import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";

import Toolbar from "./components/Toolbar";
import OrderTable from "./components/OrderTable";
import Pagination from "./components/Pagination";
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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch = order.orderId
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchStatus = order.status === status;

      return matchSearch && matchStatus;
    });
  }, [search, status]);

  const totalRecords = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));

  // Prevent invalid page after filtering or page size change
  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * limit;
  const end = start + limit;

  const currentOrders = filteredOrders.slice(start, end);

  const counts = {
    OPEN: orders.filter((o) => o.status === "OPEN").length,
    PRIORITY: orders.filter((o) => o.status === "PRIORITY").length,
    PICKING: orders.filter((o) => o.status === "PICKING").length,
    TRANSIT: orders.filter((o) => o.status === "TRANSIT").length,
  };
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

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
      }),
    );

    setSelectedRows([]);
  };

  const handleGeneratePicklist = () => {
    if (!selectedRows.length) return;

    const picklist = generatePicklist(orders, selectedRows);

    downloadPicklistPDF(picklist);
  };

  return (
    <DashboardLayout title="Order Process">
      <div className="space-y-6">
        <Toolbar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          counts={counts}
          selectedRows={selectedRows}
          onMoveToPicking={moveToPicking}
          onGeneratePicklist={handleGeneratePicklist}
        />

        <OrderTable
          orders={currentOrders}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
        />

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          limit={limit}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setLimit(value);
            setPage(1);
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Order;
