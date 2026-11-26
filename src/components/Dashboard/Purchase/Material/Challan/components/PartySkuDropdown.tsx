"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { PartySkuOption } from "../types/materialChallan.types";

interface PartySkuDropdownProps {
  value: string;
  options: PartySkuOption[];
  onSelectOption: (opt: PartySkuOption) => void;
  onSelectCustom: (partySkuText: string) => void;
}

export default function PartySkuDropdown({
  value,
  options,
  onSelectOption,
  onSelectCustom,
}: PartySkuDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.partySku.toLowerCase().includes(q) ||
        (o.sku || "").toLowerCase().includes(q)
    );
  }, [options, query]);

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

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    (o) => o.partySku.toLowerCase() === trimmedQuery.toLowerCase()
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-xs font-medium text-left flex items-center justify-between gap-2 text-[#0A0E1A] dark:text-white hover:border-[#E8C16D] transition-colors cursor-pointer"
      >
        <span className={`truncate ${value ? "" : "text-slate-400"}`}>
          {value || "Select or type..."}
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
            className="rounded-xl border border-[#E7E0D2] dark:border-white/[0.12] bg-white dark:bg-[#0F1626] shadow-2xl p-2 space-y-1.5"
          >
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && trimmedQuery) {
                    e.preventDefault();
                    const exact = options.find(
                      (o) => o.partySku.toLowerCase() === trimmedQuery.toLowerCase()
                    );
                    if (exact) {
                      onSelectOption(exact);
                    } else {
                      onSelectCustom(trimmedQuery);
                    }
                    setOpen(false);
                    setQuery("");
                  }
                }}
                placeholder="Search or type..."
                className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#080B11] text-xs text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
              />
            </div>

            <div className="max-h-52 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-white/[0.04]">
              {filtered.map((opt) => {
                const isSelected = value.toLowerCase() === opt.partySku.toLowerCase();
                return (
                  <button
                    key={opt.partySku}
                    type="button"
                    onClick={() => {
                      onSelectOption(opt);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full px-2.5 py-2 text-left text-xs flex items-center justify-between gap-2 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-white/[0.04] text-[#0A0E1A] dark:text-slate-200"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{opt.partySku}</div>
                      {opt.sku && opt.sku !== opt.partySku && (
                        <div className="text-[10px] text-slate-400 truncate">
                          Material: {opt.sku}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}

              {trimmedQuery && !hasExactMatch && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectCustom(trimmedQuery);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full px-2.5 py-2 text-left text-xs text-[#B88728] dark:text-[#E8C16D] font-semibold hover:bg-[#FFF9EC] dark:hover:bg-[#1A160E] rounded-lg cursor-pointer"
                >
                  Use &ldquo;{trimmedQuery}&rdquo;
                </button>
              )}

              {filtered.length === 0 && !trimmedQuery && (
                <div className="py-4 text-center text-[11px] text-slate-400">
                  No Party SKU history. Type to add.
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
