"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";

/* =========================================================================
   1. RowsPerPageDropdown Component & Types
   ========================================================================= */

export const DEFAULT_PAGE_SIZE_OPTIONS: number[] = [10, 20, 50, 100];

export type PaginationVariant = "dark" | "light" | "gold" | "theme";

export interface RowsPerPageDropdownProps {
  limit?: number;
  value?: number;
  onLimitChange?: (limit: number) => void;
  onChange?: (value: number) => void;
  options?: number[];
  variant?: PaginationVariant;
  size?: "sm" | "md";
  dropDirection?: "up" | "down" | "auto";
  className?: string;
}

export function RowsPerPageDropdown({
  limit,
  value,
  onLimitChange,
  onChange,
  options = DEFAULT_PAGE_SIZE_OPTIONS,
  variant = "theme",
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
  const [mounted, setMounted] = useState(false);
  const [openUpward, setOpenUpward] = useState(dropDirection !== "down");
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const menuHeight = options.length * 32 + 16;
    let up = dropDirection === "up";
    if (dropDirection === "auto" || dropDirection === undefined) {
      up = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    } else if (dropDirection === "down") {
      up = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    } else if (dropDirection === "up") {
      up = spaceAbove >= menuHeight || spaceAbove >= spaceBelow;
    }

    setOpenUpward(up);

    const rightPos = Math.max(8, viewportWidth - rect.right);

    if (up) {
      setMenuStyle({
        position: "fixed",
        bottom: `${Math.max(8, viewportHeight - rect.top + 6)}px`,
        right: `${rightPos}px`,
        zIndex: 9999,
        maxHeight: `${Math.max(100, spaceAbove - 16)}px`,
      });
    } else {
      setMenuStyle({
        position: "fixed",
        top: `${Math.max(8, rect.bottom + 6)}px`,
        right: `${rightPos}px`,
        zIndex: 9999,
        maxHeight: `${Math.max(100, spaceBelow - 16)}px`,
      });
    }
  }, [dropDirection, options.length]);

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
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

  // Recalculate on scroll or resize while open
  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    window.addEventListener("scroll", handleScrollOrResize, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

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
    theme: "border-[#E7E0D2] bg-white text-[#0A0E1A] hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40 focus:border-[#E8C16D] focus:ring-[#E8C16D]/30 dark:border-white/[0.1] dark:bg-[#080B11] dark:text-white dark:hover:border-[#E8C16D] dark:focus:ring-[#E8C16D]/30",
  }[variant];

  // Chevron icon colors
  const chevronColors = {
    dark: "text-[#E8C16D]",
    light: "text-[#B88728]",
    gold: "text-[#B88728]",
    theme: "text-[#B88728] dark:text-[#E8C16D]",
  }[variant];

  // Menu popup panel styling
  const menuPanelClasses = {
    dark: "border-[#E8C16D]/40 bg-[#0A0E1A] text-white shadow-2xl",
    light: "border-[#E7E0D2] bg-white text-[#0A0E1A] shadow-xl",
    gold: "border-[#E8C16D]/50 bg-white text-[#0A0E1A] shadow-xl",
    theme: "border-[#E7E0D2] bg-white text-[#0A0E1A] shadow-xl dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-white dark:shadow-2xl",
  }[variant];

  // Menu item button active / normal styles
  const getItemClasses = (isSelected: boolean) => {
    if (isSelected) {
      if (variant === "gold") {
        return "bg-[#0A0E1A] text-[#E8C16D] shadow-xs font-bold";
      }
      return "bg-[#E8C16D] text-[#0A0E1A] shadow-xs font-bold";
    }

    if (variant === "theme") {
      return "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728] dark:text-slate-200 dark:hover:bg-[#1A160E] dark:hover:text-[#E8C16D]";
    }

    if (variant === "dark") {
      return "text-slate-200 hover:bg-[#141B2D] hover:text-[#E8C16D]";
    }
    return "text-slate-700 hover:bg-[#FFF9EC] hover:text-[#B88728]";
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
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

      {/* Dropdown Options Popup mounted via portal so it is never clipped by table overflow-hidden */}
      {isOpen && mounted && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className={`
            min-w-[86px]
            rounded-xl
            border
            p-1.5
            shadow-2xl
            duration-100
            ${openUpward ? "origin-bottom animate-in fade-in zoom-in-95" : "origin-top animate-in fade-in zoom-in-95"}
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
                    w-full
                    flex
                    items-center
                    justify-between
                    gap-2
                    rounded-xl
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
        </div>,
        document.body
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
  variant?: PaginationVariant;
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
  options = DEFAULT_PAGE_SIZE_OPTIONS,
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
  const isTheme = variant === "theme";

  const defaultContainerClass = isTheme
    ? "mt-6 flex flex-col gap-4 rounded-2xl border border-[#E7E0D2] bg-white text-slate-700 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm transition-colors dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-300"
    : isLight
    ? "mt-6 flex flex-col gap-4 rounded-xl border border-[#E7E0D2] bg-white text-slate-700 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm transition-colors dark:border-white/[0.08] dark:bg-[#0F1626] dark:text-slate-300"
    : "mt-6 flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#0F172A] text-gray-300 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm transition-colors dark:border-white/[0.08] dark:bg-[#090D17]";

  const containerClasses = className
    ? `flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 transition-colors ${className}`
    : defaultContainerClass;

  const countTextColor = isTheme || isLight
    ? "text-slate-600 dark:text-slate-400"
    : "text-slate-300 dark:text-slate-400";

  const countBoldColor = isTheme || isLight
    ? "text-[#0A0E1A] dark:text-white"
    : "text-white";

  const rowsLabelColor = isTheme || isLight
    ? "text-slate-600 dark:text-slate-400"
    : "text-slate-300 dark:text-slate-400";

  const prevNextBtnClass = isTheme
    ? "border-[#E7E0D2] bg-white text-[#0A0E1A] hover:bg-[#FFF9EC] hover:text-[#B88728] hover:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-white dark:hover:bg-[#1A160E] dark:hover:text-[#E8C16D] dark:hover:border-[#E8C16D]"
    : isLight
    ? "border-[#0A0E1A] bg-[#0A0E1A] text-[#E8C16D] hover:bg-[#161D2E] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:to-[#E5A827] dark:text-[#080B11]"
    : "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#ddb75d] hover:border-[#ddb75d] disabled:hover:bg-[#E8C16D] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:to-[#E5A827] dark:text-[#080B11]";

  const pageIndicatorClass = isTheme
    ? "border-[#E7E0D2] bg-white text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#080B11] dark:text-white"
    : isLight
    ? "border-[#E7E0D2] bg-[#FFF9EC] text-[#0A0E1A] dark:border-white/[0.08] dark:bg-[#141B2D] dark:text-white"
    : "border-slate-700 bg-[#141B2D] text-white dark:border-white/[0.08] dark:bg-[#0F1626]";

  return (
    <div className={containerClasses}>
      {/* Left count indicator */}
      <div className={`text-xs sm:text-sm text-center sm:text-left ${countTextColor}`}>
        Showing{" "}
        <span className={`font-bold ${countBoldColor}`}>
          {start}
        </span>
        {" - "}
        <span className={`font-bold ${countBoldColor}`}>
          {end}
        </span>
        {" of "}
        <span className={`font-bold ${countBoldColor}`}>
          {currentTotal}
        </span>{" "}
        {itemName}
      </div>

      {/* Right controls */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
        {/* Rows Per Page dropdown */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs sm:text-sm font-medium ${rowsLabelColor}`}>
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
            ${prevNextBtnClass}
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
            ${pageIndicatorClass}
          `}
        >
          <span className={isTheme || isLight ? "text-[#B88728] dark:text-[#E8C16D] font-bold" : "text-[#E8C16D] dark:text-[#F5C451]"}>
            {page}
          </span>
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
            ${prevNextBtnClass}
          `}
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
    </div>
  );
}