"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { defaultColorPresets, type ColorPreset } from "../constants/product.constants";
import { useSaveDropdownOption } from "../hooks/useDropdownOptions";

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
  label = "Colors",
  value = [],
  onChange,
  additionalColors = [],
  error,
  className,
}: ColorMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    const seen = new Set(defaultColorPresets.map((c) => c.name.toLowerCase()));

    [...additionalColors, ...localCustomColors].forEach((colorName) => {
      const trimmed = colorName?.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push({
          name: trimmed,
          hex: getColorHex(trimmed),
        });
      }
    });

    (value || []).forEach((v) => {
      const trimmed = v?.trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push({
          name: trimmed,
          hex: getColorHex(trimmed),
        });
      }
    });

    return list;
  }, [additionalColors, localCustomColors, value, customColorHexMap]);

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

    setLocalCustomColors((prev) => {
      const updated = Array.from(new Set([...prev, trimmed]));
      try {
        localStorage.setItem("orderos_custom_colors", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      saveOptionMutation.mutate({
        field: "color",
        value: trimmed,
        label: trimmed,
      });
    } catch (e) {
      console.error("Failed to save custom color:", e);
    }

    setNewColorName("");
    setHexInput("E11D48");
    setCustomHex("#E11D48");
    setIsAddingCustom(false);
  };

  return (
    <div ref={containerRef} className={cn("space-y-1.5 w-full", className)}>
      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
        {label.replace(/\.+$/, "")}
      </label>

      {/* Selector Box */}
      <div className="relative">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "w-full min-h-[44px] sm:min-h-[48px] px-3.5 py-2 flex flex-wrap items-center gap-1.5 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer text-xs sm:text-sm font-semibold",
            "border border-slate-200 bg-white hover:border-[#E8C16D] hover:bg-slate-50/50 shadow-xs",
            "dark:border-white/[0.08] dark:bg-[#0B0F17] dark:hover:border-[#F5C451]/50 dark:hover:bg-white/[0.04]",
            isOpen && "border-[#E8C16D] ring-2 ring-[#E8C16D]/25 dark:border-[#F5C451] dark:ring-[#F5C451]/20",
            error && "border-rose-500 dark:border-rose-500"
          )}
        >
          {value.length === 0 ? (
            <span className="text-slate-400 dark:text-slate-500">
              Select colors...
            </span>
          ) : (
            value.map((colorName) => {
              const hex = getColorHex(colorName);
              return (
                <span
                  key={colorName}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FFF9EC] text-[#0A0E1A] border border-[#E8C16D]/40 dark:bg-[#1E2638] dark:text-slate-200 dark:border-white/[0.08] shadow-2xs animate-in fade-in-50"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15 dark:border-white/20 shadow-2xs"
                    style={{ backgroundColor: hex }}
                  />
                  <span>{colorName}</span>
                  <button
                    type="button"
                    onClick={(e) => removeColor(colorName, e)}
                    className="hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer ml-0.5 text-slate-400"
                  >
                    <X size={13} />
                  </button>
                </span>
              );
            })
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
          <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Colors Grid */}
            <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 grid grid-cols-2 gap-1">
              {allColors.length === 0 ? (
                <div className="col-span-2 px-3 py-3 text-xs text-slate-400 text-center">
                  No colors available
                </div>
              ) : (
                allColors.map((c) => {
                  const isSelected = value.some(
                    (v) => v.toLowerCase() === c.name.toLowerCase()
                  );
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggleColor(c.name)}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[#FFF9EC] text-[#B88728] font-bold border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30"
                          : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/15 dark:border-white/20 shadow-2xs"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0 ml-1.5 text-[#B88728] dark:text-[#F5C451]" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Custom Color Footer - "Other" */}
            <div className="p-2.5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#0B0F17]/50 space-y-2">
              {isAddingCustom ? (
                <>
                  {/* Row 1: Color Name */}
                  <input
                    ref={addInputRef}
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomColor();
                      }
                    }}
                    placeholder="Color Name (e.g. Mint Green)..."
                    className="w-full h-9 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-white text-[#0A0E1A] placeholder:text-slate-400 outline-none focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-white dark:focus:border-[#F5C451]"
                    autoFocus
                  />

                  {/* Row 2: Hex Code Input + Color Picker Swatch + Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Hex Code Input with Swatch */}
                    <div className="relative flex-1 flex items-center">
                      <span className="absolute left-2.5 text-xs font-mono font-bold text-slate-400 select-none">
                        #
                      </span>
                      <input
                        type="text"
                        value={hexInput}
                        onChange={(e) => handleHexInputChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomColor();
                          }
                        }}
                        placeholder="HEX (e.g. 10B981)"
                        maxLength={7}
                        className="w-full h-9 pl-6 pr-8 text-xs font-mono font-semibold rounded-xl border border-slate-200 bg-white text-[#0A0E1A] placeholder:text-slate-400 outline-none focus:border-[#E8C16D] dark:border-white/[0.1] dark:bg-[#080B11] dark:text-white dark:focus:border-[#F5C451] uppercase"
                      />
                      {/* Color Picker Swatch inside Hex Input */}
                      <label
                        htmlFor="custom-color-picker-input"
                        className="absolute right-1.5 w-6 h-6 rounded-lg border border-black/15 dark:border-white/20 shadow-2xs flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 overflow-hidden"
                        style={{ backgroundColor: customHex }}
                        title="Pick color with palette"
                      >
                        <input
                          id="custom-color-picker-input"
                          type="color"
                          value={customHex}
                          onChange={(e) => {
                            const newHex = e.target.value.toUpperCase();
                            setCustomHex(newHex);
                            setHexInput(newHex.replace(/^#/, ""));
                          }}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCustomColor}
                      disabled={!newColorName.trim() || saveOptionMutation.isPending}
                      className="h-9 px-3 rounded-xl bg-[#0A0E1A] hover:bg-slate-900 text-[#E8C16D] dark:bg-[#F5C451] dark:hover:bg-[#e6b540] dark:text-black text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0"
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
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#B88728] dark:text-[#F5C451] hover:bg-[#FFF9EC] dark:hover:bg-[#F5C451]/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Other</span>
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
