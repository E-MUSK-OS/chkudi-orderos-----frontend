"use client";

import React from "react";
import {
  ArrowRight,
  Printer,
  Search,
  X,
  PackageOpen,
  AlertCircle,
  Boxes,
  Truck,
} from "lucide-react";

interface Props {
  search: string;
  onSearch: (value: string) => void;

  status: "OPEN" | "PRIORITY" | "PICKING" | "TRANSIT";
  onStatusChange: (status: "OPEN" | "PRIORITY" | "PICKING" | "TRANSIT") => void;

  counts: {
    OPEN: number;
    PRIORITY: number;
    PICKING: number;
    TRANSIT: number;
  };
  selectedRows: number[];
  onMoveToPicking: () => void;
  onGeneratePicklist: () => void;
  onProcess?: () => void;
}

const Toolbar = ({
  search,
  onSearch,
  status,
  onStatusChange,
  counts,
  selectedRows,
  onMoveToPicking,
  onGeneratePicklist,
  onProcess,
}: Props) => {
  const statusCards = [
    {
      key: "OPEN" as const,
      label: "Open Orders",
      count: counts.OPEN,
      icon: <PackageOpen className="h-5 w-5" />,
      description: "Awaiting fulfillment",
    },
    {
      key: "PRIORITY" as const,
      label: "Priority Orders",
      count: counts.PRIORITY,
      icon: <AlertCircle className="h-5 w-5" />,
      description: "Urgent dispatch",
    },
    {
      key: "PICKING" as const,
      label: "In Picking",
      count: counts.PICKING,
      icon: <Boxes className="h-5 w-5" />,
      description: "Being picked & packed",
    },
    {
      key: "TRANSIT" as const,
      label: "In Transit",
      count: counts.TRANSIT,
      icon: <Truck className="h-5 w-5" />,
      description: "Dispatched to carrier",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Status Stage Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statusCards.map((card) => {
          const isActive = status === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => onStatusChange(card.key)}
              className={`group relative flex flex-col justify-between rounded-2xl p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#0A0E1A] dark:bg-[#080B11] border-2 border-[#E8C16D] text-white shadow-md ring-2 ring-[#E8C16D]/30"
                  : "bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-white hover:border-[#E8C16D]/60 hover:bg-[#FFF9EC]/30 dark:hover:bg-[#1A160E]/40 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span
                  className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                    isActive ? "text-[#E8C16D]" : "text-slate-500 dark:text-slate-400 group-hover:text-[#B88728] dark:group-hover:text-[#E8C16D]"
                  }`}
                >
                  {card.label}
                </span>
                <div
                  className={`grid h-8 w-8 place-items-center rounded-xl border transition-colors ${
                    isActive
                      ? "bg-[#E8C16D]/20 text-[#E8C16D] border-[#E8C16D]/40"
                      : "bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border-[#E8C16D]/30 dark:border-[#E8C16D]/30 group-hover:bg-[#E8C16D]/20"
                  }`}
                >
                  {card.icon}
                </div>
              </div>

              <div className="flex items-baseline justify-between w-full">
                <div
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isActive ? "text-white" : "text-[#0A0E1A] dark:text-white"
                  }`}
                >
                  {card.count.toLocaleString()}
                </div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline-block">
                  {card.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Searchbar & Stage Actions */}
      <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Left side: Search input */}
        <div className="w-full md:max-w-md transition-all">
          <div className="group flex items-center gap-2.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all hover:border-[#E8C16D] hover:bg-slate-50/50 dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04] focus-within:border-[#E8C16D] focus-within:ring-2 focus-within:ring-[#E8C16D]/30 focus-within:bg-white dark:focus-within:bg-[#080B11]">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] shrink-0 border border-[#E8C16D]/30">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search Order ID..."
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white placeholder:font-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="grid h-5 w-5 place-items-center rounded-full text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer shrink-0"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right side: Action Buttons for selected orders */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {(status === "OPEN" || status === "PRIORITY") && (
            <button
              type="button"
              disabled={selectedRows.length === 0}
              onClick={onMoveToPicking}
              className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
            >
              <ArrowRight className="h-4 w-4" />
              <span>Move To In Picking ({selectedRows.length})</span>
            </button>
          )}

          {status === "PICKING" && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={selectedRows.length === 0}
                onClick={onGeneratePicklist}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs hover:bg-[#FFF3D6] dark:hover:bg-[#251F14] ring-2 ring-[#E8C16D]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
              >
                <Printer className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Generate Picklist ({selectedRows.length})</span>
              </button>

              <button
                type="button"
                disabled={selectedRows.length === 0}
                onClick={onProcess || (() => {})}
                className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Process ({selectedRows.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
