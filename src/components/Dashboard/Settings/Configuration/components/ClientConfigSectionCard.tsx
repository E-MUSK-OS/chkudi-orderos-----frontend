"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  LayoutGrid,
  Package,
  ShoppingBag,
  ShoppingCart,
  FileSpreadsheet,
  ArrowLeftRight,
  Video,
  Settings,
  BarChart3,
  Sliders,
} from "lucide-react";
import type { ClientConfigTreeNode as TreeNodeType } from "../types/clientConfiguration.types";
import ClientConfigTreeNode from "./ClientConfigTreeNode";

interface Props {
  node: TreeNodeType;
  onToggle: (id: string, checked: boolean) => void;
  searchQuery?: string;
}

export default function ClientConfigSectionCard({
  node,
  onToggle,
  searchQuery = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleHeaderCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id, !node.checked);
  };

  // Helper icon selector for top-level section
  const getSectionIcon = () => {
    const l = node.label.toLowerCase();
    if (l.includes("dashboard")) return <LayoutGrid className="w-4 h-4 text-emerald-500" />;
    if (l.includes("vms")) return <Video className="w-4 h-4 text-indigo-500" />;
    if (l.includes("product") && !l.includes("analytics"))
      return <Package className="w-4 h-4 text-amber-500" />;
    if (l.includes("order process")) return <ShoppingCart className="w-4 h-4 text-blue-500" />;
    if (l.includes("analytics")) return <BarChart3 className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />;
    if (l.includes("transaction")) return <ArrowLeftRight className="w-4 h-4 text-cyan-500" />;
    if (l.includes("offline sales")) return <FileSpreadsheet className="w-4 h-4 text-purple-500" />;
    if (l.includes("purchase")) return <ShoppingBag className="w-4 h-4 text-rose-500" />;
    if (l.includes("settings")) return <Settings className="w-4 h-4 text-slate-500" />;
    return <Sliders className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />;
  };

  // Count routes inside this section
  let granted = 0;
  let total = 0;
  const countLeaves = (n: TreeNodeType) => {
    if (!n.children || n.children.length === 0) {
      total++;
      if (n.checked) granted++;
    } else {
      n.children.forEach(countLeaves);
    }
  };
  countLeaves(node);

  // Check if this section or any of its descendants match the search query
  const hasMatchingDescendant = (n: TreeNodeType): boolean => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (n.label.toLowerCase().includes(q)) return true;
    if (n.path && n.path.toLowerCase().includes(q)) return true;
    if (n.children && n.children.length > 0) {
      return n.children.some(hasMatchingDescendant);
    }
    return false;
  };

  const matchesSearch = hasMatchingDescendant(node);
  if (!matchesSearch && searchQuery) {
    return null;
  }

  // Auto-expand section when search query is active
  const isSectionOpen = searchQuery ? true : isOpen;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm overflow-hidden mb-4 transition-all hover:border-[#E8C16D]/30">
      {/* Section Header */}
      <div
        className="flex items-center justify-between px-3.5 sm:px-4 py-3 bg-[#FDFBF7] dark:bg-white/[0.02] border-b border-[#E7E0D2]/70 dark:border-white/[0.06] cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/[0.04] transition-colors"
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Main Section Checkbox */}
          <button
            type="button"
            onClick={handleHeaderCheckbox}
            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              node.checked
                ? "bg-[#E8C16D] border-[#B88728]/40 dark:border-[#E8C16D] text-[#0A0E1A]"
                : node.indeterminate
                ? "bg-[#FFF9EC] dark:bg-[#1A160E] border-[#E8C16D] text-[#B88728] dark:text-[#E8C16D]"
                : "border-slate-300 dark:border-white/10 bg-white dark:bg-[#080B11] hover:border-[#E8C16D]/60"
            }`}
          >
            {node.checked && <Check className="w-3 h-3 stroke-[3]" />}
            {!node.checked && node.indeterminate && <Minus className="w-3 h-3 stroke-[3]" />}
          </button>

          {/* Section Icon Box */}
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 dark:bg-white/[0.05] shrink-0 border border-slate-200/60 dark:border-white/[0.08]">
            {getSectionIcon()}
          </div>

          {/* Section Title */}
          <span
            className={`text-xs sm:text-sm font-extrabold truncate transition-colors ${
              node.checked || node.indeterminate
                ? "text-[#0A0E1A] dark:text-white"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {node.label}
          </span>
        </div>

        {/* Section Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Route Count Pill */}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
              granted === total && total > 0
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : granted > 0
                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                : "bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/[0.08]"
            }`}
          >
            {granted}/{total} {total === 1 ? "route" : "routes"}
          </span>

          {node.checked && (
            <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 stroke-[2.5]" />
          )}
          {!node.checked && node.indeterminate && (
            <Minus className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D] stroke-[2.5]" />
          )}

          {hasChildren && (
            <button
              type="button"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              {isSectionOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Children Nodes */}
      {hasChildren && isSectionOpen && (
        <div className="p-2 sm:p-2.5 flex flex-col gap-0.5">
          {node.children!.map((child) => (
            <ClientConfigTreeNode
              key={child.id}
              node={child}
              onToggle={onToggle}
              depth={0}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
