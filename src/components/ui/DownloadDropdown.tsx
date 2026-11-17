"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, FileDown, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DownloadOption {
  id: string;
  label: string;
  onClick: () => void;
}

export interface DownloadDropdownProps {
  label?: string;
  options: DownloadOption[];
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: "left" | "right" | "auto";
}

export default function DownloadDropdown({
  label = "Download",
  options,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  align = "auto",
}: DownloadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: "6px",
    zIndex: 60,
    width: "max-content",
    minWidth: "190px",
  });

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Responsive panel positioning for all devices and screen sizes
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const updatePosition = () => {
      if (!dropdownRef.current) return;
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate max available width on the screen leaving margins
      const maxAvailableWidth = Math.max(180, viewportWidth - 24);
      const targetWidth = Math.min(220, maxAvailableWidth);

      // Check vertical space (open upwards if close to bottom edge of screen)
      const spaceBelow = viewportHeight - rect.bottom;
      const estimatedHeight = options.length * 44 + 16;
      const openUpwards = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

      // Check horizontal space
      const fitsRight = rect.left + targetWidth <= viewportWidth - 12;
      const fitsLeft = rect.right - targetWidth >= 12;

      const style: React.CSSProperties = {
        position: "absolute",
        zIndex: 60,
        width: "max-content",
        minWidth: `${Math.min(190, maxAvailableWidth)}px`,
        maxWidth: `${maxAvailableWidth}px`,
      };

      if (openUpwards) {
        style.bottom = "100%";
        style.top = "auto";
        style.marginBottom = "6px";
      } else {
        style.top = "100%";
        style.bottom = "auto";
        style.marginTop = "6px";
      }

      if (align === "right") {
        style.right = 0;
        style.left = "auto";
      } else if (align === "left") {
        style.left = 0;
        style.right = "auto";
      } else {
        if (fitsLeft && !fitsRight) {
          style.right = 0;
          style.left = "auto";
        } else if (fitsRight) {
          style.left = 0;
          style.right = "auto";
        } else if (fitsLeft) {
          style.right = 0;
          style.left = "auto";
        } else {
          const offsetLeft = Math.max(12 - rect.left, -rect.left);
          style.left = `${offsetLeft}px`;
          style.right = "auto";
        }
      }

      setPanelStyle(style);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, options.length, align]);

  if (!options || options.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "relative inline-block text-left shrink-0 transition-all",
        isOpen ? "z-50" : "z-20",
        className
      )}
    >
      {/* Trigger Button - Matching OrderOS Theme Header Action Buttons */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "inline-flex items-center justify-between gap-2 rounded-2xl border px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0 min-h-[40px] sm:min-h-[44px]",
          "border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98]",
          isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D] dark:border-[#E8C16D] dark:ring-[#E8C16D]/30",
          buttonClassName
        )}
      >
        <FileDown className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D] shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#B88728] dark:text-[#E8C16D] transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Menu Panel - Styled exactly like ThemeSelectDropdown & ProfileDropdown */}
      {isOpen && (
        <div
          style={panelStyle}
          className={cn(
            "rounded-2xl border border-[#F5E6BE] bg-[#FEFAEE] p-1.5 shadow-xl dark:border-white/[0.08] dark:bg-[#0F1626] dark:shadow-2xl animate-in fade-in-0 zoom-in-95 duration-100 select-none overflow-hidden z-50",
            menuClassName
          )}
        >
          <div className="flex flex-col gap-0.5">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  opt.onClick();
                }}
                className="w-full text-left px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-[#6A4D1D] hover:bg-[#FDF2D1] hover:text-[#0A0E1A] active:bg-[#F7E7BE] dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-[#F5C451] dark:active:bg-white/[0.12] transition-colors cursor-pointer whitespace-nowrap min-h-[38px] sm:min-h-[42px] flex items-center gap-2.5"
              >
                <FileSpreadsheet className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D] shrink-0" />
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
