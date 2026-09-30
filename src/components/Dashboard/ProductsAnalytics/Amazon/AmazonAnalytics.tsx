"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Upload, Plus, Package, RefreshCw, ChevronLeft, ChevronRight, Clock, BarChart3, Calendar as CalendarIcon, FileDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { getToken } from "@/utils/auth";
import ExcelUploadModal from "./ExcelUploadModal";
import DashboardLayout from "../../layout/DashboardLayout";
import GraphModal from "./GraphModal";
import { downloadAmazonAnalyticsDemoSheet } from "./utils/downloadDemoSheet";
import { getTodayDateStringIST, getIstHourAndMinute } from "../../OrderProcess/Amazon/AwbScan/timeUtils";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface AnalyticsData {
  id: string;
  sku: string;
  url: string;
  asin?: string;
  bsrCategory?: string;
  bsrSubcategory?: string;
  rating?: number;
  reviewCount?: number;
  lastScrapedAt?: string;
  createdAt: string;
  history?: any[];
}

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

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, currentPage, rowsPerPage]);

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
                         checkDate.setHours(0,0,0,0);
                         const min = new Date(minDate); min.setHours(0,0,0,0);
                         const max = new Date(maxDate); max.setHours(0,0,0,0);
                         return checkDate < min || checkDate > max;
                      }}
                    />
                  </PopoverContent>
                </Popover>

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
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#E8C16D]/20 ring-2 ring-[#E8C16D]/30"
                >
                  <BarChart3 className="h-4 w-4 text-[#B88728]" />
                  <span>Show Graph</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add More</span>
                </button>
              </div>
            )}
          </div>
        </div>

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <RefreshCw className="h-8 w-8 animate-spin text-[#E8C16D]" />
          <p className="mt-4 text-sm text-slate-400">Loading data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <Upload size={32} className="text-[#E8C16D]" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">No Analytics Data Found</h2>
          <p className="mb-8 max-w-md text-sm text-slate-400">
            It looks like you haven&apos;t uploaded any Amazon SKUs yet. Upload an Excel file containing your SKUs to get started.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={downloadAmazonAnalyticsDemoSheet}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] hover:bg-[#FFF3D6] px-6 py-3 font-bold text-[#0A0E1A] transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              <FileDown size={20} className="text-[#B88728]" />
              <span>Download Demo Sheet</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#E8C16D] px-6 py-3 font-bold text-[#0A0E1A] transition-all hover:bg-[#d4af5a] shadow-lg shadow-[#E8C16D]/20"
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
                  <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-24">#</th>
                  <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[150px]">Seller SKU</th>
                  <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[200px]">Associated URL</th>
                  <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[120px]">ASIN</th>
                  <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[250px]">BSR / Rank</th>
                  <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap min-w-[150px]">Rating & Reviews</th>
                  <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D2] bg-white text-sm sm:text-base">
                {paginatedData.map((item, index) => {
                  const actualIndex = (currentPage - 1) * rowsPerPage + index + 1;
                  
                  // Extract history data based on selectedDate
                  const historyItem = item.history?.find((h: any) => h.dateString === selectedDate);
                  const displayCategory = historyItem?.clothingRank;
                  const displaySubcategory = historyItem?.rank;
                  const displayRating = historyItem?.rating;
                  const displayReviews = historyItem?.reviews;

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-4 text-center font-semibold text-slate-700">
                        {actualIndex}
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
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {data.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#E7E0D2] bg-[#FAF6F0] px-4 py-3">
              <div className="text-xs sm:text-sm text-slate-500 font-medium">
                Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * rowsPerPage + 1}</span> - <span className="font-semibold text-slate-700">{Math.min(currentPage * rowsPerPage, data.length)}</span> of <span className="font-semibold text-slate-700">{data.length}</span> records
              </div>
              
              <div className="flex items-center gap-4 mt-3 sm:mt-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">Rows:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:border-[#E8C16D]"
                  >
                    {[10, 25, 50, 100].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 rounded bg-[#0A0E1A] px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#E8C16D] transition hover:bg-[#0A0E1A]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <div className="flex h-8 min-w-[2rem] items-center justify-center rounded bg-white px-2 text-xs sm:text-sm font-bold text-slate-700 border border-slate-200">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 rounded bg-[#0A0E1A] px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#E8C16D] transition hover:bg-[#0A0E1A]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
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
