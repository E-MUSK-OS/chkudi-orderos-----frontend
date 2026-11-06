"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Upload, Plus, Package, RefreshCw, ChevronLeft, ChevronRight, Clock, BarChart3, Calendar as CalendarIcon, CalendarDays, User, FileDown, X, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { getToken } from "@/utils/auth";
import ExcelUploadModal from "./ExcelUploadModal";
import DashboardLayout from "../../layout/DashboardLayout";
import GraphModal from "./GraphModal";
import DeleteAnalyticsModal from "./DeleteAnalyticsModal";
import { downloadAmazonAnalyticsDemoSheet } from "./utils/downloadDemoSheet";
import { downloadAmazonAnalyticsInsights } from "./utils/downloadInsights";
import { getTodayDateStringIST, getIstHourAndMinute } from "../../OrderProcess/Amazon/AwbScan/timeUtils";
import Pagination from "@/components/ui/Pagination";
import ThemeSelectDropdown from "@/components/ui/ThemeSelectDropdown";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface AnalyticsData {
  id: string;
  sku: string;
  url: string;
  operatorName?: string;
  day?: string;
  asin?: string;
  bsrCategory?: string;
  bsrSubcategory?: string;
  rating?: number;
  reviewCount?: number;
  lastScrapedAt?: string;
  createdAt: string;
  history?: any[];
}

const DAY_OPTIONS = [
  { value: "all", label: "All Days" },
  { value: "Sunday", label: "Sunday" },
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
];

export default function AmazonAnalytics() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [selectedGraphItem, setSelectedGraphItem] = useState<AnalyticsData | null>(null);

  // Date Filter State
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [minDate, setMinDate] = useState<string>("");
  const [maxDate, setMaxDate] = useState<string>("");
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  // Day & Operator Filter State
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [selectedOperator, setSelectedOperator] = useState<string>("all");

  // Search State
  const [search, setSearch] = useState("");

  // Selection & Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting State for Category Rank and Product Rank (3-state: asc, desc, null)
  const [sortColumn, setSortColumn] = useState<"categoryRank" | "productRank" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const selectedItems = useMemo(() => {
    return data.filter((item) => selectedIds.includes(item.id));
  }, [data, selectedIds]);

  const lastUpdatedTime = useMemo(() => {
    if (!data || data.length === 0) return null;
    let maxTime = 0;
    data.forEach((item) => {
      if (item.lastScrapedAt) {
        // Backend stores IST time directly but Prisma returns it with a 'Z' (UTC marker).
        // Strip the 'Z' so the browser parses it as local time to avoid double shifting.
        const timeStr = item.lastScrapedAt.endsWith('Z') ? item.lastScrapedAt.slice(0, -1) : item.lastScrapedAt;
        const time = new Date(timeStr).getTime();
        if (time > maxTime) maxTime = time;
      }
    });
    if (maxTime === 0) return null;
    return format(new Date(maxTime), "hh:mm a");
  }, [data]);

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${BASE_URL}/amazon-analytics/bulk`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const resData = await res.json();
      if (res.ok) {
        toast.success(resData.message || `${selectedIds.length} record(s) deleted successfully`);
        setData((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
        setSelectedIds([]);
        setIsDeleteModalOpen(false);
      } else {
        toast.error(resData.message || "Failed to delete selected records");
      }
    } catch (error) {
      console.error("Failed to delete records:", error);
      toast.error("An error occurred while deleting records");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${BASE_URL}/amazon-analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await res.json();
      if (res.ok) {
        setData(resData.data);
      }
    } catch (error) {
      console.error(error);
      if (showLoader) toast.error("Failed to fetch Amazon Analytics data");
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    // Generate dates for the last 30 days strictly in IST
    const now = new Date();

    // Max Date (Today in IST)
    const maxDateStr = getTodayDateStringIST(now);
    setMaxDate(maxDateStr);
    setSelectedDate(maxDateStr);

    // Min Date (30 Days Ago in IST)
    const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    const minDateStr = getTodayDateStringIST(thirtyDaysAgo);
    setMinDate(minDateStr);

    // Initial fetch
    fetchData(true);

    // Setup 30 minutes polling
    const interval = setInterval(() => {
      fetchData(false);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const uniqueOperators = useMemo(() => {
    const set = new Set<string>();
    data.forEach((item) => {
      if (item.operatorName && item.operatorName.trim()) {
        set.add(item.operatorName.trim());
      }
    });
    return Array.from(set).sort();
  }, [data]);

  const operatorOptions = useMemo(() => {
    return [
      { value: "all", label: "All Operators" },
      ...uniqueOperators.map((op) => ({ value: op, label: op })),
    ];
  }, [uniqueOperators]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchSku = item.sku?.toLowerCase().includes(query);
        const matchAsin = item.asin?.toLowerCase().includes(query);
        const matchOperator = item.operatorName?.toLowerCase().includes(query);
        const matchUrl = item.url?.toLowerCase().includes(query);
        if (!matchSku && !matchAsin && !matchOperator && !matchUrl) {
          return false;
        }
      }
      if (selectedDay !== "all") {
        if (!item.day || item.day.toLowerCase() !== selectedDay.toLowerCase()) {
          return false;
        }
      }
      if (selectedOperator !== "all") {
        if (!item.operatorName || item.operatorName.toLowerCase() !== selectedOperator.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [data, search, selectedDay, selectedOperator]);

  // Helper to parse rank number from string like "#1,234 in Clothing"
  const parseRankValue = (rankStr?: string | null): number | null => {
    if (!rankStr) return null;
    const match = String(rankStr).match(/#?([\d,]+)/);
    if (match && match[1]) {
      const num = parseInt(match[1].replace(/,/g, ""), 10);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  const handleSort = (column: "categoryRank" | "productRank") => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection("asc"); // 1st click: 0 to ... (ascending)
    } else if (sortDirection === "asc") {
      setSortDirection("desc"); // 2nd click: ... to 0 (descending)
    } else {
      setSortColumn(null); // 3rd click: original state
      setSortDirection(null);
    }
    setCurrentPage(1);
  };

  // Sort filtered data based on active sort column and direction
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aHistory = a.history?.find((h: any) => h.dateString === selectedDate);
      const bHistory = b.history?.find((h: any) => h.dateString === selectedDate);

      const aRankStr =
        sortColumn === "categoryRank"
          ? aHistory?.clothingRank || a.bsrCategory
          : aHistory?.rank || a.bsrSubcategory;

      const bRankStr =
        sortColumn === "categoryRank"
          ? bHistory?.clothingRank || b.bsrCategory
          : bHistory?.rank || b.bsrSubcategory;

      const aVal = parseRankValue(aRankStr);
      const bVal = parseRankValue(bRankStr);

      // Handle nulls: put items without a valid rank at the end
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredData, sortColumn, sortDirection, selectedDate]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const isAllCurrentPageSelected =
    paginatedData.length > 0 && paginatedData.every((item) => selectedIds.includes(item.id));
  const isSomeCurrentPageSelected =
    paginatedData.some((item) => selectedIds.includes(item.id)) && !isAllCurrentPageSelected;

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      const pageIds = new Set(paginatedData.map((item) => item.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const pageIds = paginatedData.map((item) => item.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  return (
    <DashboardLayout title="Amazon Analytics">
      <div className="space-y-6">
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Amazon Products Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage and analyze your Amazon SKUs to track daily BSR and review statistics.
              </p>
            </div>

            {data.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto self-stretch md:self-center">
                <button
                  type="button"
                  onClick={downloadAmazonAnalyticsDemoSheet}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer flex-1 sm:flex-none min-h-[40px] sm:min-h-[44px]"
                  title="Download sample Excel template"
                >
                  <FileDown className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Demo Sheet</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedGraphItem(null);
                    setIsGraphModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#E8C16D]/20 ring-2 ring-[#E8C16D]/30 cursor-pointer flex-1 sm:flex-none min-h-[40px] sm:min-h-[44px]"
                >
                  <BarChart3 className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Show Graph</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer flex-1 sm:flex-none min-h-[40px] sm:min-h-[44px]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add More</span>
                </button>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer animate-in fade-in zoom-in-95 duration-150 flex-1 sm:flex-none min-h-[40px] sm:min-h-[44px]"
                  >
                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar: Left side ONLY searchbar, Right side other filters & actions */}
        {!isLoading && data.length > 0 && (
          <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
            {/* Left side: Searchbar matching OrderOS theme with increased width */}
            <div className="w-full xl:max-w-md sm:w-80 md:w-96 lg:w-[420px] transition-all">
              <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 dark:hover:bg-white/[0.04] dark:hover:border-[#F5C451]/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:focus-within:bg-[#080B11]">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search SKU, ASIN, Operator..."
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer shrink-0"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right side: Other things (Day, Operator, Date, Time, Reset, Download Insights) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {/* Day Filter */}
              <ThemeSelectDropdown
                ariaLabel="Filter by Day"
                value={selectedDay}
                onChange={(val) => {
                  setSelectedDay(val);
                  setCurrentPage(1);
                }}
                options={DAY_OPTIONS}
                icon={<CalendarDays className="h-3.5 w-3.5" />}
              />

              {/* Operator Filter */}
              <ThemeSelectDropdown
                ariaLabel="Filter by Operator"
                value={selectedOperator}
                onChange={(val) => {
                  setSelectedOperator(val);
                  setCurrentPage(1);
                }}
                options={operatorOptions}
                icon={<User className="h-3.5 w-3.5" />}
              />

              {/* Reset filter button if active - Appears EXACTLY right to All Operator with identical button height */}
              {(selectedDay !== "all" || selectedOperator !== "all" || search.trim() !== "" || sortColumn !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay("all");
                    setSelectedOperator("all");
                    setSearch("");
                    setSortColumn(null);
                    setSortDirection(null);
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  title="Reset all filters and sorting"
                >
                  <div className="grid h-5 w-5 place-items-center rounded-md bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </div>
                  <span>Reset</span>
                </button>
              )}

              {/* Date Filter */}
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 dark:hover:bg-white/[0.04] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
                  <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D]">
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="w-[90px] sm:w-[105px] text-left">
                    {selectedDate ? format(parseISO(selectedDate), "dd MMM yyyy") : "Select Date"}
                  </span>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-auto p-3 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xl">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? parseISO(selectedDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(format(date, "yyyy-MM-dd"));
                        setIsDatePopoverOpen(false);
                      }
                    }}
                    disabled={(date) => {
                      const checkDate = new Date(date);
                      checkDate.setHours(0, 0, 0, 0);
                      const min = new Date(minDate); min.setHours(0, 0, 0, 0);
                      const max = new Date(maxDate); max.setHours(0, 0, 0, 0);
                      return checkDate < min || checkDate > max;
                    }}
                  />
                </PopoverContent>
              </Popover>

              {/* Last Updated Time */}
              {lastUpdatedTime && (
                <div
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-slate-300 shadow-xs cursor-default"
                  title="Last Updated Time"
                >
                  <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D]">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <span>{lastUpdatedTime}</span>
                </div>
              )}

              {/* Download Insights */}
              <button
                type="button"
                onClick={() =>
                  downloadAmazonAnalyticsInsights({
                    data: sortedData.length > 0 ? sortedData : data,
                    selectedDate,
                  })
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#262014] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
                title="Download complete analytics insights Excel sheet"
              >
                <FileDown className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Download Insights</span>
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm">
            <RefreshCw className="h-8 w-8 animate-spin text-[#B88728] dark:text-[#E8C16D]" />
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-8 sm:p-12 md:p-16 text-center shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/20">
              <Upload size={32} className="text-[#B88728] dark:text-[#E8C16D]" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-[#0A0E1A] dark:text-white">No Analytics Data Found</h2>
            <p className="mb-8 max-w-md text-sm text-slate-500 dark:text-slate-400">
              It looks like you haven&apos;t uploaded any Amazon SKUs yet. Upload an Excel file containing your SKUs to get started.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={downloadAmazonAnalyticsDemoSheet}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-sm active:scale-[0.98] cursor-pointer ring-2 ring-[#E8C16D]/30 text-xs sm:text-sm w-full sm:w-auto min-h-[42px] sm:min-h-[44px]"
              >
                <FileDown size={20} className="text-[#B88728] dark:text-[#E8C16D]" />
                <span>Download Demo Sheet</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-[#0A0E1A] transition-all hover:bg-[#d4af5a] shadow-sm text-xs sm:text-sm cursor-pointer w-full sm:w-auto min-h-[42px] sm:min-h-[44px]"
              >
                <Upload size={20} />
                <span>Upload Excel File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
              <table className="w-full min-w-[950px] lg:min-w-[1100px] border-collapse text-left font-sans">
                <thead className="bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] border-b border-[#F5E6BE] dark:border-white/[0.08]">
                  <tr>
                    <th className="px-3 sm:px-4 py-3.5 text-center w-12">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={isAllCurrentPageSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeCurrentPageSelected;
                          }}
                          onChange={handleToggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] cursor-pointer focus:ring-[#E8C16D] focus:ring-offset-0 transition"
                          title="Select all on this page"
                        />
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[130px]">Operator Name</th>
                    <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[140px]">Seller SKU</th>
                    <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[180px]">Associated URL</th>
                    <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[110px]">ASIN</th>
                    <th
                      onClick={() => handleSort("categoryRank")}
                      className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[170px] cursor-pointer select-none transition-colors hover:bg-slate-900 dark:hover:bg-white/[0.04] group"
                      title="1st click: 0 to ... | 2nd click: ... to 0 | 3rd click: Original"
                    >
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span>Category Rank</span>
                        {sortColumn === "categoryRank" ? (
                          sortDirection === "asc" ? (
                            <span className="inline-flex items-center gap-0.5 text-[#E8C16D] bg-[#E8C16D]/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
                              <ArrowUp className="h-3 w-3" />
                              <span>Asc</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[#E8C16D] bg-[#E8C16D]/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
                              <ArrowDown className="h-3 w-3" />
                              <span>Desc</span>
                            </span>
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-[#E8C16D]/40 group-hover:text-[#E8C16D] transition-colors" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("productRank")}
                      className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[170px] cursor-pointer select-none transition-colors hover:bg-slate-900 dark:hover:bg-white/[0.04] group"
                      title="1st click: 0 to ... | 2nd click: ... to 0 | 3rd click: Original"
                    >
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span>Product Rank</span>
                        {sortColumn === "productRank" ? (
                          sortDirection === "asc" ? (
                            <span className="inline-flex items-center gap-0.5 text-[#E8C16D] bg-[#E8C16D]/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
                              <ArrowUp className="h-3 w-3" />
                              <span>Asc</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[#E8C16D] bg-[#E8C16D]/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
                              <ArrowDown className="h-3 w-3" />
                              <span>Desc</span>
                            </span>
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 text-[#E8C16D]/40 group-hover:text-[#E8C16D] transition-colors" />
                        )}
                      </div>
                    </th>
                    <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[140px]">Rating & Reviews</th>
                    <th className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] bg-white dark:bg-[#0F1626] text-xs sm:text-sm font-sans">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-medium">No records found matching the selected filters.</p>
                          {(selectedDay !== "all" || selectedOperator !== "all" || search.trim() !== "" || sortColumn !== null) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDay("all");
                                setSelectedOperator("all");
                                setSearch("");
                                setSortColumn(null);
                                setSortDirection(null);
                                setCurrentPage(1);
                              }}
                              className="text-xs font-bold text-[#B88728] dark:text-[#E8C16D] hover:underline cursor-pointer"
                            >
                              Clear Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      // Extract history data based on selectedDate
                      const historyItem = item.history?.find((h: any) => h.dateString === selectedDate);
                      const categoryRank = historyItem?.clothingRank || item.bsrCategory;
                      const productRank = historyItem?.rank || item.bsrSubcategory;
                      const displayRating = historyItem?.rating ?? item.rating;
                      const displayReviews = historyItem?.reviews ?? item.reviewCount;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelected ? "bg-[#FFF9EC]/70 dark:bg-[#1A160E]/70 hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E]" : "hover:bg-slate-50/80 dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item.id)}
                                className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] cursor-pointer focus:ring-[#E8C16D] focus:ring-offset-0 transition"
                              />
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            {item.operatorName ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                {item.operatorName}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                              {item.sku}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center max-w-[160px] sm:max-w-xs md:max-w-sm">
                            {item.url ? (
                              <div className="group relative inline-flex justify-center max-w-full">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={item.url}
                                  className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline inline-block truncate max-w-full"
                                >
                                  {item.sku}
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            {item.asin ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">{item.asin}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center min-w-[150px]">
                            {categoryRank ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {categoryRank}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center min-w-[150px]">
                            {productRank ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {productRank}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            {displayRating || displayReviews ? (
                              <div className="flex flex-col gap-0.5 text-xs sm:text-sm">
                                {displayRating && <span className="font-bold text-[#E8C16D]">{displayRating} / 5</span>}
                                {displayReviews && <span className="text-slate-500 dark:text-slate-400 font-normal">{displayReviews} reviews</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGraphItem(item);
                                setIsGraphModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] hover:bg-[#FFF3D6] dark:hover:bg-[#262014] px-3 py-1.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition shadow-2xs hover:shadow-xs active:scale-[0.98] mx-auto cursor-pointer"
                              title="Show Item Graph"
                            >
                              <BarChart3 className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                              <span>Graph</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {data.length > 0 && (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={filteredData.length}
                limit={rowsPerPage}
                itemName="records"
                variant="dark"
                className="border-t border-[#F1E8D0] dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
                onPageChange={setCurrentPage}
                onLimitChange={(newLimit) => {
                  setRowsPerPage(newLimit);
                  setCurrentPage(1);
                }}
              />
            )}
          </div>
        )}

        <ExcelUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
        />
        <GraphModal
          isOpen={isGraphModalOpen}
          onClose={() => setIsGraphModalOpen(false)}
          data={selectedGraphItem ? [selectedGraphItem] : data}
          isSingleItem={!!selectedGraphItem}
          title={selectedGraphItem ? `Graph: ${selectedGraphItem.asin || selectedGraphItem.sku}` : undefined}
        />
        <DeleteAnalyticsModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleBulkDeleteConfirm}
          isDeleting={isDeleting}
          items={selectedItems}
          count={selectedIds.length}
        />
      </div>
    </DashboardLayout>
  );
}
