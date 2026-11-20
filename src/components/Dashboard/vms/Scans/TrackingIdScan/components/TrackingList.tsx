"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  const missingTableContainerRef = useRef<HTMLDivElement>(null);
  const fixedSectionRef = useRef<HTMLDivElement>(null);
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

  // Coordinated stop-scrolling handler (Exact same as Amazon AwbScan):
  // 1. When scrolling down, outer page scrolls until Header & Summary are hidden and stops at the fixed position.
  // 2. Once at the fixed position, Missing Table and Main Table scroll internally.
  // 3. When scrolling up, table scrolls up to the first row; then scrolling up reveals Summary & Header.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      const tableContainer = tableContainerRef.current;
      const missingTable = missingTableContainerRef.current;

      const maxPageScroll = Math.max(
        0,
        scrollContainer.scrollHeight - scrollContainer.clientHeight
      );
      if (maxPageScroll <= 0) return;

      const isPageAtBottom = scrollContainer.scrollTop >= maxPageScroll - 2;
      const isPageAtTop = scrollContainer.scrollTop <= 2;

      const path = e.composedPath();
      const isOverMainTable =
        tableContainer &&
        (path.includes(tableContainer) || tableContainer.contains(e.target as Node));
      const isOverMissingTable =
        missingTable &&
        (path.includes(missingTable) || missingTable.contains(e.target as Node));

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (!isPageAtBottom) {
          // Outer page has not reached the fixed section yet -> scroll page down to fixed point
          e.preventDefault();
          scrollContainer.scrollTop = Math.min(
            maxPageScroll,
            scrollContainer.scrollTop + e.deltaY
          );
        } else {
          // At the fixed view
          if (isOverMissingTable && missingTable) {
            const maxMissingScroll = missingTable.scrollHeight - missingTable.clientHeight;
            if (maxMissingScroll > 0) {
              missingTable.scrollTop += e.deltaY;
            }
          } else if (tableContainer) {
            tableContainer.scrollTop += e.deltaY;
          }
        }
      } else if (e.deltaY < 0) {
        // Scrolling UP
        if (isOverMissingTable && missingTable) {
          const isMissingAtTop = missingTable.scrollTop <= 1;
          if (!isMissingAtTop) {
            missingTable.scrollTop += e.deltaY;
          } else if (!isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        } else if (isOverMainTable && tableContainer) {
          const isMainAtTop = tableContainer.scrollTop <= 1;
          if (!isMainAtTop) {
            tableContainer.scrollTop += e.deltaY;
          } else if (!isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        } else {
          if (!isPageAtTop) {
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
    <div ref={containerRef} className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="shrink-0 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
            TrackingId Scans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Verify packed orders by scanning Tracking IDs.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0">
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
      </div>

      {/* Stats Summary Cards (Scrolls away with header when scrolling down) */}
      <div className="shrink-0">
        <ScanSummary
          total={scanSummary.total}
          pending={scanSummary.pending}
          scanned={scanSummary.scanned}
          missing={missingIds.length}
        />
      </div>

      {/* Lower Fixed Section (Barcode Scanner + Missing Table + Main Table - Exactly like Amazon AwbScan) */}
      <div
        ref={fixedSectionRef}
        className="flex flex-col gap-3 sm:gap-4 lg:min-h-0"
        style={{
          height: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        }}
      >
        {/* Barcode Scanner Input */}
        <div className="shrink-0">
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
        </div>

        {/* Missing Tracking IDs Table (Internally scrollable) */}
        {missingIds.length > 0 && (
          <div className="shrink-0">
            <MissingTrackingList
              trackingIds={missingIds}
              onRemoveItem={removeMissingId}
              onClearAll={clearMissingIds}
              tableContainerRef={missingTableContainerRef}
            />
          </div>
        )}

        {/* Orders Data Table (Internally scrollable) */}
        <div className="flex-1 min-h-0 flex flex-col">
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
