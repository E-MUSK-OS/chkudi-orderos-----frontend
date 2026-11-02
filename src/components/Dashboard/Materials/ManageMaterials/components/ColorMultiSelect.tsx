"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronsUpDown, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultColorPresets } from "../constants/material.constants";
import { useSaveDropdownOption } from "../hooks/useDropdownOptions";

export interface ColorPreset {
  name: string;
  hex: string;
}

export const KNOWN_NAMED_COLORS: Record<string, string> = {
  black: "#111827",
  white: "#FFFFFF",
  red: "#EF4444",
  blue: "#3B82F6",
  navy: "#1E3A8A",
  magenta: "#D946EF",
  green: "#22C55E",
  yellow: "#EAB308",
  grey: "#6B7280",
  gray: "#6B7280",
  charcoal: "#374151",
  beige: "#D4C5B9",
  olive: "#6B8E23",
  maroon: "#800000",
  pink: "#EC4899",
  orange: "#F97316",
  purple: "#A855F7",
  brown: "#78350F",
  teal: "#14B8A6",
  gold: "#EAB308",
  silver: "#9CA3AF",
  cream: "#FFFDD0",
  khaki: "#C3B091",
  lavender: "#E6E6FA",
  coral: "#FF7F50",
  peach: "#FFDAB9",
  turquoise: "#40E0D0",
  cyan: "#06B6D4",
  indigo: "#6366F1",
  lime: "#84CC16",
  emerald: "#10B981",
  rose: "#F43F5E",
  sky: "#0EA5E9",
  amber: "#F59E0B",
  violet: "#8B5CF6",
  fuchsia: "#D946EF",
  mustard: "#FFDB58",
  burgundy: "#800020",
  rust: "#B7410E",
  mint: "#98FF98",
  tan: "#D2B48C",
  salmon: "#FA8072",
};

interface ColorMultiSelectProps {
  label?: string;
  value: string[];
  onChange: (colors: string[]) => void;
  additionalColors?: string[];
  error?: string;
  className?: string;
}

export default function ColorMultiSelect({
  label = "Colors.",
  value = [],
  onChange,
  additionalColors = [],
  error,
  className,
}: ColorMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"down" | "up">("down");
  const [newColorName, setNewColorName] = useState("");
  const [customHex, setCustomHex] = useState("#E11D48");
  const [hexInput, setHexInput] = useState("E11D48");
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  const handleHexInputChange = (val: string) => {
    const raw = val.replace(/^#/, "");
    const clean = raw.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
    setHexInput(clean);
    if (clean.length === 3 || clean.length === 6) {
      const fullHex =
        clean.length === 3
          ? `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
          : `#${clean}`;
      setCustomHex(fullHex.toUpperCase());
    }
  };

  const [localCustomColors, setLocalCustomColors] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_colors");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [customColorHexMap, setCustomColorHexMap] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_color_hexes");
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const saveOptionMutation = useSaveDropdownOption();

  const getColorHex = (name: string): string => {
    const clean = (name || "").toLowerCase().trim();
    if (customColorHexMap[clean]) return customColorHexMap[clean];
    const preset = defaultColorPresets.find((c) => c.name.toLowerCase() === clean);
    if (preset) return preset.hex;
    if (KNOWN_NAMED_COLORS[clean]) return KNOWN_NAMED_COLORS[clean];
    return "#6B7280";
  };

  // Merge default presets + additional custom colors + locally added custom colors
  const allColors: ColorPreset[] = React.useMemo(() => {
    const list: ColorPreset[] = [...defaultColorPresets];
    const seen = new Set(list.map((c) => c.name.toLowerCase()));

    const addUnique = (name: string, defaultHex = "#6B7280") => {
      const clean = name.trim();
      if (clean && !seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        list.push({
          name: clean,
          hex: customColorHexMap[clean.toLowerCase()] || KNOWN_NAMED_COLORS[clean.toLowerCase()] || defaultHex,
        });
      }
    };

    additionalColors.forEach((c) => addUnique(c));
    localCustomColors.forEach((c) => addUnique(c));
    value.forEach((c) => addUnique(c));

    return list;
  }, [additionalColors, localCustomColors, value, customColorHexMap]);

  // Determine whether to open upward or downward
  const determineDirection = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 280 && spaceAbove > spaceBelow) {
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

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingCustom(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setIsAddingCustom(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Recalculate direction on scroll or resize when open
  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => {
      determineDirection();
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  const toggleColor = (name: string) => {
    const exists = value.some((v) => v.toLowerCase() === name.toLowerCase());
    let next: string[];
    if (exists) {
      next = value.filter((v) => v.toLowerCase() !== name.toLowerCase());
    } else {
      next = [...value, name];
    }
    onChange(next);
  };

  const removeColor = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v.toLowerCase() !== name.toLowerCase()));
  };

  const handleAddCustomColor = () => {
    const trimmed = newColorName.trim();
    if (!trimmed) return;

    if (!value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...value, trimmed]);
    }

    let finalHex = customHex;
    if (hexInput && (hexInput.length === 3 || hexInput.length === 6)) {
      finalHex =
        hexInput.length === 3
          ? `#${hexInput[0]}${hexInput[0]}${hexInput[1]}${hexInput[1]}${hexInput[2]}${hexInput[2]}`.toUpperCase()
          : `#${hexInput}`.toUpperCase();
    }

    const updatedHexMap = {
      ...customColorHexMap,
      [trimmed.toLowerCase()]: finalHex,
    };
    setCustomColorHexMap(updatedHexMap);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("orderos_custom_color_hexes", JSON.stringify(updatedHexMap));
      } catch {}
    }

    if (!localCustomColors.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...localCustomColors, trimmed];
      setLocalCustomColors(updated);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("orderos_custom_colors", JSON.stringify(updated));
        } catch {}
      }
    }

    try {
      saveOptionMutation.mutate({
        field: "color",
        value: trimmed,
        label: trimmed,
      });
    } catch (e) {
      console.error("Failed to save custom color to database:", e);
    }

    setNewColorName("");
    setHexInput("E11D48");
    setCustomHex("#E11D48");
    setIsAddingCustom(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn("space-y-1.5 w-full", isOpen && "relative z-40", className)}
    >
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        {label}
      </label>

      {/* Selector Box */}
      <div className={cn("relative", isOpen && "z-50")}>
        <div
          onClick={handleToggle}
          className={cn(
            "w-full min-h-[44px] sm:min-h-[48px] px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer text-xs sm:text-sm font-semibold",
            "border border-slate-200 bg-white hover:border-[#E8C16D] hover:bg-slate-50/50 shadow-xs",
            "dark:border-white/[0.08] dark:bg-[#131926] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]",
            isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20",
            error && "border-rose-500 dark:border-rose-500"
          )}
        >
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            {value.length === 0 ? (
              <span className="text-slate-400 dark:text-slate-500">
                Select...
              </span>
            ) : (
              value.map((colorName) => {
                const hex = getColorHex(colorName);
                const isLightHex = ["#ffffff", "#fff", "#fffdd0", "#ffff00"].includes(hex.toLowerCase());
                return (
                  <span
                    key={colorName}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] shadow-2xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/20"
                      style={{
                        backgroundColor: hex,
                        boxShadow: isLightHex ? "inset 0 0 0 1px rgba(0,0,0,0.15)" : undefined,
                      }}
                    />
                    <span>{colorName}</span>
                    <button
                      type="button"
                      onClick={(e) => removeColor(colorName, e)}
                      className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })
            )}
          </div>

          <ChevronsUpDown
            size={15}
            className={cn(
              "shrink-0 text-slate-400 dark:text-slate-400 ml-2 transition-transform duration-200",
              isOpen && "text-[#B88728] dark:text-[#F5C451]"
            )}
          />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className={cn(
              "absolute z-50 left-0 right-0 min-w-[280px] rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden animate-in fade-in-50 duration-150",
              openDirection === "up"
                ? "bottom-full mb-1.5 origin-bottom zoom-in-95"
                : "top-full mt-1.5 origin-top zoom-in-95"
            )}
          >
            <div className="p-3 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Available Colors ({allColors.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCustom(true);
                  setTimeout(() => addInputRef.current?.focus(), 50);
                }}
                className="text-[11px] font-bold text-[#B88728] dark:text-[#F5C451] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Custom Color</span>
              </button>
            </div>

            {/* Custom Color Form */}
            {isAddingCustom && (
              <div className="p-3 bg-amber-50/50 dark:bg-[#C89B3C]/10 border-b border-amber-200/50 dark:border-white/[0.08] space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    ref={addInputRef}
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    placeholder="Color Name (e.g. Sage Green)"
                    className="flex-1 h-9 px-3 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#131926] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                  />
                  <div className="flex items-center gap-1.5 h-9 px-2 bg-white dark:bg-[#131926] rounded-xl border border-slate-200 dark:border-white/[0.1]">
                    <span className="text-xs font-bold text-slate-400">#</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={hexInput}
                      onChange={(e) => handleHexInputChange(e.target.value)}
                      placeholder="Hex"
                      className="w-14 text-xs font-mono font-bold uppercase bg-transparent outline-none text-[#0A0E1A] dark:text-white"
                    />
                    <input
                      type="color"
                      value={customHex}
                      onChange={(e) => {
                        setCustomHex(e.target.value);
                        setHexInput(e.target.value.replace("#", "").toUpperCase());
                      }}
                      className="w-6 h-6 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="px-3 h-8 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="px-4 h-8 text-xs font-bold bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-black rounded-lg cursor-pointer"
                  >
                    Save & Add
                  </button>
                </div>
              </div>
            )}

            {/* Color Grid / List */}
            <div className="max-h-56 overflow-y-auto custom-scrollbar p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {allColors.map((color) => {
                const isSelected = value.some(
                  (v) => v.toLowerCase() === color.name.toLowerCase()
                );
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => toggleColor(color.name)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer",
                      isSelected
                        ? "bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30 font-bold"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]"
                    )}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 dark:border-white/20"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="truncate flex-1">{color.name}</span>
                    {isSelected && <Check size={13} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 font-medium">{error}</p>
      )}
    </div>
  );
}
