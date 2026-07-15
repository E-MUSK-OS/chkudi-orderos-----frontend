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

export default function TrackingList() {
  const { data, loading, userId, refetch } = useVMS();

  const { scanValue, setScanValue, missingIds, message, handleScan } =
    useTrackingScanner(userId, refetch);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [operator, setOperator] = useState("");

  const [account, setAccount] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date>();

  const { operators, fetchOperators } = useOperators();

  const { accounts, fetchAccounts } = useAccounts();

  const limit = 10;
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

  const totalPages = Math.ceil(filteredData.length / limit);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;

    return filteredData.slice(start, start + limit);
  }, [filteredData, page]);

  useEffect(() => {
    fetchOperators();
    fetchAccounts();
  }, []);
  useEffect(() => {
    setPage(1);
  }, [search, operator, account, selectedDate]);

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
        onPageChange={setPage}
      />
    </>
  );
}
