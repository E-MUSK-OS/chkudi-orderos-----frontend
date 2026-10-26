"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

/* =========================================================================
   1. RowsPerPageDropdown Component & Types
   ========================================================================= */

export interface RowsPerPageDropdownProps {
  limit?: number;
  value?: number;
  onLimitChange?: (limit: number) => void;
  onChange?: (value: number) => void;
  options?: number[];
  variant?: "dark" | "light" | "gold";
  size?: "sm" | "md";
  dropDirection?: "up" | "down";
  className?: string;
}

export function RowsPerPageDropdown({
  limit,
  value,
  onLimitChange,
  onChange,
  options = [10, 30, 50, 100],
  variant = "dark",
  size = "sm",
  dropDirection = "up",
  className = "",
}: RowsPerPageDropdownProps) {
  const currentLimit = value ?? limit ?? 10;
  const handleLimitChange = (newVal: number) => {
    onLimitChange?.(newVal);
    onChange?.(newVal);
  };
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Size styling
  const sizeClasses = {
    sm: "h-8 sm:h-9 px-2.5 sm:px-3 text-xs",
    md: "h-9 sm:h-10 px-3 sm:px-3.5 text-xs sm:text-sm",
  }[size];

  // Variant styles for trigger button
  const triggerVariantClasses = {
    dark: "border-slate-700 bg-[#141B2D] text-white hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-[#E8C16D]/30",
    light: "border-[#E7E0D2] bg-white text-[#0A0E1A] hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40 focus:border-[#E8C16D] focus:ring-[#E8C16D]/30",
    gold: "border-[#E8C16D] bg-[#FFF9EC] text-[#0A0E1A] hover:bg-[#FFF3D6] focus:border-[#E8C16D] focus:ring-[#E8C16D]/40",
  }[variant];

  // Chevron icon colors
  const chevronColors = {
    dark: "text-[#E8C16D]",
    light: "text-[#B88728]",
    gold: "text-[#B88728]",
  }[variant];

  // Menu popup panel styling
  const menuPanelClasses = {
    dark: "border-[#E8C16D]/40 bg-[#0A0E1A] text-white",
    light: "border-[#E7E0D2] bg-white text-[#0A0E1A]",
    gold: "border-[#E8C16D]/50 bg-white text-[#0A0E1A]",
  }[variant];

  // Menu item button active / normal styles
  const getItemClasses = (isSelected: boolean) => {
    if (isSelected) {
      if (variant === "gold") {
        return "bg-[#0A0E1A] text-[#E8C16D] shadow-xs";
      }
      return "bg-[#E8C16D] text-[#0A0E1A] shadow-xs";
    }

    if (variant === "dark") {
      return "text-slate-200 hover:bg-[#141B2D] hover:text-[#E8C16D]";
    }
    return "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728]";
  };

  // Popup position
  const positionClasses =
    dropDirection === "up"
      ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
      : "top-full mt-2 left-1/2 -translate-x-1/2";

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          inline-flex
          items-center
          gap-1.5
          rounded-xl
          border
          font-bold
          transition-all
          outline-none
          focus:ring-2
          cursor-pointer
          shadow-2xs
          ${sizeClasses}
          ${triggerVariantClasses}
        `}
        title="Select rows per page"
      >
        <span>{currentLimit}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${chevronColors} ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Options Popup */}
      {isOpen && (
        <div
          className={`
            absolute
            z-50
            min-w-[86px]
            rounded-xl
            border
            p-1.5
            shadow-2xl
            animate-in
            fade-in
            zoom-in-95
            duration-100
            ${positionClasses}
            ${menuPanelClasses}
          `}
        >
          <div className="flex flex-col gap-0.5">
            {options.map((sizeOption) => {
              const isSelected = currentLimit === sizeOption;
              return (
                <button
                  key={sizeOption}
                  type="button"
                  onClick={() => {
                    handleLimitChange(sizeOption);
                    setIsOpen(false);
                  }}
                  className={`
                    flex
                    items-center
                    justify-between
                    gap-2
                    rounded-lg
                    px-2.5
                    py-1.5
                    text-xs
                    font-bold
                    transition-all
                    cursor-pointer
                    ${getItemClasses(isSelected)}
                  `}
                >
                  <span>{sizeOption}</span>
                  {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   2. Main Pagination Component & Types
   ========================================================================= */

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalRecords?: number;
  total?: number;
  pageSize?: number;
  limit?: number;

  itemName?: string;
  options?: number[];
  variant?: "dark" | "light" | "gold";
  className?: string;
  isLoading?: boolean;

  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onLimitChange?: (limit: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalRecords,
  total,
  pageSize,
  limit,
  itemName = "records",
  options = [10, 30, 50, 100],
  variant = "dark",
  className = "",
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  onLimitChange,
}: PaginationProps) {
  const currentTotal = totalRecords ?? total ?? 0;
  const currentLimit = pageSize ?? limit ?? 10;
  const handlePageSizeChange = (newSize: number) => {
    onPageSizeChange?.(newSize);
    onLimitChange?.(newSize);
  };

  const start = currentTotal === 0 ? 0 : (page - 1) * currentLimit + 1;
  const end = Math.min(page * currentLimit, currentTotal);

  const isLight = variant === "light";

  const defaultContainerClass = isLight
    ? "mt-6 flex flex-col gap-4 rounded-xl border border-[#E7E0D2] bg-white text-slate-700 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm transition-colors dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-300"
    : "mt-6 flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#0F172A] text-gray-300 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm transition-colors dark:border-white/[0.08] dark:bg-[#090D17]";

  const containerClasses = className
    ? `flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-colors ${className}`
    : defaultContainerClass;

  return (
    <div className={containerClasses}>
      {/* Left count indicator */}
      <div className={`text-xs sm:text-sm text-center sm:text-left ${isLight ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-400"}`}>
        Showing{" "}
        <span className={`font-bold ${isLight ? "text-[#0A0E1A] dark:text-white" : "text-white"}`}>
          {start}
        </span>
        {" - "}
        <span className={`font-bold ${isLight ? "text-[#0A0E1A] dark:text-white" : "text-white"}`}>
          {end}
        </span>
        {" of "}
        <span className={`font-bold ${isLight ? "text-[#0A0E1A] dark:text-white" : "text-white"}`}>
          {currentTotal}
        </span>{" "}
        {itemName}
      </div>

      {/* Right controls */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
        {/* Rows Per Page dropdown */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs sm:text-sm font-medium ${isLight ? "text-slate-600 dark:text-slate-400" : "text-slate-300 dark:text-slate-400"}`}>
            Rows:
          </span>
          <RowsPerPageDropdown
            limit={currentLimit}
            onLimitChange={handlePageSizeChange}
            options={options}
            variant={variant}
          />
        </div>

        {/* Previous */}
        <button
          type="button"
          disabled={page <= 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          className={`
            inline-flex
            h-8 sm:h-9
            items-center
            justify-center
            gap-1
            rounded-xl
            border
            px-2.5 sm:px-3
            text-xs
            font-bold
            transition-all
            cursor-pointer
            shadow-2xs
            active:scale-[0.98]
            disabled:opacity-40
            disabled:cursor-not-allowed
            ${
              isLight
                ? "border-[#0A0E1A] bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#161D2E] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:to-[#E5A827] dark:text-[#080B11]"
                : "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#ddb75d] hover:border-[#ddb75d] disabled:hover:bg-[#E8C16D] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:to-[#E5A827] dark:text-[#080B11]"
            }
          `}
        >
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
          <span>Prev</span>
        </button>

        {/* Page Indicator */}
        <div
          className={`
            inline-flex
            h-8 sm:h-9
            min-w-[55px] sm:min-w-[65px]
            items-center
            justify-center
            rounded-xl
            border
            px-2.5
            text-xs
            font-bold
            shadow-2xs
            whitespace-nowrap
            ${
              isLight
                ? "border-[#E7E0D2] bg-[#FFF9EC] text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#141B2D] dark:text-white"
                : "border-slate-700 bg-[#141B2D] text-white dark:border-white/[0.08] dark:bg-[#0F1626]"
            }
          `}
        >
          <span className={isLight ? "text-[#B88728] dark:text-[#F5C451]" : "text-[#E8C16D] dark:text-[#F5C451]"}>{page}</span>
          <span className="mx-1 text-slate-500 font-normal">/</span>
          <span>{Math.max(totalPages, 1)}</span>
        </div>

        {/* Next */}
        <button
          type="button"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          className={`
            inline-flex
            h-8 sm:h-9
            items-center
            justify-center
            gap-1
            rounded-xl
            border
            px-2.5 sm:px-3
            text-xs
            font-bold
            transition-all
            cursor-pointer
            shadow-2xs
            active:scale-[0.98]
            disabled:opacity-40
            disabled:cursor-not-allowed
            ${
              isLight
                ? "border-[#0A0E1A] bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#161D2E] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:to-[#E5A827] dark:text-[#080B11]"
                : "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#ddb75d] hover:border-[#ddb75d] disabled:hover:bg-[#E8C16D] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:to-[#E5A827] dark:text-[#080B11]"
            }
          `}
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
    </div>
  );
}