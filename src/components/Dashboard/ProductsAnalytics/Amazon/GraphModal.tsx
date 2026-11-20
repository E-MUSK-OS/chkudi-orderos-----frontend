"use client";

import React, { useState, useEffect } from "react";
import { X, BarChart3, RotateCcw } from "lucide-react";
import { Chart } from "react-google-charts";
import { useTheme } from "@/providers/ThemeProvider";

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any[];
  isSingleItem?: boolean;
  title?: string;
}

export default function GraphModal({
  isOpen,
  onClose,
  data,
  isSingleItem,
  title,
}: GraphModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State to track mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // State to toggle series on/off for uncluttered inspection
  const [visibleSeries, setVisibleSeries] = useState({
    reviews: true,
    categoryRank: true,
    productRank: true,
  });

  if (!isOpen) return null;

  // Helper to parse rank number from string like "#65,945 in Clothing"
  const parseRank = (rankStr?: string) => {
    if (!rankStr) return null;
    const match = rankStr.match(/#?([\d,]+)/);
    if (match && match[1]) {
      return parseInt(match[1].replace(/,/g, ""), 10);
    }
    return null;
  };

  const toggleSeries = (key: "reviews" | "categoryRank" | "productRank") => {
    setVisibleSeries((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      // Prevent turning off all series
      if (prev[key] && activeCount === 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const showAllSeries = () => {
    setVisibleSeries({
      reviews: true,
      categoryRank: true,
      productRank: true,
    });
  };

  // Define high-contrast, vivid theme-aware colors and shapes for each metric
  const seriesMeta = [
    {
      key: "reviews" as const,
      label: isSingleItem ? "Reviews" : "Total Reviews",
      color: isDark ? "#38BDF8" : "#0284C7", // Sky Blue
      shape: "circle",
      badgeBorder: "border-sky-300 dark:border-sky-500/40",
      badgeBg: "bg-sky-50 dark:bg-sky-500/15",
      badgeText: "text-sky-700 dark:text-sky-300",
      dotBg: "bg-sky-500 dark:bg-sky-400",
    },
    {
      key: "categoryRank" as const,
      label: isSingleItem ? "Category Rank" : "Avg Category Rank",
      color: isDark ? "#F59E0B" : "#D97706", // Vivid Amber / Gold
      shape: "square",
      badgeBorder: "border-amber-300 dark:border-amber-500/40",
      badgeBg: "bg-amber-50 dark:bg-amber-500/15",
      badgeText: "text-amber-700 dark:text-amber-300",
      dotBg: "bg-amber-500 dark:bg-amber-400",
    },
    {
      key: "productRank" as const,
      label: isSingleItem ? "Product Rank" : "Avg Product Rank",
      color: isDark ? "#10B981" : "#059669", // Emerald Green
      shape: "diamond",
      badgeBorder: "border-emerald-300 dark:border-emerald-500/40",
      badgeBg: "bg-emerald-50 dark:bg-emerald-500/15",
      badgeText: "text-emerald-700 dark:text-emerald-300",
      dotBg: "bg-emerald-500 dark:bg-emerald-400",
    },
  ];

  // Active series matching current visibility filters
  const activeConfigs = seriesMeta.filter((s) => visibleSeries[s.key]);

  // Construct chart data columns
  const chartData: any[] = [
    [
      { type: "string", label: "Date" },
      ...activeConfigs.map((s) => ({ type: "number", label: s.label })),
    ],
  ];

  let sortedKeys: string[] = [];

  if (data && data.length > 0) {
    const grouped: Record<string, any> = {};

    data.forEach((item) => {
      const recordsToProcess =
        item.history && item.history.length > 0 ? item.history : [item];

      recordsToProcess.forEach((record: any) => {
        const dateStr =
          record.dateString || record.lastScrapedAt || record.createdAt;
        if (!dateStr) return;

        let dateObj = new Date(dateStr);

        // Handle DD/MM/YYYY format if Date parsed as Invalid
        if (isNaN(dateObj.getTime()) && dateStr.includes("/")) {
          const parts = dateStr.split(/[/\-]/);
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            dateObj = new Date(year < 100 ? 2000 + year : year, month, day);
          }
        }

        if (isNaN(dateObj.getTime())) return;

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const sortKey = `${year}-${month}-${day}`;
        const displayKey = `${day}/${month}/${year}`;

        if (!grouped[sortKey]) {
          grouped[sortKey] = {
            displayDate: displayKey,
            totalReviews: 0,
            totalClothingRank: 0,
            countClothing: 0,
            totalRank: 0,
            countRank: 0,
          };
        }

        let rCount = 0;
        const reviewVal =
          record.reviews !== undefined ? record.reviews : record.reviewCount;
        if (typeof reviewVal === "string") {
          rCount = parseInt((reviewVal as string).replace(/,/g, ""), 10);
        } else if (typeof reviewVal === "number") {
          rCount = reviewVal;
        }
        if (!isNaN(rCount)) {
          grouped[sortKey].totalReviews += rCount;
        }

        const cRank = parseRank(record.clothingRank || record.bsrCategory);
        if (cRank !== null) {
          grouped[sortKey].totalClothingRank += cRank;
          grouped[sortKey].countClothing += 1;
        }

        const sRank = parseRank(record.rank || record.bsrSubcategory);
        if (sRank !== null) {
          grouped[sortKey].totalRank += sRank;
          grouped[sortKey].countRank += 1;
        }
      });
    });

    sortedKeys = Object.keys(grouped).sort();

    sortedKeys.forEach((key) => {
      const g = grouped[key];
      const clothingVal = isSingleItem
        ? g.totalClothingRank
        : g.countClothing > 0
          ? Math.round(g.totalClothingRank / g.countClothing)
          : null;
      const rankVal = isSingleItem
        ? g.totalRank
        : g.countRank > 0
          ? Math.round(g.totalRank / g.countRank)
          : null;

      const row: any[] = [g.displayDate];
      activeConfigs.forEach((s) => {
        if (s.key === "reviews") {
          row.push(g.totalReviews === 0 ? null : g.totalReviews);
        } else if (s.key === "categoryRank") {
          row.push(clothingVal || null);
        } else if (s.key === "productRank") {
          row.push(rankVal || null);
        }
      });

      chartData.push(row);
    });
  }

  const hasValidData = sortedKeys.length > 0;

  if (!hasValidData) {
    chartData.push(["No Data", ...activeConfigs.map(() => null)]);
  }

  // Build series options for Google Charts with distinct colors and shapes
  const seriesOptions: Record<number, any> = {};
  activeConfigs.forEach((s, idx) => {
    seriesOptions[idx] = {
      color: s.color,
      lineWidth: isMobile ? 2.5 : 3.5,
      pointSize: isMobile ? 5 : 7,
      pointShape: s.shape,
    };
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white shadow-2xl animate-in fade-in zoom-in duration-200 dark:border-white/[0.1] dark:bg-[#0F1626] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-[#E7E0D2] bg-slate-50/80 px-4 py-3 sm:px-6 sm:py-4.5 dark:border-white/[0.08] dark:bg-[#080B11]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-xl sm:rounded-2xl border border-[#E8C16D]/30 bg-[#FFF9EC] text-[#B88728] shrink-0 dark:border-[#F5C451]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451]">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-[#0A0E1A] dark:text-white truncate">
                {title || "Product Analytics Graph"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Performance overview based on rankings and customer feedback.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 sm:p-2 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 cursor-pointer shrink-0 ml-2"
            title="Close graph"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Content (Scrollable if height exceeds screen) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 custom-scrollbar">
          {/* Interactive Series Toggle Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2 sm:p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mr-0.5 sm:mr-1">
                Filter Metric:
              </span>
              {seriesMeta.map((s) => {
                const isActive = visibleSeries[s.key];
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSeries(s.key)}
                    className={`inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl border px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? `${s.badgeBorder} ${s.badgeBg} ${s.badgeText} shadow-2xs`
                        : "border-slate-200 bg-white text-slate-400 opacity-50 hover:opacity-80 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-slate-500"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0 ${s.dotBg} ${
                        s.shape === "circle"
                          ? "rounded-full"
                          : s.shape === "square"
                            ? "rounded-2xs"
                            : "rotate-45 rounded-2xs"
                      }`}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={showAllSeries}
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#B88728] transition hover:underline dark:text-[#F5C451] cursor-pointer ml-auto"
            >
              <RotateCcw size={12} />
              Reset All
            </button>
          </div>

          {/* Graph Display Area or Empty State */}
          {!hasValidData ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] dark:bg-[#1A160E] dark:text-[#E8C16D] mb-3 border border-[#E8C16D]/40">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#0A0E1A] dark:text-white">
                No Historical Data Available
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                There are no historical tracking records with dates to plot for this item.
              </p>
            </div>
          ) : (
            <div className="relative w-full h-[290px] xs:h-[320px] sm:h-[380px] md:h-[440px] bg-white rounded-2xl border border-slate-200 p-2 sm:p-4 flex flex-col items-center justify-center overflow-hidden shadow-xs dark:border-white/[0.08] dark:bg-[#080B11]">
              <Chart
                chartType="LineChart"
                width="100%"
                height="100%"
                data={chartData}
                loader={
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-8">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading chart...</span>
                  </div>
                }
                options={{
                  title: "",
                  curveType: "none",
                  fontName: "inherit",
                  backgroundColor: "transparent",
                  legend: {
                    position: "top",
                    alignment: "center",
                    maxLines: isMobile ? 2 : 1,
                    textStyle: {
                      fontSize: isMobile ? 10 : 12,
                      color: isDark ? "#F8FAFC" : "#0A0E1A",
                      bold: true,
                    },
                  },
                  series: seriesOptions,
                  hAxis: {
                    textStyle: {
                      fontSize: isMobile ? 9 : 10,
                      color: isDark ? "#94A3B8" : "#64748B",
                      bold: true,
                    },
                    gridlines: { color: "transparent" },
                    baselineColor: isDark
                      ? "rgba(255, 255, 255, 0.15)"
                      : "#E7E0D2",
                    slantedText: true,
                    slantedTextAngle: 45,
                    showTextEvery:
                      isMobile && sortedKeys.length > 7
                        ? Math.ceil(sortedKeys.length / 6)
                        : undefined,
                  },
                  vAxis: {
                    textStyle: {
                      fontSize: isMobile ? 9 : 11,
                      color: isDark ? "#94A3B8" : "#64748B",
                      bold: true,
                    },
                    gridlines: {
                      color: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                      count: isMobile ? 4 : 6,
                    },
                    minorGridlines: {
                      color: "transparent",
                      count: 0,
                    },
                    baselineColor: isDark
                      ? "rgba(255, 255, 255, 0.15)"
                      : "#E7E0D2",
                    logScale: true,
                  },
                  interpolateNulls: true,
                  chartArea: {
                    left: isMobile ? 52 : 70,
                    top: isMobile ? 32 : 38,
                    width: isMobile ? "82%" : "88%",
                    height: isMobile ? "62%" : "68%",
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#E7E0D2] bg-slate-50/80 px-4 py-2.5 sm:px-6 sm:py-3.5 flex justify-end dark:border-white/[0.08] dark:bg-[#080B11]">
          <button
            onClick={onClose}
            className="rounded-xl sm:rounded-2xl border border-[#E8C16D]/60 bg-[#FEFAEE] px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#6A4D1D] shadow-2xs transition-all hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_15px_rgba(245,196,81,0.25)] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
