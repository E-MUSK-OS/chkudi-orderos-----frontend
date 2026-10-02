"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Upload, Plus, Package, RefreshCw, ChevronLeft, ChevronRight, Clock, BarChart3, Calendar as CalendarIcon, CalendarDays, User, FileDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { getToken } from "@/utils/auth";
import ExcelUploadModal from "./ExcelUploadModal";
import DashboardLayout from "../../layout/DashboardLayout";
import GraphModal from "./GraphModal";
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
  }, [data, selectedDay, selectedOperator]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

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
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0E1A]">
                Amazon Products Analytics
              </h2>
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
              </div>
            )}
          </div>
        </div>

        {/* Toolbar: Day, Operator, Date, and Time Filters (In between Header and Table) */}
        {!isLoading && data.length > 0 && (
          <div className="rounded-2xl border border-[#E7E0D2] bg-white p-3.5 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
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

              {/* Reset filter button if active */}
              {(selectedDay !== "all" || selectedOperator !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay("all");
                    setSelectedOperator("all");
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition shadow-2xs cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Right actions: Download Insights & SKU Count */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() =>
                  downloadAmazonAnalyticsInsights({
                    data: filteredData.length > 0 ? filteredData : data,
                    selectedDate,
                  })
                }
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#FFF3D6] ring-2 ring-[#E8C16D]/30 active:scale-[0.98] cursor-pointer"
                title="Download complete analytics insights Excel sheet"
              >
                <FileDown className="h-4 w-4 text-[#B88728]" />
                <span>Download Insights</span>
              </button>

              {/* Total / Filtered Counts */}
              <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-2xs whitespace-nowrap">
                Showing <span className="font-bold text-[#0A0E1A]">{filteredData.length}</span> of{" "}
                <span className="font-bold text-[#0A0E1A]">{data.length}</span> SKUs
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-[#E7E0D2] bg-white shadow-sm">
            <RefreshCw className="h-8 w-8 animate-spin text-[#B88728]" />
            <p className="mt-4 text-sm text-slate-500">Loading data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-[#E7E0D2] bg-white p-16 text-center shadow-sm">
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
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] hover:bg-[#FFF3D6] px-6 py-3 font-bold text-[#0A0E1A] transition-all shadow-sm active:scale-[0.98] cursor-pointer ring-2 ring-[#E8C16D]/30"
              >
                <FileDown size={20} className="text-[#B88728]" />
                <span>Download Demo Sheet</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-6 py-3 font-bold text-[#0A0E1A] transition-all hover:bg-[#d4af5a] shadow-sm"
              >
                <Upload size={20} />
                <span>Upload Excel File</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden rounded-xl">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
                  <tr>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[140px]">Operator Name</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[150px]">Seller SKU</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[200px]">Associated URL</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[120px]">ASIN</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[250px]">BSR / Rank</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[150px]">Rating & Reviews</th>
                    <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E0D2] bg-white text-sm sm:text-base">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-medium">No records found matching the selected filters.</p>
                          {(selectedDay !== "all" || selectedOperator !== "all") && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDay("all");
                                setSelectedOperator("all");
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
                      // Extract history data based on selectedDate
                      const historyItem = item.history?.find((h: any) => h.dateString === selectedDate);
                      const displayCategory = historyItem?.clothingRank;
                      const displaySubcategory = historyItem?.rank;
                      const displayRating = historyItem?.rating;
                      const displayReviews = historyItem?.reviews;

                      return (
                        <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-4 py-4 text-center">
                            {item.operatorName ? (
                              <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-900 border border-slate-200">
                                {item.operatorName}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal italic">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs sm:text-sm font-semibold text-slate-900">
                              {item.sku}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center max-w-xs md:max-w-sm">
                            {item.url ? (
                              <div className="group relative inline-flex justify-center">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={item.url}
                                  className="text-blue-600 hover:text-blue-800 hover:underline inline-block font-semibold"
                                >
                                  {item.sku}
                                </a>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No URL</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {item.asin ? (
                              <span className="font-semibold text-slate-800">{item.asin}</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {displayCategory || displaySubcategory ? (
                              <div className="flex flex-col gap-1 text-sm">
                                {displayCategory && <span className="font-medium text-slate-700">{displayCategory}</span>}
                                {displaySubcategory && <span className="text-slate-500">{displaySubcategory}</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {displayRating || displayReviews ? (
                              <div className="flex flex-col gap-1 text-sm">
                                {displayRating && <span className="font-bold text-[#E8C16D]">{displayRating} / 5</span>}
                                {displayReviews && <span className="text-slate-500">{displayReviews} reviews</span>}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedGraphItem(item);
                                setIsGraphModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 rounded-lg bg-[#FAF6F0] border border-[#E8C16D]/30 px-3 py-1.5 text-sm font-semibold text-[#E8C16D] transition hover:bg-[#E8C16D]/10 mx-auto"
                              title="Show Item Graph"
                            >
                              <BarChart3 size={16} />
                              Graph
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
      </div>
    </DashboardLayout>
  );
}
