"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { MaterialCatalogOption } from "../types/materialOrder.types";

interface MaterialSkuDropdownProps {
  value: string;
  category: string;
  materials: MaterialCatalogOption[];
  onSelectMaterial: (mat: MaterialCatalogOption) => void;
  onSelectCustom: (skuText: string) => void;
}

export default function MaterialSkuDropdown({
  value,
  category,
  materials,
  onSelectMaterial,
  onSelectCustom,
}: MaterialSkuDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = category.trim().toLowerCase();
    return materials.filter((m) => {
      const catMatch = !cat || (m.category || "").toLowerCase() === cat;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        (m.sku || "").toLowerCase().includes(q) ||
        (m.masterSku || "").toLowerCase().includes(q) ||
        (m.materialName || "").toLowerCase().includes(q)
      );
    });
  }, [materials, category, query]);

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const up = spaceBelow < 240 && rect.top > spaceBelow;
    setPortalStyle({
      position: "fixed",
      zIndex: 9999,
      minWidth: Math.max(rect.width, 230),
      left: rect.left,
      ...(up
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onScrollOrResize = () => updatePos();
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("scroll", onScrollOrResize, { passive: true, capture: true });
    document.addEventListener("mousedown", onOutside);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [open, updatePos]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-8 px-2.5 flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-semibold text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] cursor-pointer"
      >
        <span className={`truncate ${value ? "" : "text-slate-400 font-normal"}`}>
          {value || "Select material..."}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open &&
        portalStyle &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={portalStyle}
            className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-2 shadow-2xl"
          >
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    e.preventDefault();
                    if (filtered.length === 1) {
                      onSelectMaterial(filtered[0]);
                    } else {
                      onSelectCustom(query.trim());
                    }
                    setOpen(false);
                    setQuery("");
                  }
                }}
                placeholder="Search material..."
                className="w-full h-8 pl-8 pr-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#E8C16D]"
              />
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
              {filtered.map((m) => {
                const labelSku = m.sku || m.masterSku || m.materialName;
                const isSelected = labelSku.toLowerCase() === (value || "").toLowerCase();
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectMaterial(m);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-left cursor-pointer ${
                      isSelected
                        ? "bg-[#FFF9EC] text-[#B88728] dark:bg-white/[0.08] dark:text-[#E8C16D]"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <span className="truncate">{m.materialName || labelSku}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}

              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustom(query.trim());
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#B88728] dark:text-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-white/[0.06] text-left cursor-pointer"
                >
                  Use &ldquo;{query.trim()}&rdquo;
                </button>
              )}

              {filtered.length === 0 && !query.trim() && (
                <div className="py-3 px-2 text-center text-xs text-slate-400">
                  No materials in catalog yet. Type SKU &amp; press Enter to add.
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
