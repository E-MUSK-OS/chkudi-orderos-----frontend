"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
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
}

export default function DownloadDropdown({
  label = "Download",
  options,
  className = "",
  buttonClassName = "",
  menuClassName = "",
}: DownloadDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

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
        zIndex: 50,
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

      if (fitsRight) {
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

      setPanelStyle(style);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, options.length]);

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
      {/* Trigger Button - Matching Amazon Order Process Combined Matched PDF theme */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "inline-flex items-center justify-between gap-2 rounded-2xl border px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer shrink-0 min-h-[40px] sm:min-h-[44px]",
          "border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#0A0E1A] text-[#6A4D1D] dark:text-[#E8C16D] hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] dark:hover:bg-[#111726] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98]",
          isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/30",
          buttonClassName
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#6A4D1D] dark:text-[#E8C16D] transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Menu Panel - Golden Text matching our theme, responsive on all devices */}
      {isOpen && (
        <div
          style={panelStyle}
          className={cn(
            "rounded-2xl border border-white/[0.12] bg-[#0A0E1A] p-1.5 shadow-2xl ring-1 ring-black/40 animate-in fade-in-0 zoom-in-95 duration-100 select-none overflow-hidden",
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
                className="w-full text-left px-3.5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-[#E8C16D] hover:text-[#FFF8E7] hover:bg-[#161D2E] active:bg-[#1F273D] transition-colors cursor-pointer whitespace-nowrap min-h-[38px] sm:min-h-[42px] flex items-center"
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
