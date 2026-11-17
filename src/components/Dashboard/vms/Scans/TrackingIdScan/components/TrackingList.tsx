"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
      return;
    }
    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      setTargetHeight(Math.floor(available));
    }
  }, []);

  useEffect(() => {
    calculateHeight();

    const timer = setTimeout(calculateHeight, 150);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (scrollContainer && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight]);

  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;

      const tableContainer = tableContainerRef.current;
      const maxPageScroll = Math.max(
        0,
        scrollContainer.scrollHeight - scrollContainer.clientHeight
      );
      if (maxPageScroll <= 0) return;

      const isPageAtBottom = scrollContainer.scrollTop >= maxPageScroll - 2;
      const isPageAtTop = scrollContainer.scrollTop <= 2;

      const isOverTable =
        tableContainer &&
        (e.composedPath().includes(tableContainer) ||
          tableContainer.contains(e.target as Node));

      if (e.deltaY > 0) {
        if (!isPageAtBottom) {
          e.preventDefault();
          scrollContainer.scrollTop = Math.min(
            maxPageScroll,
            scrollContainer.scrollTop + e.deltaY
          );
        } else if (!isOverTable) {
          e.preventDefault();
        }
      } else if (e.deltaY < 0) {
        if (!isOverTable) {
          if (!isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        } else {
          const isTableAtTop = !tableContainer || tableContainer.scrollTop <= 1;
          if (isTableAtTop && !isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        }
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

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
    <div ref={containerRef}>
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

      {/* Lower Section (ScanSummary + TrackingScanner + MissingTrackingList + TrackingTable) */}
      <div
        style={{
          height: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
          minHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        }}
        className="flex flex-col"
      >
        <div className="shrink-0">
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
            onCameraScan={(code) => {
              handleScan(code);
            }}
          />

          <MissingTrackingList
            trackingIds={missingIds}
            onRemoveItem={removeMissingId}
            onClearAll={clearMissingIds}
          />
        </div>

        <div className="lg:flex-1 lg:min-h-0 flex flex-col">
          <TrackingTable
            data={paginatedData}
            isLoading={loading}
            total={filteredData.length}
            page={page}
            limit={limit}
            tableContainerRef={tableContainerRef}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
