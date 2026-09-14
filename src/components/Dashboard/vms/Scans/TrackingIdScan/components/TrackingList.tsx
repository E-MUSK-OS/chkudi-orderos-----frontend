"use client";

import { useEffect, useMemo, useState } from "react";
import { useVMS } from "../../VMS/Admin/hooks/useVMS";
import { useTrackingScanner } from "../hooks/useTrackingScanner";
import TrackingScanner from "./TrackingScanner";
import TrackingTable from "./TrackingTable";
import MissingTrackingList from "./MissingTrackingList";
import { useOperators } from "../../../Admin/User/operator/hooks/useOperators";
import { useAccounts } from "../../../Admin/Account/hooks/useAccounts";
import TrackingToolbar from "./TrackingToolbar";
import ScanSummary from "./ScanSummary";

export default function TrackingList() {
  const { data, loading, userId, refetch } = useVMS();

  const {
    scanValue,
    setScanValue,
    missingIds,
    removeMissingId,
    clearMissingIds,
    message,
    handleScan,
  } = useTrackingScanner(userId, refetch, data);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [operator, setOperator] = useState("");
  const [account, setAccount] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { operators, fetchOperators } = useOperators();
  const { accounts, fetchAccounts } = useAccounts();
  const [limit, setLimit] = useState(10);

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

    // Pending first, Scanned below
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
        missing={missingIds.length}
      />

      <TrackingScanner
        value={scanValue}
        onChange={setScanValue}
        message={message}
        onScan={() => {
          handleScan(scanValue);
        }}
      />

      <MissingTrackingList
        trackingIds={missingIds}
        onRemoveItem={removeMissingId}
        onClearAll={clearMissingIds}
      />

      <div className="mt-6">
        <TrackingTable
          data={paginatedData}
          isLoading={loading}
          total={filteredData.length}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </>
  );
}
