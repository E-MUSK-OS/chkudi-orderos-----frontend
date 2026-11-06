"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import OrderProcessSummary from "./components/OrderProcessSummary";
import { amazonOrderService } from "@/components/Dashboard/OrderProcess/Amazon/OrderProcess/services/amazonOrder.service";
import { getTodayDateStringIST } from "@/components/Dashboard/OrderProcess/Amazon/AwbScan/timeUtils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, RefreshCw, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStringIST);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [summaryCounts, setSummaryCounts] = useState({
    total: 0,
    pending: 0,
    scanned: 0,
  });

  const formattedDate = useMemo(() => {
    if (!selectedDate) return "All Dates";
    try {
      return format(parseISO(selectedDate), "dd MMM yyyy");
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const parsedSelected = useMemo(() => {
    if (!selectedDate) return undefined;
    try {
      const d = parseISO(selectedDate);
      return isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  }, [selectedDate]);

  const fetchSummary = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await amazonOrderService.getDailySummary(selectedDate || undefined);
        if (res && res.success && res.data) {
          setSummaryCounts({
            total: res.data.totalOrders ?? 0,
            pending: res.data.pendingOrders ?? 0,
            scanned: res.data.scannedOrders ?? 0,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch Amazon orders daily summary:", err);
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    fetchSummary(false);
  }, [fetchSummary]);

  const handleRefresh = useCallback(() => {
    fetchSummary(false);
    toast.success("Summary refreshed");
  }, [fetchSummary]);

  return (
    <DashboardLayout title="Order Process">
      <div className="space-y-6">
        {/* Header Card matching UI Theme */}
        <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Order Process Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Amazon order processing and packing scan throughput.
              </p>
            </div>

            {/* Date Filter & Refresh Controls */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
              {/* Date Filter Popover matching AwbToolbar */}
              <div className="relative flex items-center">
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger className="inline-flex h-10 sm:h-11 items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white transition-all shadow-xs cursor-pointer hover:border-[#E8C16D] hover:bg-slate-50 dark:hover:bg-white/[0.06] dark:hover:border-[#F5C451]/50 focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30">
                    <div className="grid h-5 w-5 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#E8C16D]/10 text-[#B88728] dark:text-[#F5C451] shrink-0 border border-[#E8C16D]/30 dark:border-[#E8C16D]/20">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-left font-bold whitespace-nowrap min-w-[85px] sm:min-w-[95px]">
                      {formattedDate}
                    </span>
                    {selectedDate && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            setSelectedDate("");
                          }
                        }}
                        className="ml-1 p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-600 transition cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                        title="Clear date filter"
                      >
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-auto p-3 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-xl z-50"
                  >
                    <Calendar
                      mode="single"
                      selected={parsedSelected}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(format(date, "yyyy-MM-dd"));
                          setIsDatePopoverOpen(false);
                        }
                      }}
                    />
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate("");
                          setIsDatePopoverOpen(false);
                        }}
                        className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        All Dates
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = format(new Date(), "yyyy-MM-dd");
                          setSelectedDate(today);
                          setIsDatePopoverOpen(false);
                        }}
                        className="text-[11px] font-bold text-[#B88728] dark:text-[#F5C451] hover:text-[#0A0E1A] dark:hover:text-white transition cursor-pointer px-2.5 py-1 rounded-lg hover:bg-[#FFF9EC] dark:hover:bg-[#E8C16D]/10"
                      >
                        Today
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Refresh Button matching AwbToolbar */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                className="group inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.08] bg-[#FEFAEE] dark:bg-[#131926] px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-[#6A4D1D] dark:text-[#F5C451] transition-all duration-200 shadow-xs hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 hover:shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 text-[#6A4D1D] dark:text-[#E8C16D] transition-colors group-hover:text-[#4A3514] dark:group-hover:text-[#0A0E1A] ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Summary Cards matching AwbScanSummary */}
        <OrderProcessSummary
          total={summaryCounts.total}
          scanned={summaryCounts.scanned}
          pending={summaryCounts.pending}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
