"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, X, Check } from "lucide-react";
import { cn, getAvailableVerticalSpace } from "@/lib/utils";
import { defaultAlphaSizes, defaultNumericSizes } from "../constants/product.constants";
import { useSaveDropdownOption } from "../hooks/useDropdownOptions";

interface SizeMultiSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
  additionalSizes?: string[];
  disabledSizes?: string[];
}

export default function SizeMultiSelect({
  label = "Size List",
  value = "",
  onChange,
  required = false,
  error,
  className,
  additionalSizes = [],
  disabledSizes = [],
}: SizeMultiSelectProps) {
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
  const [newSizeName, setNewSizeName] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const [localCustomSizes, setLocalCustomSizes] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_sizes");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const saveOptionMutation = useSaveDropdownOption();

  // Parse comma-separated value into array of selected sizes
  const selectedSizes: string[] = React.useMemo(() => {
    if (!value || typeof value !== "string") return [];
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [value]);

  // Sync with external Setting Masters updates
  useEffect(() => {
    const handleSync = () => {
      setLocalCustomSizes([]);
    };
    window.addEventListener("dropdown_options_updated", handleSync);
    return () => window.removeEventListener("dropdown_options_updated", handleSync);
  }, []);

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

  const toggleSize = (size: string) => {
    const exists = selectedSizes.some((s) => s.toLowerCase() === size.toLowerCase());
    let next: string[];
    if (exists) {
      next = selectedSizes.filter((s) => s.toLowerCase() !== size.toLowerCase());
    } else {
      next = [...selectedSizes, size];
    }
    onChange(next.join(", "));
  };

  const removeSize = (size: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = selectedSizes.filter((s) => s.toLowerCase() !== size.toLowerCase());
    onChange(next.join(", "));
  };

  const disabledSet = React.useMemo(() => {
    return new Set((disabledSizes || []).map((s) => s.toLowerCase().trim()));
  }, [disabledSizes]);

  const activeAlphaSizes = React.useMemo(() => {
    return defaultAlphaSizes.filter((s) => !disabledSet.has(s.toLowerCase().trim()));
  }, [disabledSet]);

  const activeNumericSizes = React.useMemo(() => {
    return defaultNumericSizes.filter((s) => !disabledSet.has(s.toLowerCase().trim()));
  }, [disabledSet]);

  const selectAllAlpha = () => {
    const combined = Array.from(new Set([...selectedSizes, ...activeAlphaSizes]));
    onChange(combined.join(", "));
  };

  const selectAllNumeric = () => {
    const combined = Array.from(new Set([...selectedSizes, ...activeNumericSizes]));
    onChange(combined.join(", "));
  };

  const clearAllSizes = () => {
    onChange("");
  };

  const handleAddCustomSize = () => {
    const trimmed = newSizeName.trim().toUpperCase();
    if (!trimmed) return;

    if (!selectedSizes.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...selectedSizes, trimmed].join(", "));
    }

    setLocalCustomSizes((prev) => {
      const updated = Array.from(new Set([...prev, trimmed]));
      try {
        localStorage.setItem("orderos_custom_sizes", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      saveOptionMutation.mutate({
        field: "size",
        value: trimmed,
        label: trimmed,
      });
    } catch (e) {
      console.error("Failed to save custom size:", e);
    }

    setNewSizeName("");
    setIsAddingCustom(false);
  };

  // Distinct custom sizes not in standard lists
  const customSizes = React.useMemo(() => {
    const standardSet = new Set([
      ...defaultAlphaSizes.map((s) => s.toLowerCase()),
      ...defaultNumericSizes.map((s) => s.toLowerCase()),
    ]);

    const extras = [...additionalSizes, ...localCustomSizes, ...selectedSizes];
    const unique = new Set<string>();

    extras.forEach((s) => {
      const trimmed = s?.trim();
      if (trimmed && !standardSet.has(trimmed.toLowerCase()) && !disabledSet.has(trimmed.toLowerCase())) {
        unique.add(trimmed);
      }
    });

    return Array.from(unique);
  }, [additionalSizes, localCustomSizes, selectedSizes, disabledSet]);

  return (
    <div ref={containerRef} className={cn("space-y-1.5 w-full", className)}>
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        {label.replace(/\.+$/, "")}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>

      {/* Selector Box */}
      <div className="relative">
        <div
          onClick={handleToggle}
          className={cn(
            "w-full min-h-[44px] sm:min-h-[48px] px-3.5 py-2 flex flex-wrap items-center gap-1.5 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer text-xs sm:text-sm font-semibold",
            "border border-slate-200 bg-white hover:border-[#E8C16D] hover:bg-slate-50/50 shadow-xs",
            "dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]",
            isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20",
            error && "border-rose-500 dark:border-rose-500"
          )}
        >
          {selectedSizes.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-500">
              Select sizes (XS to 4XL, 28 to 38)...
            </span>
          ) : (
            selectedSizes.map((size) => (
              <span
                key={size}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF9EC] text-[#0A0E1A] border border-[#E8C16D]/40 dark:bg-[#1E2638] dark:text-slate-200 dark:border-white/[0.08] shadow-2xs animate-in fade-in-50"
              >
                <span>{size}</span>
                <button
                  type="button"
                  onClick={(e) => removeSize(size, e)}
                  className="hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer ml-0.5 text-slate-400"
                >
                  <X size={13} />
                </button>
              </span>
            ))
          )}

          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ml-auto",
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
            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#0B0F17]/40 text-[11px] font-bold">
              <span className="text-slate-500 dark:text-slate-400">Quick Select:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={selectAllAlpha}
                  className="px-2 py-0.5 rounded-md text-[#B88728] hover:bg-[#FFF9EC] dark:text-[#F5C451] dark:hover:bg-[#F5C451]/10 cursor-pointer"
                >
                  XS–4XL
                </button>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <button
                  type="button"
                  onClick={selectAllNumeric}
                  className="px-2 py-0.5 rounded-md text-[#B88728] hover:bg-[#FFF9EC] dark:text-[#F5C451] dark:hover:bg-[#F5C451]/10 cursor-pointer"
                >
                  28–38
                </button>
                {selectedSizes.length > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={clearAllSizes}
                      className="px-2 py-0.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {/* Section 1: Standard Alpha Sizes (XS to 4XL) */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Standard Sizes (XS to 4XL)
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {activeAlphaSizes.map((size) => {
                    const isSelected = selectedSizes.some(
                      (s) => s.toLowerCase() === size.toLowerCase()
                    );
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                          "h-9 px-2 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer",
                          isSelected
                            ? "bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black shadow-xs ring-1 ring-[#E8C16D]/30"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-slate-200"
                        )}
                      >
                        <span>{size}</span>
                        {isSelected && <Check size={12} className="ml-1 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Numeric Sizes (28 to 38) */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  Numeric Sizes (28 to 38)
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {activeNumericSizes.map((size) => {
                    const isSelected = selectedSizes.some(
                      (s) => s.toLowerCase() === size.toLowerCase()
                    );
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                          "h-9 px-2 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer",
                          isSelected
                            ? "bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black shadow-xs ring-1 ring-[#E8C16D]/30"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-slate-200"
                        )}
                      >
                        <span>{size}</span>
                        {isSelected && <Check size={12} className="ml-1 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Custom Sizes (if any) */}
              {customSizes.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Custom Sizes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {customSizes.map((size) => {
                      const isSelected = selectedSizes.some(
                        (s) => s.toLowerCase() === size.toLowerCase()
                      );
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => toggleSize(size)}
                          className={cn(
                            "h-8 px-3 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer",
                            isSelected
                              ? "bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-slate-200"
                          )}
                        >
                          <span>{size}</span>
                          {isSelected && <Check size={12} className="ml-1 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Size Footer - "Other" */}
            <div className="p-2 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#0B0F17]/50">
              {isAddingCustom ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={addInputRef}
                    type="text"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    placeholder="Enter custom size (e.g. Free Size, 5XL)..."
                    className="flex-1 h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white text-[#0A0E1A] placeholder:text-slate-400 outline-none focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-white dark:focus:border-[#F5C451]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    disabled={!newSizeName.trim() || saveOptionMutation.isPending}
                    className="h-9 px-3.5 rounded-xl bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:hover:bg-[#e6b540] dark:text-black text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="h-9 px-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#B88728] dark:text-[#F5C451] hover:bg-[#FFF9EC] dark:hover:bg-[#F5C451]/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Other (Enter custom value)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

