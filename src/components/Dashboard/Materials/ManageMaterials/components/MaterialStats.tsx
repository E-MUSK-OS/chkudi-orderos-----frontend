"use client";

import type { ImportType } from "./MaterialToolbar";
import type { MaterialStats as MaterialStatsType } from "../types/material.types";
import type { AsinImportItem } from "../types/asinImport.types";
import type { MyntraImportItem } from "../types/myntraImport.types";

interface Props {
  importType?: ImportType;
  stats?: MaterialStatsType;
  totalMaterials?: number;
  asinItems?: AsinImportItem[];
  asinTotal?: number;
  myntraItems?: MyntraImportItem[];
  myntraTotal?: number;
  isLoading?: boolean;
}

export default function MaterialStats({
  importType = "material",
  stats,
  totalMaterials = 0,
  asinItems = [],
  asinTotal,
  myntraItems = [],
  myntraTotal,
  isLoading = false,
}: Props) {
  let cards: {
    title: string;
    value: number;
    badgeText: string;
    badgeClass: string;
    valueClass?: string;
  }[] = [];

  if (importType === "asin") {
    const totalAsins = asinTotal ?? asinItems.length;
    const mappedSkus = asinItems.filter((item) => Boolean(item.sku && item.sku.trim())).length;
    const withBarcode = asinItems.filter((item) => {
      const bc = (item.generateBarcode ?? "").trim().toLowerCase();
      return bc === "no" || bc === "n";
    }).length;
    const withRack = asinItems.filter((item) =>
      Boolean(item.rackAddress && item.rackAddress.trim())
    ).length;

    cards = [
      {
        title: "Total ASINs",
        value: totalAsins,
        badgeText: "ASINs",
        badgeClass: "border-blue-200/60 bg-blue-50 text-blue-700",
        valueClass: "text-[#0A0E1A]",
      },
      {
        title: "Mapped SKUs",
        value: mappedSkus,
        badgeText: "Mapped",
        badgeClass: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        valueClass: "text-emerald-600",
      },
      {
        title: "With Barcode",
        value: withBarcode,
        badgeText: "Barcode",
        badgeClass: "border-amber-200/60 bg-[#FFF9EC] text-[#B88728]",
        valueClass: "text-amber-600",
      },
      {
        title: "With Rack Location",
        value: withRack,
        badgeText: "Racks",
        badgeClass: "border-purple-200/60 bg-purple-50 text-purple-700",
        valueClass: "text-purple-600",
      },
    ];
  } else if (importType === "myntra") {
    const totalMyntra = myntraTotal ?? myntraItems.length;
    const mappedSellerSkus = myntraItems.filter((item) =>
      Boolean(item.sellerSku && item.sellerSku.trim())
    ).length;
    const withBarcode = myntraItems.filter((item) => {
      const bc = (item.generateBarcode ?? "").trim().toLowerCase();
      return bc === "no" || bc === "n";
    }).length;
    const withRack = myntraItems.filter((item) =>
      Boolean(item.rackAddress && item.rackAddress.trim())
    ).length;

    cards = [
      {
        title: "Total Myntra SKUs",
        value: totalMyntra,
        badgeText: "SKUs",
        badgeClass: "border-blue-200/60 bg-blue-50 text-blue-700",
        valueClass: "text-[#0A0E1A]",
      },
      {
        title: "Mapped Seller SKUs",
        value: mappedSellerSkus,
        badgeText: "Mapped",
        badgeClass: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        valueClass: "text-emerald-600",
      },
      {
        title: "With Barcode",
        value: withBarcode,
        badgeText: "Barcode",
        badgeClass: "border-amber-200/60 bg-[#FFF9EC] text-[#B88728]",
        valueClass: "text-amber-600",
      },
      {
        title: "With Rack Location",
        value: withRack,
        badgeText: "Racks",
        badgeClass: "border-purple-200/60 bg-purple-50 text-purple-700",
        valueClass: "text-purple-600",
      },
    ];
  } else {
    cards = [
      {
        title: "Total Materials",
        value: stats?.totalMaterials ?? totalMaterials,
        badgeText: "Records",
        badgeClass: "border-blue-200/60 bg-blue-50 text-blue-700",
        valueClass: "text-[#0A0E1A]",
      },
      {
        title: "Active Materials",
        value: stats?.activeMaterials ?? 0,
        badgeText: "Healthy",
        badgeClass: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        valueClass: "text-emerald-600",
      },
      {
        title: "Inactive Materials",
        value: stats?.inactiveMaterials ?? 0,
        badgeText: "Inactive",
        badgeClass: "border-rose-200/60 bg-rose-50 text-rose-700",
        valueClass: "text-rose-600",
      },
      {
        title: "Total Brands",
        value: stats?.totalBrands ?? 0,
        badgeText: "Brands",
        badgeClass: "border-amber-200/60 bg-[#FFF9EC] text-[#B88728]",
        valueClass: "text-[#0A0E1A]",
      },
    ];
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0B0F17]/60 p-3.5 sm:p-5 flex flex-col justify-between gap-3 shadow-2xs hover:border-[#E8C16D] dark:hover:border-[#F5C451]/40 transition-colors"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate">
              {card.title}
            </span>
            <span
              className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${card.badgeClass} dark:bg-transparent dark:border-white/10 dark:text-slate-300 shrink-0`}
            >
              {card.badgeText}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl sm:text-3xl font-black tracking-tight dark:text-white ${card.valueClass || "text-[#0A0E1A]"}`}
            >
              {isLoading ? (
                <span className="inline-block h-7 w-14 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
              ) : (
                card.value.toLocaleString()
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

