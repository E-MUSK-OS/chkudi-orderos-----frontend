"use client";

import {
  Package,
  CheckCircle2,
  XCircle,
  BadgeInfo,
  Barcode,
  MapPin,
} from "lucide-react";

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
    icon: any;
    iconBg: string;
    iconColor: string;
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
        icon: Package,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "Mapped SKUs",
        value: mappedSkus,
        icon: CheckCircle2,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "With Barcode",
        value: withBarcode,
        icon: Barcode,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "With Rack Location",
        value: withRack,
        icon: MapPin,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
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
        icon: Package,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "Mapped Seller SKUs",
        value: mappedSellerSkus,
        icon: CheckCircle2,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "With Barcode",
        value: withBarcode,
        icon: Barcode,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "With Rack Location",
        value: withRack,
        icon: MapPin,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
    ];
  } else {
    // "product" import / default
    cards = [
      {
        title: "Total Products",
        value: stats?.totalProducts ?? totalProducts,
        icon: Package,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "Active Products",
        value: stats?.activeProducts ?? 0,
        icon: CheckCircle2,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "Inactive Products",
        value: stats?.inactiveProducts ?? 0,
        icon: XCircle,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
      {
        title: "Total Brands",
        value: stats?.totalBrands ?? 0,
        icon: BadgeInfo,
        iconBg: "bg-[#E8C16D]",
        iconColor: "text-[#0A0E1A]",
      },
    ];
  }

  return (
    <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
      {cards.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-2xl border border-[#E7EAF0] bg-[#0A0E1A] p-4 sm:p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base font-medium text-[#E8C16D]">
                  {item.title}
                </p>

                {isLoading ? (
                  <div className="mt-2 sm:mt-3 h-8 sm:h-9 w-20 animate-pulse rounded bg-slate-800" />
                ) : (
                  <h3 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold text-white">
                    {Number(item.value ?? 0).toLocaleString()}
                  </h3>
                )}
              </div>

              <div
                className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-md ${item.iconBg}`}
              >
                <Icon size={22} className={`${item.iconColor} sm:hidden`} />
                <Icon size={24} className={`${item.iconColor} hidden sm:block`} />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}