"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Plus, Check, X } from "lucide-react";
import { cn, getAvailableVerticalSpace } from "@/lib/utils";
import { useSaveDropdownOption } from "../hooks/useDropdownOptions";
import { toast } from "sonner";

export interface MarketplaceOption {
  label: string;
  value: string;
}

interface MarketplaceMultiSelectProps {
  label?: string;
  value?: string[] | string;
  onChange: (value: string[]) => void;
  options: MarketplaceOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

export default function MarketplaceMultiSelect({
  label = "Marketplace",
  value = ["All"],
  onChange,
  options,
  placeholder = "Select Marketplace...",
  required = false,
  error,
  className,
}: MarketplaceMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"down" | "up">("down");

  const determineDirection = () => {
    if (!containerRef.current) return;
    const { spaceBelow, spaceAbove } = getAvailableVerticalSpace(containerRef.current);

    if (spaceBelow < 260 && spaceAbove > spaceBelow) {
      setOpenDirection("up");
    } else {
      setOpenDirection("down");
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      determineDirection();
    }
    setIsOpen((prev) => !prev);
  };
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [localCustomOptions, setLocalCustomOptions] = useState<MarketplaceOption[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const saveOptionMutation = useSaveDropdownOption();

  // Normalize incoming value to string[]
  const selectedValues: string[] = useMemo(() => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return ["All"];
  }, [value]);

  // Merge default options + custom options
  const mergedOptions: MarketplaceOption[] = useMemo(() => {
    const map = new Map<string, MarketplaceOption>();

    [...options, ...localCustomOptions].forEach((opt) => {
      const v = String(opt.value).trim();
      if (v && !map.has(v.toLowerCase())) {
        map.set(v.toLowerCase(), { label: opt.label || v, value: v });
      }
    });

    // Also include any selected values that might not be in options
    selectedValues.forEach((val) => {
      const trimmed = String(val).trim();
      if (trimmed && !map.has(trimmed.toLowerCase())) {
        map.set(trimmed.toLowerCase(), { label: trimmed, value: trimmed });
      }
    });

    return Array.from(map.values());
  }, [options, localCustomOptions, selectedValues]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingCustom(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    const isAll = val.toLowerCase() === "all";

    if (isAll) {
      onChange(["All"]);
      return;
    }

    const withoutAll = selectedValues.filter((v) => v.toLowerCase() !== "all");
    const exists = withoutAll.some((v) => v.toLowerCase() === val.toLowerCase());

    let next: string[];
    if (exists) {
      next = withoutAll.filter((v) => v.toLowerCase() !== val.toLowerCase());
      if (next.length === 0) {
        next = ["All"];
      }
    } else {
      next = [...withoutAll, val];
    }

    onChange(next);
  };

  const removeTag = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const withoutAll = selectedValues.filter((v) => v.toLowerCase() !== "all");
    const next = withoutAll.filter((v) => v.toLowerCase() !== val.toLowerCase());
    onChange(next.length === 0 ? ["All"] : next);
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (!trimmed) {
      setIsAddingCustom(false);
      return;
    }

    const exists = mergedOptions.some(
      (o) => o.value.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      setLocalCustomOptions((prev) => [
        ...prev,
        { label: trimmed, value: trimmed },
      ]);
    }

    const withoutAll = selectedValues.filter((v) => v.toLowerCase() !== "all");
    if (!withoutAll.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...withoutAll, trimmed]);
    }

    try {
      saveOptionMutation.mutate({
        field: "marketplace",
        value: trimmed,
        label: trimmed,
      });
    } catch (e) {
      console.error("Failed to save custom marketplace option:", e);
    }

    toast.success(`Added "${trimmed}" to Marketplace`);
    setCustomValue("");
    setIsAddingCustom(false);
  };

  const isAllSelected =
    selectedValues.length === 1 && selectedValues[0].toLowerCase() === "all";

  return (
    <div ref={containerRef} className={cn("space-y-1.5 w-full", className)}>
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        {label.replace(/\.+$/, "")}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* Main Trigger / Custom Input */}
      {isAddingCustom ? (
        <div className="flex items-center gap-2">
          <input
            ref={customInputRef}
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSubmit();
              } else if (e.key === "Escape") {
                setIsAddingCustom(false);
                setCustomValue("");
              }
            }}
            placeholder="Enter custom marketplace..."
            className="flex-1 h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#F5C451] bg-white dark:bg-[#131926] text-[#0A0E1A] dark:text-white outline-none focus:ring-2 focus:ring-[#E8C16D]/20 shadow-xs"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!customValue.trim() || saveOptionMutation.isPending}
            className="h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black font-bold text-xs hover:opacity-90 transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingCustom(false);
              setCustomValue("");
            }}
            className="h-11 sm:h-12 px-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div
            onClick={handleToggle}
            className={cn(
              "w-full min-h-[44px] sm:min-h-[48px] px-3 py-1.5 flex flex-wrap items-center gap-1.5 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer text-xs sm:text-sm font-semibold",
              "border border-slate-200 bg-white hover:border-[#E8C16D] hover:bg-slate-50/50 shadow-xs",
              "dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]",
              isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20",
              error && "border-rose-500 dark:border-rose-500"
            )}
          >
            {isAllSelected ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
                All Marketplaces
              </span>
            ) : selectedValues.length === 0 ? (
              <span className="text-slate-400 dark:text-slate-500 px-1">
                {placeholder}
              </span>
            ) : (
              selectedValues.map((mkt) => (
                <span
                  key={mkt}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF9EC] text-[#0A0E1A] border border-[#E8C16D]/40 dark:bg-[#1E2638] dark:text-slate-200 dark:border-white/[0.08] shadow-2xs animate-in fade-in-50"
                >
                  <span>{mkt}</span>
                  <button
                    type="button"
                    onClick={(e) => removeTag(mkt, e)}
                    className="hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.1] rounded-full p-0.5"
                    title={`Remove ${mkt}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}

            <ChevronDown
              size={16}
              className={cn(
                "shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ml-auto mr-1",
                isOpen && "transform rotate-180"
              )}
            />
          </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div
              className={cn(
                "absolute z-50 left-0 right-0 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden animate-in fade-in-50 duration-150",
                openDirection === "up"
                  ? "bottom-full mb-1.5 origin-bottom zoom-in-95"
                  : "top-full mt-1.5 origin-top zoom-in-95"
              )}
            >
              <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                {mergedOptions.map((opt) => {
                  const isSelected =
                    opt.value.toLowerCase() === "all"
                      ? isAllSelected
                      : selectedValues.some(
                          (v) => v.toLowerCase() === opt.value.toLowerCase()
                        );

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleOption(opt.value)}
                      className={cn(
                        "w-full px-3 py-2 flex items-center justify-between text-xs sm:text-sm font-medium rounded-xl transition-colors text-left cursor-pointer",
                        isSelected
                          ? "bg-[#FFF9EC] text-[#B88728] font-bold border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.04]"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <Check
                          size={14}
                          className="shrink-0 ml-2 text-[#B88728] dark:text-[#F5C451]"
                        />
                      )}
                    </button>
                  );
                })}

                {/* "Other" Option button */}
                <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(true);
                      setIsOpen(false);
                      setTimeout(() => customInputRef.current?.focus(), 50);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-bold text-[#B88728] hover:bg-[#FFF9EC] dark:text-[#F5C451] dark:hover:bg-[#F5C451]/10 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>+ Other (Enter custom value)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
