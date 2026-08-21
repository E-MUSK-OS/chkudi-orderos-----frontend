"use client";

import { useEffect, useMemo, useState } from "react";

import { useVMS } from "../../VMS/Admin/hooks/useVMS";
import { useTrackingScanner } from "../hooks/useTrackingScanner";

import TrackingScanner from "./TrackingScanner";
import DataTable from "../../VMS/Admin/components/DataTable";
import Pagination from "../../VMS/Admin/components/Pagination";

import { trackingColumns } from "./TrackingColumns";
import MissingTrackingList from "./MissingTrackingList";
import { useOperators } from "../../../Admin/User/operator/hooks/useOperators";
import { useAccounts } from "../../../Admin/Account/hooks/useAccounts";
import TrackingToolbar from "./TrackingToolbar";
import ScanSummary from "./ScanSummary";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";

export default function TrackingList() {
  const queryClient = useQueryClient();
  const { data, loading, userId, refetch } = useVMS();

  const { scanValue, setScanValue, missingIds, message, handleScan } =
    useTrackingScanner(userId, refetch);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [operator, setOperator] = useState("");

  const [account, setAccount] = useState("");

  //   const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { operators, fetchOperators } = useOperators();

  const { accounts, fetchAccounts } = useAccounts();

  const [limit, setLimit] = useState(10);
  //   const tableData = useMemo(() => {
  //     return data.map((item) => ({
  //       ...item,
  //       scanStatus: scannedIds.includes(item.trackingId) ? "SCANNED" : "PENDING",
  //     }));
  //   }, [data, scannedIds]);

  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchSearch = item.trackingId
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchOperator = !operator || item.operatorId === operator;

      const matchAccount = !account || item.accountId === account;

      let matchDate = true;

      if (selectedDate) {
        const itemDate = new Date(item.createdAt);

        matchDate =
          itemDate.getFullYear() === selectedDate.getFullYear() &&
          itemDate.getMonth() === selectedDate.getMonth() &&
          itemDate.getDate() === selectedDate.getDate();
      }

      return matchSearch && matchOperator && matchAccount && matchDate;
    });

    // Pending ઉપર, Scanned નીચે
    filtered.sort((a, b) => {
      if (a.packingScanStatus === b.packingScanStatus) {
        return 0;
      }

      return a.packingScanStatus === "PENDING" ? -1 : 1;
    });

    return filtered;
  }, [data, search, operator, account, selectedDate]);

  const scanSummary = useMemo(() => {
    return {
      total: filteredData.length,
      pending: filteredData.filter(
        (item) => item.packingScanStatus === "PENDING",
      ).length,

      scanned: filteredData.filter(
        (item) => item.packingScanStatus === "SCANNED",
      ).length,
    };
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / limit);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;

    return filteredData.slice(start, start + limit);
  }, [filteredData, page, limit]);

  useEffect(() => {
    fetchOperators();
    fetchAccounts();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [search, operator, account, selectedDate, limit]);

  const operatorOptions = useMemo(
    () => [
      {
        label: "All Operators",
        value: "",
      },
      ...operators.map((item) => ({
        label: item.operatorName,
        value: item.id,
      })),
    ],
    [operators],
  );

  const accountOptions = useMemo(
    () => [
      {
        label: "All Accounts",
        value: "",
      },
      ...accounts.map((item) => ({
        label: item.accountName,
        value: item.id,
      })),
    ],
    [accounts],
  );

  // useEffect(() => {
  //   if (!userId) return;

  //   const handleTrackingUpdate = (payload: {
  //     trackingId: string;
  //     userId: string;
  //     scanId: string;
  //     packingScanStatus: string;
  //   }) => {
  //     console.log("📦 TRACKING UPDATE RECEIVED:", payload);

  //     queryClient.invalidateQueries({
  //       queryKey: ["user-vms", userId],
  //     });
  //   };

  //   socket.on("tracking:updated", handleTrackingUpdate);

  //   return () => {
  //     socket.off("tracking:updated", handleTrackingUpdate);
  //   };
  // }, [userId, queryClient]);

  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      console.log("🟢 Socket connected:", socket.id);

      if (userId) {
        socket.emit("join:user", userId);
      }
    };

    const handleDisconnect = (reason: string) => {
      console.log("🔴 Socket disconnected:", reason);
    };

    const handleConnectError = (error: Error) => {
      console.error("❌ Socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      socket.disconnect();
    };
  }, [userId]);

  // useEffect(() => {
  //   if (!userId) return;

  //   // Socket connect
  //   socket.connect();

  //   console.log("🔌 Connecting socket...");

  //   // Join user room
  //   socket.emit("join:user", userId);

  //   console.log("👤 Joining user room:", userId);

  //   const handleConnect = () => {
  //     console.log("🟢 Tracking Socket Connected:", socket.id);

  //     // Connection થયા પછી room join કરવો
  //     socket.emit("join:user", userId);

  //     console.log("👤 Joined user room:", `user:${userId}`);
  //   };

  //   const handleTrackingUpdate = (payload: {
  //     trackingId: string;
  //     userId: string;
  //     scanId: string;
  //     packingScanStatus: string;
  //   }) => {
  //     console.log("📦 TRACKING UPDATE RECEIVED:", payload);

  //     queryClient.invalidateQueries({
  //       queryKey: ["user-vms", userId],
  //     });
  //   };

  //   socket.on("connect", handleConnect);
  //   socket.on("tracking:updated", handleTrackingUpdate);

  //   return () => {
  //     socket.off("connect", handleConnect);
  //     socket.off("tracking:updated", handleTrackingUpdate);

  //     socket.disconnect();
  //   };
  // }, [userId, queryClient]);

  return (
    <>
      <TrackingToolbar
        search={search}
        onSearchChange={setSearch}
        operator={operator}
        onOperatorChange={setOperator}
        operatorOptions={operatorOptions}
        account={account}
        onAccountChange={setAccount}
        accountOptions={accountOptions}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
      />

      <ScanSummary
        total={scanSummary.total}
        pending={scanSummary.pending}
        scanned={scanSummary.scanned}
      />
      <TrackingScanner
        value={scanValue}
        onChange={setScanValue}
        message={message}
        onScan={() => {
          handleScan(
            scanValue,
            filteredData.map((item) => item.trackingId),
          );
        }}
      />

      <MissingTrackingList trackingIds={missingIds} />

      <div className="mt-6">
        <DataTable
          columns={trackingColumns}
          data={paginatedData}
          loading={loading}
        />
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={filteredData.length}
        limit={limit}
        pageSize={limit}
        onPageSizeChange={setLimit}
        onPageChange={setPage}
      />
    </>
  );
}
