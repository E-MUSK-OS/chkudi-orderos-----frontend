"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  Folder,
  FileText,
  ShoppingBag,
  Package,
  Barcode,
  Video,
  FileSpreadsheet,
  Store,
  Layers,
  Users,
  ScanBarcode,
  UserRound,
  Warehouse,
  Wallet,
  Bell,
} from "lucide-react";
import type { ClientConfigTreeNode as TreeNodeType } from "../types/clientConfiguration.types";

interface Props {
  node: TreeNodeType;
  onToggle: (id: string, checked: boolean) => void;
  depth?: number;
  searchQuery?: string;
}

export default function ClientConfigTreeNode({
  node,
  onToggle,
  depth = 0,
  searchQuery = "",
}: Props) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id, !node.checked);
  };

  // Helper icon selector based on label / id
  const getLeadingIcon = () => {
    const l = node.label.toLowerCase();
    if (l.includes("vms")) return <Video className="w-3.5 h-3.5 text-indigo-500 shrink-0" />;
    if (l.includes("scan") || l.includes("barcode"))
      return <ScanBarcode className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    if (l.includes("order") || l.includes("invoice") || l.includes("challan") || l.includes("po"))
      return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    if (l.includes("inventory") || l.includes("product"))
      return <Package className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    if (l.includes("material")) return <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
    if (l.includes("company") || l.includes("store"))
      return <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    if (l.includes("user")) return <Users className="w-3.5 h-3.5 text-cyan-500 shrink-0" />;
    if (l.includes("profile")) return <UserRound className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    if (l.includes("warehouse")) return <Warehouse className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    if (l.includes("wallet")) return <Wallet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    if (l.includes("notification")) return <Bell className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
    if (hasChildren) return <Folder className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D] shrink-0" />;
    return <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  // Check if this node or any child matches search query
  const matchesSearch =
    !searchQuery ||
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (node.path && node.path.toLowerCase().includes(searchQuery.toLowerCase()));

  // Auto-expand node when search query is active
  const isNodeOpen = searchQuery ? true : isExpanded;

  return (
    <div className={`select-none ${!matchesSearch && !hasChildren ? "opacity-40" : ""}`}>
      <div
        className={`group flex items-center justify-between py-2 px-2.5 rounded-xl transition-all cursor-pointer ${
          matchesSearch && searchQuery
            ? "bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30"
            : depth === 0
            ? "hover:bg-slate-100/70 dark:hover:bg-white/[0.04]"
            : "hover:bg-slate-100/60 dark:hover:bg-white/[0.03]"
        }`}
        style={{ paddingLeft: `${Math.max(10, depth * 18 + 10)}px` }}
        onClick={() => hasChildren && setIsExpanded(!isNodeOpen)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Custom Checkbox */}
          <button
            type="button"
            onClick={handleCheckboxClick}
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

          {/* Leading Icon */}
          {getLeadingIcon()}

          {/* Label */}
          <span
            className={`text-xs font-semibold truncate transition-colors ${
              node.checked || node.indeterminate
                ? "text-[#0A0E1A] dark:text-slate-100"
                : "text-slate-400 dark:text-slate-500 line-through"
            }`}
          >
            {node.label}
          </span>
        </div>

        {/* Right side: Check mark indicator and Expand/Collapse chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          {node.checked && (
            <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 stroke-[2.5]" />
          )}

          {hasChildren && (
            <button
              type="button"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isNodeOpen);
              }}
            >
              {isNodeOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Nested Children */}
      {hasChildren && isNodeOpen && (
        <div className="flex flex-col gap-0.5">
          {node.children!.map((child) => (
            <ClientConfigTreeNode
              key={child.id}
              node={child}
              onToggle={onToggle}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
