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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map((item) => (
        <article
          key={item.title}
          className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-3 sm:p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 dark:border-white/[0.08] dark:bg-[#0F1626] dark:hover:border-[#F5C451]/50 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
        >
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate" title={item.title}>
            {item.title}
          </p>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
            {isLoading ? (
              <div className="h-8 sm:h-9 w-20 animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
            ) : (
              <h3 className={`text-xl sm:text-2xl lg:text-3xl font-black ${item.valueClass ?? "text-[#0A0E1A]"} dark:text-white truncate`}>
                {Number(item.value ?? 0).toLocaleString()}
              </h3>
            )}
            <span className={`rounded-lg sm:rounded-xl border px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold shrink-0 ${item.badgeClass}`}>
              {item.badgeText}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
