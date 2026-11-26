"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Plus, Check, X } from "lucide-react";
import { cn, getAvailableVerticalSpace } from "@/lib/utils";
import { useDropdownOptions, useSaveDropdownOption } from "../hooks/useDropdownOptions";
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";
import { toast } from "sonner";

export interface GenderOption {
  label: string;
  value: string;
}

interface GenderMultiSelectProps {
  label?: string;
  value?: string[] | string;
  onChange: (value: string[]) => void;
  options?: GenderOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  singleSelect?: boolean;
}

export default function GenderMultiSelect({
  label = "Gender",
  value = [],
  onChange,
  options = [],
  placeholder = "Select Gender...",
  required = false,
  error,
  className,
  singleSelect = false,
}: GenderMultiSelectProps) {
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
  const [localCustomOptions, setLocalCustomOptions] = useState<GenderOption[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const saveOptionMutation = useSaveDropdownOption();
  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  // Load gender options dynamically from Setting Master
  const settingMasterOptions: GenderOption[] = useMemo(() => {
    const merged = buildMergedOptions(
      "gender",
      [],
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.genders
    );
    return merged.map((m) => ({ label: m.label, value: m.value }));
  }, [dropdownData]);

  // Normalize incoming value to string[] (splitting any comma-joined entries)
  const selectedValues: string[] = useMemo(() => {
    const rawList = Array.isArray(value)
      ? value
      : typeof value === "string" && value.trim()
        ? [value]
        : [];
    return rawList
      .flatMap((v) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  // Merge options strictly from Setting Master (or passed options) + custom options + selected values
  const mergedOptions: GenderOption[] = useMemo(() => {
    const map = new Map<string, GenderOption>();
    const baseList = options && options.length > 0 ? options : settingMasterOptions;

    [...baseList, ...localCustomOptions].forEach((opt) => {
      const v = String(opt.value || opt.label || "").trim();
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
  }, [options, settingMasterOptions, localCustomOptions, selectedValues]);

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
    const exists = selectedValues.some((v) => v.toLowerCase() === val.toLowerCase());
    if (singleSelect) {
      onChange(exists ? [] : [val]);
      setIsOpen(false);
      return;
    }

    let next: string[];
    if (exists) {
      next = selectedValues.filter((v) => v.toLowerCase() !== val.toLowerCase());
    } else {
      next = [...selectedValues, val];
    }

    onChange(next);
  };

  const removeTag = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = selectedValues.filter((v) => v.toLowerCase() !== val.toLowerCase());
    onChange(next);
  };

  const handleCustomSubmit = () => {
    const trimmed = customValue.trim();
    if (!trimmed) {
      setIsAddingCustom(false);
      return;
    }

    const existingMatch = mergedOptions.find(
      (o) =>
        o.value.trim().toLowerCase() === trimmed.toLowerCase() ||
        o.label.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existingMatch) {
      const targetVal = existingMatch.value;
      if (singleSelect) {
        onChange([targetVal]);
      } else if (!selectedValues.some((v) => v.toLowerCase() === targetVal.toLowerCase())) {
        onChange([...selectedValues, targetVal]);
      }
      toast.info(`"${existingMatch.label}" is already available and selected`);
      setCustomValue("");
      setIsAddingCustom(false);
      return;
    }

    setLocalCustomOptions((prev) =>
      prev.some((o) => o.value.trim().toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, { label: trimmed, value: trimmed }]
    );

    if (singleSelect) {
      onChange([trimmed]);
    } else if (!selectedValues.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...selectedValues, trimmed]);
    }

    try {
      saveOptionMutation.mutate({
        field: "gender",
        value: trimmed,
        label: trimmed,
      });
    } catch (e) {
      console.error("Failed to save custom gender option:", e);
    }

    toast.success(`Added "${trimmed}" to Gender`);
    setCustomValue("");
    setIsAddingCustom(false);
  };

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
            placeholder="Enter custom gender..."
            className="flex-1 h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-[#E8C16D] dark:border-[#F5C451] bg-white dark:bg-[#131926] text-[#0A0E1A] dark:text-white outline-none focus:ring-2 focus:ring-[#E8C16D]/20 shadow-xs"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!customValue.trim() || saveOptionMutation.isPending}
            className="h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl border border-[#E8C16D]/60 dark:border-transparent bg-[#FEFAEE] text-[#6A4D1D] hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 dark:bg-[#F5C451] dark:text-black font-bold text-xs transition-all cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
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
            {selectedValues.length === 0 ? (
              <span className="text-slate-400 dark:text-slate-500 px-1">
                {placeholder}
              </span>
            ) : (
              selectedValues.map((g) => (
                <span
                  key={g}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20 shadow-2xs animate-in fade-in-50"
                >
                  <span>{g}</span>
                  <button
                    type="button"
                    onClick={(e) => removeTag(g, e)}
                    className="hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer text-purple-400 hover:bg-purple-200/50 dark:hover:bg-purple-500/20 rounded-full p-0.5"
                    title={`Remove ${g}`}
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
                  const isSelected = selectedValues.some(
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
                          ? "bg-purple-50/80 text-purple-800 font-bold border border-purple-200/60 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.04]"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <Check
                          size={14}
                          className="shrink-0 ml-2 text-purple-600 dark:text-purple-400"
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
                    className="w-full px-3 py-2 flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-500/10 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>+ Other (Enter custom gender)</span>
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
