"use client";

import type { ImportType } from "./ProductToolbar";
import type { ProductStats as ProductStatsType } from "../types/product.types";
import type { AsinImportItem } from "../types/asinImport.types";
import type { MyntraImportItem } from "../types/myntraImport.types";

interface Props {
  importType?: ImportType;
  stats?: ProductStatsType;
  totalProducts?: number;
  asinItems?: AsinImportItem[];
  asinTotal?: number;
  myntraItems?: MyntraImportItem[];
  myntraTotal?: number;
  isLoading?: boolean;
}

export default function ProductStats({
  importType = "product",
  stats,
  totalProducts = 0,
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
      const bc = (item.generateBarcode || item.generatedBarcode || "").trim().toLowerCase();
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
    // "product" import / default
    cards = [
      {
        title: "Total Products",
        value: stats?.totalProducts ?? totalProducts,
        badgeText: "Records",
        badgeClass: "border-blue-200/60 bg-blue-50 text-blue-700",
        valueClass: "text-[#0A0E1A]",
      },
      {
        title: "Active Products",
        value: stats?.activeProducts ?? 0,
        badgeText: "Healthy",
        badgeClass: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        valueClass: "text-emerald-600",
      },
      {
        title: "Inactive Products",
        value: stats?.inactiveProducts ?? 0,
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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((item) => (
        <article
          key={item.title}
          className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-[#E8C16D]/40 flex flex-col justify-between"
        >
          <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
            {item.title}
          </p>

          <div className="mt-3 sm:mt-4 flex items-end justify-between gap-2">
            {isLoading ? (
              <div className="h-8 sm:h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <h3 className={`text-2xl sm:text-3xl font-black ${item.valueClass ?? "text-[#0A0E1A]"}`}>
                {Number(item.value ?? 0).toLocaleString()}
              </h3>
            )}
            <span className={`rounded-xl border px-2.5 py-1 text-xs font-bold shrink-0 ${item.badgeClass}`}>
              {item.badgeText}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}