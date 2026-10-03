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
  const [analyticsTime, setAnalyticsTime] = useState("11:00");
  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false);
  const [tempHour, setTempHour] = useState("11");
  const [tempMinute, setTempMinute] = useState("00");

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

  const updateSelectedDateForTime = (timeStr: string) => {
    const now = new Date();
    const maxDateStr = getTodayDateStringIST(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getTodayDateStringIST(yesterday);

    const { hour: currentHour, minute: currentMinute } = getIstHourAndMinute(now);

    const [h, m] = timeStr.split(":");
    const targetHour = parseInt(h, 10) || 11;
    const targetMinute = parseInt(m, 10) || 0;

    if (currentHour < targetHour || (currentHour === targetHour && currentMinute < targetMinute)) {
      setSelectedDate(yesterdayStr);
    } else {
      setSelectedDate(maxDateStr);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
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
      toast.error("Failed to fetch Amazon Analytics data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${BASE_URL}/amazon-analytics/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const resData = await res.json();
      if (res.ok && resData.data?.time) {
        setAnalyticsTime(resData.data.time);
        const [h, m] = resData.data.time.split(":");
        if (h) setTempHour(h);
        if (m) setTempMinute(m);
        updateSelectedDateForTime(resData.data.time);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const handleTimeSave = async () => {
    const newTime = `${tempHour}:${tempMinute}`;
    setAnalyticsTime(newTime);
    setIsTimePopoverOpen(false);
    updateSelectedDateForTime(newTime);

    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${BASE_URL}/amazon-analytics/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ time: newTime }),
      });

      if (!res.ok) {
        toast.error("Failed to save time");
      } else {
        toast.success("Time saved successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving time");
    }
  };



  useEffect(() => {
    // Generate dates for the last 30 days strictly in IST
    const now = new Date();

    // Max Date (Today in IST)
    const maxDateStr = getTodayDateStringIST(now);
    setMaxDate(maxDateStr);

    // Min Date (30 Days Ago in IST)
    const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
    const minDateStr = getTodayDateStringIST(thirtyDaysAgo);
    setMinDate(minDateStr);

    // Set initial default date based on current default time ("11:00")
    updateSelectedDateForTime("11:00");

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    fetchSettings();
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
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Amazon Products Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Manage and analyze your Amazon SKUs to track daily BSR and review statistics.
              </p>
            </div>

            {data.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                <button
                  type="button"
                  onClick={downloadAmazonAnalyticsDemoSheet}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
                  title="Download sample Excel template"
                >
                  <FileDown className="h-4 w-4 text-[#B88728]" />
                  <span>Demo Sheet</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedGraphItem(null);
                    setIsGraphModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#E8C16D]/20 ring-2 ring-[#E8C16D]/30 cursor-pointer"
                >
                  <BarChart3 className="h-4 w-4 text-[#B88728]" />
                  <span>Show Graph</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add More</span>
                </button>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <span>Delete ({selectedIds.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toolbar: Left side ONLY searchbar, Right side other filters & actions */}
        {!isLoading && data.length > 0 && (
          <div className="rounded-2xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
            {/* Left side: Searchbar matching OrderOS theme with increased width */}
            <div className="w-full xl:max-w-md sm:w-80 md:w-96 lg:w-[420px] transition-all">
              <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728] shrink-0 border border-[#E8C16D]/30">
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
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] placeholder:font-normal placeholder:text-slate-400 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                    className="grid h-5 w-5 place-items-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer shrink-0"
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
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-600 hover:text-red-700 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  title="Reset all filters and sorting"
                >
                  <div className="grid h-5 w-5 place-items-center rounded-md bg-red-100 text-red-600 shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </div>
                  <span>Reset</span>
                </button>
              )}

              {/* Date Filter */}
              <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
                  <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728]">
                    <CalendarIcon className="h-3.5 w-3.5" />
                  </div>
                  <span className="w-[90px] sm:w-[105px] text-left">
                    {selectedDate ? format(parseISO(selectedDate), "dd MMM yyyy") : "Select Date"}
                  </span>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-auto p-3 rounded-2xl border border-[#E7E0D2] bg-white shadow-xl">
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

              {/* Time Filter */}
              <Popover open={isTimePopoverOpen} onOpenChange={(open) => {
                setIsTimePopoverOpen(open);
                if (open && analyticsTime) {
                  const [h, m] = analyticsTime.split(":");
                  if (h) setTempHour(h);
                  if (m) setTempMinute(m);
                }
              }}>
                <PopoverTrigger className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
                  <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] text-[#B88728]">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <span className="w-[45px] sm:w-[50px] text-left">
                    {analyticsTime || "11:00"}
                  </span>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-64 p-4 rounded-2xl border border-[#E7E0D2] bg-white shadow-xl">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between font-bold text-[#0A0E1A]">
                      <span>Select Time</span>
                      <div className="text-[#B88728] bg-[#FFF9EC] px-2 py-1 rounded-md text-xs border border-[#E8C16D]/30">
                        {tempHour}:{tempMinute}
                      </div>
                    </div>
                    <div className="flex gap-4 h-48">
                      {/* Hours */}
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                        <div className="text-xs font-semibold text-slate-400 mb-1 sticky top-0 bg-white z-10 py-1">Hours</div>
                        {Array.from({ length: 24 }).map((_, i) => {
                          const val = String(i).padStart(2, '0');
                          return (
                            <button
                              key={`h-${val}`}
                              onClick={() => setTempHour(val)}
                              className={`py-2 px-3 rounded-xl text-sm font-semibold transition-colors ${tempHour === val ? 'bg-[#E8C16D] text-black' : 'text-slate-600 hover:bg-[#FFF9EC] hover:text-[#B88728]'}`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                      {/* Minutes */}
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                        <div className="text-xs font-semibold text-slate-400 mb-1 sticky top-0 bg-white z-10 py-1">Minutes</div>
                        {Array.from({ length: 60 }).map((_, i) => {
                          const val = String(i).padStart(2, '0');
                          return (
                            <button
                              key={`m-${val}`}
                              onClick={() => setTempMinute(val)}
                              className={`py-2 px-3 rounded-xl text-sm font-semibold transition-colors ${tempMinute === val ? 'bg-[#E8C16D] text-black' : 'text-slate-600 hover:bg-[#FFF9EC] hover:text-[#B88728]'}`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="border-t border-[#E7E0D2] pt-3 flex justify-end gap-2">
                      <button onClick={() => setIsTimePopoverOpen(false)} className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleTimeSave} className="bg-[#0A0E1A] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
                        Save
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Download Insights */}
              <button
                type="button"
                onClick={() =>
                  downloadAmazonAnalyticsInsights({
                    data: sortedData.length > 0 ? sortedData : data,
                    selectedDate,
                  })
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
                title="Download complete analytics insights Excel sheet"
              >
                <FileDown className="h-4 w-4 text-[#B88728]" />
                <span>Download Insights</span>
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-sm">
            <RefreshCw className="h-8 w-8 animate-spin text-[#B88728]" />
            <p className="mt-4 text-sm text-slate-500">Loading data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-[#E7E0D2] bg-white p-8 sm:p-12 md:p-16 text-center shadow-sm">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF9EC] border border-[#E8C16D]/20">
              <Upload size={32} className="text-[#B88728]" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-[#0A0E1A]">No Analytics Data Found</h2>
            <p className="mb-8 max-w-md text-sm text-slate-500">
              It looks like you haven&apos;t uploaded any Amazon SKUs yet. Upload an Excel file containing your SKUs to get started.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={downloadAmazonAnalyticsDemoSheet}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] hover:bg-[#FFF3D6] px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-[#0A0E1A] transition-all shadow-sm active:scale-[0.98] cursor-pointer ring-2 ring-[#E8C16D]/30 text-xs sm:text-sm"
              >
                <FileDown size={20} className="text-[#B88728]" />
                <span>Download Demo Sheet</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-[#0A0E1A] transition-all hover:bg-[#d4af5a] shadow-sm text-xs sm:text-sm"
              >
                <Upload size={20} />
                <span>Upload Excel File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
              <table className="w-full min-w-[950px] lg:min-w-[1100px] border-collapse text-left font-sans">
                <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
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
                      className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[170px] cursor-pointer select-none transition-colors hover:bg-slate-900 group"
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
                      className="px-3 sm:px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[170px] cursor-pointer select-none transition-colors hover:bg-slate-900 group"
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
                <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
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
                              className="text-xs font-bold text-[#B88728] hover:underline cursor-pointer"
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
                            isSelected ? "bg-[#FFF9EC]/70 hover:bg-[#FFF9EC]" : "hover:bg-slate-50/80"
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
                              <span className="text-xs sm:text-sm font-semibold text-slate-900">
                                {item.operatorName}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center">
                            <span className="text-xs sm:text-sm font-semibold text-slate-900">
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
                                  className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-block truncate max-w-full"
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
                              <span className="text-xs sm:text-sm font-semibold text-slate-800">{item.asin}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center min-w-[150px]">
                            {categoryRank ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                                {categoryRank}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">-</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3.5 text-center min-w-[150px]">
                            {productRank ? (
                              <span className="text-xs sm:text-sm font-semibold text-slate-800">
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
                                {displayReviews && <span className="text-slate-500 font-normal">{displayReviews} reviews</span>}
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
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] hover:bg-[#FFF3D6] px-3 py-1.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition shadow-2xs hover:shadow-xs active:scale-[0.98] mx-auto cursor-pointer"
                              title="Show Item Graph"
                            >
                              <BarChart3 className="h-3.5 w-3.5 text-[#B88728]" />
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
                className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5"
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
