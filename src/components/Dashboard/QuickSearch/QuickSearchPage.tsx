"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Send,
  ChevronDown,
  Check,
  Box,
  Tag,
  Hash,
  FileText,
  Palette,
  Layers,
  Maximize2,
  Scale,
  ShoppingCart,
  Factory,
  Barcode,
  ImageOff,
  Loader2,
  Paperclip,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import ThemeSelectDropdown, { type ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import { productService } from "@/components/Dashboard/Products/ManageProducts/services/product.service";
import { productVariantService } from "@/components/Dashboard/Products/ManageProducts/services/productVariant.service";
import { materialService } from "@/components/Dashboard/Materials/ManageMaterials/services/material.service";
import { materialVariantService } from "@/components/Dashboard/Materials/ManageMaterials/services/materialVariant.service";
import type { Product } from "@/components/Dashboard/Products/ManageProducts/types/product.types";
import type { ProductVariant } from "@/components/Dashboard/Products/ManageProducts/types/productVariant.types";
import type { Material } from "@/components/Dashboard/Materials/ManageMaterials/types/material.types";
import type { MaterialVariant } from "@/components/Dashboard/Materials/ManageMaterials/types/materialVariant.types";
import { getMediaUrl } from "@/lib/utils";

type SearchType = "" | "Product" | "Material" | "Barcode";

interface QuickSearchItem {
  key: string;
  kind: "product" | "material";
  sku: string;
  masterSku: string;
  name: string;
  barcode: string;
  hsnCode: string;
  description: string;
  category: string;
  brand: string;
  color: string;
  size?: string;
  unit: string;
  gsm?: string;
  width?: string;
  purchaseType?: string;
  manufacturingGroup?: string;
  imageUrl: string;
}

const TYPE_OPTIONS: ThemeSelectOption[] = [
  { value: "", label: "All (Product & Material)" },
  { value: "Product", label: "Product" },
  { value: "Material", label: "Material" },
  { value: "Barcode", label: "Barcode" },
];

function extractAttr(
  attrs: Array<{ attributeValue?: string; productAttribute?: { attributeName?: string }; materialAttribute?: { attributeName?: string } }> | undefined,
  pattern: RegExp
): string {
  if (!Array.isArray(attrs)) return "";
  const found = attrs.find((a) => {
    const name = a.productAttribute?.attributeName || a.materialAttribute?.attributeName || "";
    return pattern.test(name);
  });
  return found?.attributeValue || "";
}

export default function QuickSearchPage() {
  const [items, setItems] = useState<QuickSearchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] = useState<SearchType>("Product");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [barcodeQuery, setBarcodeQuery] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownSearchRef = useRef<HTMLInputElement>(null);

  const [activeItem, setActiveItem] = useState<QuickSearchItem | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [prodRes, prodVarRes, matRes, matVarRes] = await Promise.allSettled([
          productService.getAll(),
          productVariantService.getAll(),
          materialService.getAll(),
          materialVariantService.getAll(),
        ]);

        if (!active) return;

        const products: Product[] =
          prodRes.status === "fulfilled" && Array.isArray(prodRes.value?.data)
            ? prodRes.value.data
            : [];
        const productVariants: ProductVariant[] =
          prodVarRes.status === "fulfilled" && Array.isArray(prodVarRes.value?.data)
            ? prodVarRes.value.data
            : [];
        const materials: Material[] =
          matRes.status === "fulfilled" && Array.isArray(matRes.value?.data)
            ? matRes.value.data
            : [];
        const materialVariants: MaterialVariant[] =
          matVarRes.status === "fulfilled" && Array.isArray(matVarRes.value?.data)
            ? matVarRes.value.data
            : [];

        const productMap = new Map<string, Product>();
        products.forEach((p) => productMap.set(p.id, p));

        const materialMap = new Map<string, Material>();
        materials.forEach((m) => materialMap.set(m.id, m));

        const combined: QuickSearchItem[] = [];
        const seenProdSkus = new Set<string>();
        const seenMatSkus = new Set<string>();

        for (const v of productVariants) {
          const parent = productMap.get(v.productId);
          if (!parent) continue;
          const sku = v.variantSku || parent.sku || parent.masterSku;
          seenProdSkus.add(sku.toLowerCase());
          const color =
            extractAttr(v.attributes, /color/i) ||
            (Array.isArray(parent.colors) && parent.colors[0]) ||
            "-";
          const size = extractAttr(v.attributes, /size/i);
          combined.push({
            key: `pv_${v.id}`,
            kind: "product",
            sku,
            masterSku: parent.masterSku || "-",
            name: parent.productName || sku,
            barcode:
              (v as any).barcode ||
              parent.generateBarcode ||
              v.asin ||
              v.myntraSku ||
              v.fsnCode ||
              "",
            hsnCode: parent.hsnCode || "-",
            description: parent.description || "-",
            category: parent.category || "-",
            brand: parent.brand || "-",
            color,
            size: size || undefined,
            unit: parent.unit || "-",
            imageUrl:
              v.imgfileurl ||
              v.imageUrl ||
              parent.imgfileurl ||
              parent.imageUrl ||
              "",
          });
        }

        for (const p of products) {
          const sku = p.sku || p.masterSku;
          if (!sku || seenProdSkus.has(sku.toLowerCase())) continue;
          combined.push({
            key: `p_${p.id}`,
            kind: "product",
            sku,
            masterSku: p.masterSku || "-",
            name: p.productName || sku,
            barcode: p.generateBarcode || p.asin || p.myntraSku || p.fsnCode || "",
            hsnCode: p.hsnCode || "-",
            description: p.description || "-",
            category: p.category || "-",
            brand: p.brand || "-",
            color: (Array.isArray(p.colors) && p.colors[0]) || "-",
            unit: p.unit || "-",
            imageUrl: p.imgfileurl || p.imageUrl || "",
          });
        }

        for (const mv of materialVariants) {
          const parent = materialMap.get(mv.materialId);
          if (!parent) continue;
          const sku = mv.variantSku || parent.sku || parent.masterSku;
          seenMatSkus.add(sku.toLowerCase());
          const color =
            extractAttr(mv.attributes, /color/i) ||
            (Array.isArray(parent.colors) && parent.colors[0]) ||
            "-";
          combined.push({
            key: `mv_${mv.id}`,
            kind: "material",
            sku,
            masterSku: parent.masterSku || "-",
            name: parent.materialName || sku,
            barcode: (mv as any).barcode || parent.generateBarcode || mv.asin || "",
            hsnCode: parent.hsnCode || "-",
            description: parent.description || "-",
            category: parent.category || "-",
            brand: parent.brand || "-",
            color,
            gsm: parent.gsm != null ? String(parent.gsm) : "-",
            width: parent.width != null ? String(parent.width) : "-",
            unit: parent.unit || "-",
            purchaseType: parent.purchaseType || "-",
            manufacturingGroup: parent.manufacturingGroup || "-",
            imageUrl:
              mv.imgfileurl ||
              mv.imageUrl ||
              parent.imgfileurl ||
              parent.imageUrl ||
              "",
          });
        }

        for (const m of materials) {
          const sku = m.sku || m.masterSku;
          if (!sku || seenMatSkus.has(sku.toLowerCase())) continue;
          combined.push({
            key: `m_${m.id}`,
            kind: "material",
            sku,
            masterSku: m.masterSku || "-",
            name: m.materialName || sku,
            barcode: m.generateBarcode || m.asin || "",
            hsnCode: m.hsnCode || "-",
            description: m.description || "-",
            category: m.category || "-",
            brand: m.brand || "-",
            color: (Array.isArray(m.colors) && m.colors[0]) || "-",
            gsm: m.gsm != null ? String(m.gsm) : "-",
            width: m.width != null ? String(m.width) : "-",
            unit: m.unit || "-",
            purchaseType: m.purchaseType || "-",
            manufacturingGroup: m.manufacturingGroup || "-",
            imageUrl: m.imgfileurl || m.imageUrl || "",
          });
        }

        setItems(combined);

        const firstProduct = combined.find((i) => i.kind === "product") || combined[0] || null;
        if (firstProduct) {
          setSelectedKey(firstProduct.key);
          setActiveItem(firstProduct);
        }
      } catch (err) {
        console.error("Failed to load quick search data:", err);
        toast.error("Failed to load products and materials.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Load gallery images when activeItem changes
  useEffect(() => {
    if (!activeItem) {
      setGalleryUrls([]);
      setSelectedImageIdx(0);
      return;
    }
    const baseImg = activeItem.imageUrl ? getMediaUrl(activeItem.imageUrl) : "";
    setGalleryUrls(baseImg ? [baseImg] : []);
    setSelectedImageIdx(0);

    if (!activeItem.masterSku || activeItem.masterSku === "-") return;

    let active = true;
    productService
      .getProductImages(activeItem.masterSku)
      .then((res) => {
        if (!active || !res) return;
        const galleryList: string[] = [];

        if (res.gallery && typeof res.gallery === "object") {
          const colorKey = activeItem.color?.toLowerCase();
          const matchingEntries = Object.entries(res.gallery).filter(([c]) =>
            colorKey && colorKey !== "-" ? c.toLowerCase() === colorKey : true
          );
          const sourceEntries =
            matchingEntries.length > 0 ? matchingEntries : Object.entries(res.gallery);

          for (const [, arr] of sourceEntries) {
            for (const img of arr) {
              const full = getMediaUrl(img.url);
              if (full && !galleryList.includes(full)) {
                galleryList.push(full);
              }
            }
          }
        }

        if (galleryList.length === 0 && res.data && typeof res.data === "object") {
          for (const url of Object.values(res.data)) {
            const full = getMediaUrl(url);
            if (full && !galleryList.includes(full)) {
              galleryList.push(full);
            }
          }
        }

        if (galleryList.length > 0) {
          setGalleryUrls(galleryList);
          setSelectedImageIdx(0);
        }
      })
      .catch(() => {
        // fallback to baseImg already set
      });

    return () => {
      active = false;
    };
  }, [activeItem]);

  const handleBrokenImage = (brokenUrl: string) => {
    setGalleryUrls((prev) => {
      const next = prev.filter((u) => u !== brokenUrl);
      setSelectedImageIdx((idx) => (idx >= next.length ? 0 : idx));
      return next;
    });
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
      setTimeout(() => dropdownSearchRef.current?.focus(), 0);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  const typeFilteredItems = useMemo(() => {
    if (searchType === "Product") return items.filter((i) => i.kind === "product");
    if (searchType === "Material") return items.filter((i) => i.kind === "material");
    if (searchType === "Barcode") {
      const q = barcodeQuery.trim().toLowerCase();
      if (!q) return items;
      return items.filter(
        (i) =>
          i.barcode.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.masterSku.toLowerCase().includes(q)
      );
    }
    return items;
  }, [items, searchType, barcodeQuery]);

  const dropdownList = useMemo(() => {
    const q = dropdownSearch.trim().toLowerCase();
    if (!q) return typeFilteredItems;
    return typeFilteredItems.filter(
      (i) =>
        i.sku.toLowerCase().includes(q) ||
        i.masterSku.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.barcode.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q)
    );
  }, [typeFilteredItems, dropdownSearch]);

  const selectedOption = useMemo(
    () => items.find((i) => i.key === selectedKey) || null,
    [items, selectedKey]
  );

  const handleTypeChange = (val: string) => {
    const nextType = val as SearchType;
    setSearchType(nextType);
    setDropdownSearch("");
    setBarcodeQuery("");

    const matching =
      nextType === "Product"
        ? items.filter((i) => i.kind === "product")
        : nextType === "Material"
        ? items.filter((i) => i.kind === "material")
        : items;

    if (matching.length > 0 && !matching.some((m) => m.key === selectedKey)) {
      setSelectedKey(matching[0].key);
      setActiveItem(matching[0]);
    }
  };

  const handleFetch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchType === "Barcode" && barcodeQuery.trim()) {
      const q = barcodeQuery.trim().toLowerCase();
      const exact = items.find(
        (i) => i.barcode.toLowerCase() === q || i.sku.toLowerCase() === q
      );
      const partial =
        exact ||
        items.find(
          (i) => i.barcode.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
        );
      if (partial) {
        setSelectedKey(partial.key);
        setActiveItem(partial);
        return;
      }
      toast.error("No product or material found for this barcode.");
      return;
    }

    if (selectedOption) {
      setActiveItem(selectedOption);
    } else if (typeFilteredItems.length > 0) {
      setSelectedKey(typeFilteredItems[0].key);
      setActiveItem(typeFilteredItems[0]);
    } else {
      toast.error("No matching product or material found.");
    }
  };

  const infoCardClass =
    "rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-sm";
  const tileClass =
    "flex items-center gap-3 rounded-2xl border border-[#E7E0D2]/80 dark:border-white/[0.08] bg-[#FEFAEE]/45 dark:bg-[#080B11]/70 px-3.5 py-2.5";
  const tileIconClass =
    "h-8 w-8 rounded-xl bg-[#FEFAEE] dark:bg-[#131B2E] border border-[#F5E6BE] dark:border-white/[0.08] flex items-center justify-center text-[#B88728] dark:text-[#E8C16D] shrink-0";
  const tileLabelClass =
    "text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";
  const tileValueClass =
    "text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-white break-words";

  const currentImg = galleryUrls[selectedImageIdx] || "";

  return (
    <DashboardLayout title="Quick Search">
      <div className="flex flex-col gap-4 font-sans max-w-[1600px] mx-auto min-h-0">
        {/* Header Card */}
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 lg:p-7 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-black font-heading tracking-tight text-[#0A0E1A] dark:text-white">
              Quick Search
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Quickly inspect product, material, or barcode details.
            </p>
          </div>
        </section>

        {/* Filter & Fetch Bar */}
        <form
          onSubmit={handleFetch}
          className="flex flex-col lg:flex-row lg:items-center gap-3 px-4 py-3.5 rounded-2xl bg-white dark:bg-[#0F1626] border border-[#E7E0D2] dark:border-white/[0.08] shadow-sm"
        >
          {/* Type */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto">
            <span className="text-xs font-bold text-[#0A0E1A] dark:text-slate-200 whitespace-nowrap">
              Type
            </span>
            <div className="w-full sm:w-[190px]">
              <ThemeSelectDropdown
                value={searchType}
                onChange={handleTypeChange}
                options={TYPE_OPTIONS}
                placeholder="Select Type..."
                className="w-full"
                buttonClassName="w-full !h-10 !py-0 text-xs rounded-2xl"
                menuClassName="w-full min-w-[190px]"
              />
            </div>
          </div>

          {/* Barcode Input (shown when Barcode type is selected) */}
          {searchType === "Barcode" && (
            <div className="flex items-center gap-2.5 w-full lg:w-[250px]">
              <span className="text-xs font-bold text-[#0A0E1A] dark:text-slate-200 whitespace-nowrap">
                Barcode
              </span>
              <div className="relative flex-1">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451] pointer-events-none" />
                <input
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  placeholder="Scan or enter barcode..."
                  className="w-full h-10 pl-9 pr-3.5 text-xs font-medium rounded-2xl bg-white dark:bg-[#080B11] border border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30"
                />
              </div>
            </div>
          )}

          {/* Product / Material Searchable Dropdown */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xs font-bold text-[#0A0E1A] dark:text-slate-200 whitespace-nowrap">
              Product / Material
            </span>
            <div ref={dropdownRef} className="relative flex-1 min-w-0 max-w-md">
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className={`w-full h-10 inline-flex items-center justify-between gap-2 rounded-2xl border px-3.5 text-xs font-bold transition-all shadow-xs outline-none bg-white dark:bg-[#131622] border-[#E7E0D2] dark:border-white/[0.08] ${
                  selectedOption
                    ? "text-[#0A0E1A] dark:text-white"
                    : "text-slate-400 dark:text-slate-500"
                } hover:border-[#E8C16D] cursor-pointer`}
              >
                <span className="truncate text-left">
                  {selectedOption ? selectedOption.sku : "Select Product / Material..."}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-[#B88728] dark:text-[#F5C451] transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-[#E7E0D2] bg-white dark:border-white/[0.08] dark:bg-[#0F1626] p-2 shadow-xl dark:shadow-black/50">
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#B88728] dark:text-[#F5C451] pointer-events-none" />
                    <input
                      ref={dropdownSearchRef}
                      type="text"
                      value={dropdownSearch}
                      onChange={(e) => setDropdownSearch(e.target.value)}
                      placeholder="Search SKU, name, or barcode..."
                      className="w-full h-9 pl-8 pr-3 text-xs font-medium rounded-xl bg-[#F7F5F0]/80 dark:bg-[#080B11] border border-[#E7E0D2] dark:border-white/[0.08] text-[#0A0E1A] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#E8C16D]"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 pr-1">
                    {dropdownList.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No matching items found.
                      </div>
                    ) : (
                      dropdownList.slice(0, 120).map((item) => {
                        const isSelected = item.key === selectedKey;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setSelectedKey(item.key);
                              setActiveItem(item);
                              setDropdownOpen(false);
                              setDropdownSearch("");
                            }}
                            className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#E8C16D] text-[#0A0E1A] dark:bg-[#F5C451] dark:text-[#080B11]"
                                : "text-[#0A0E1A] dark:text-slate-200 hover:bg-[#FFF9EC] dark:hover:bg-[#131B2E]"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate">{item.sku}</div>
                              <div
                                className={`text-[10px] truncate ${
                                  isSelected
                                    ? "text-[#0A0E1A]/75"
                                    : "text-slate-400 dark:text-slate-400"
                                }`}
                              >
                                {[item.name, item.barcode ? `Barcode: ${item.barcode}` : ""]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isSelected
                                    ? "bg-[#0A0E1A]/15 text-[#0A0E1A]"
                                    : item.kind === "product"
                                    ? "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                                    : "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
                                }`}
                              >
                                {item.kind}
                              </span>
                              {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fetch Button */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.98] px-5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all cursor-pointer shadow-sm shrink-0 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Fetch</span>
          </button>
        </form>

        {/* Content Area */}
        {loading ? (
          <div className={`${infoCardClass} py-20 flex items-center justify-center`}>
            <div className="inline-flex items-center gap-2 text-sm text-[#8B7D65] dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#B88728] dark:text-[#E8C16D]" />
              <span>Loading products and materials...</span>
            </div>
          </div>
        ) : !activeItem ? (
          <div className={`${infoCardClass} py-16 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400`}>
            Select a product, material, or barcode above and click Fetch to view details.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT: Image Preview & Thumbnails */}
            <div className={`lg:col-span-4 xl:col-span-3 ${infoCardClass}`}>
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-[#F7F5F0] dark:bg-[#080B11] border border-[#E7E0D2] dark:border-white/[0.08] flex items-center justify-center">
                {currentImg ? (
                  <img
                    src={currentImg}
                    alt={activeItem.sku}
                    onError={() => handleBrokenImage(currentImg)}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <ImageOff className="h-8 w-8" />
                    <span className="text-xs font-medium">No Image</span>
                  </div>
                )}
              </div>

              {galleryUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {galleryUrls.map((url, idx) => (
                    <button
                      key={`${url}_${idx}`}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`h-14 w-14 rounded-xl overflow-hidden border transition-all cursor-pointer bg-[#F7F5F0] dark:bg-[#080B11] ${
                        selectedImageIdx === idx
                          ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                          : "border-[#E7E0D2] dark:border-white/[0.08] opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        onError={() => handleBrokenImage(url)}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Information, Classification & Specifications */}
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Product / Material Information Card */}
                <div className={`${infoCardClass} space-y-3`}>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0A0E1A] dark:text-white">
                    <Box className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                    <span>
                      {activeItem.kind === "product"
                        ? "Product Information"
                        : "Material Information"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className={tileClass}>
                      <div className={tileIconClass}>
                        <Hash className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={tileLabelClass}>
                          {activeItem.kind === "product" ? "PRODUCT SKU" : "MATERIAL SKU"}
                        </div>
                        <div className={tileValueClass}>{activeItem.sku}</div>
                      </div>
                    </div>

                    <div className={tileClass}>
                      <div className={tileIconClass}>
                        <Hash className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={tileLabelClass}>
                          {activeItem.kind === "product"
                            ? "MASTER PRODUCT SKU"
                            : "MASTER MATERIAL SKU"}
                        </div>
                        <div className={tileValueClass}>{activeItem.masterSku}</div>
                      </div>
                    </div>

                    <div className={tileClass}>
                      <div className={tileIconClass}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={tileLabelClass}>HSN CODE</div>
                        <div className={tileValueClass}>{activeItem.hsnCode}</div>
                      </div>
                    </div>

                    {activeItem.barcode && (
                      <div className={tileClass}>
                        <div className={tileIconClass}>
                          <Barcode className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={tileLabelClass}>BARCODE</div>
                          <div className={tileValueClass}>{activeItem.barcode}</div>
                        </div>
                      </div>
                    )}

                    <div className={tileClass}>
                      <div className={tileIconClass}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={tileLabelClass}>DESCRIPTION</div>
                        <div className={tileValueClass}>{activeItem.description}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Classification Card */}
                <div className={`${infoCardClass} space-y-3`}>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#0A0E1A] dark:text-white">
                    <Tag className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                    <span>Classification</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className={tileClass}>
                      <div className={tileIconClass}>
                        <Tag className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={tileLabelClass}>CATEGORY</div>
                        <div className={tileValueClass}>{activeItem.category}</div>
                      </div>
                    </div>

                    <div className={tileClass}>
                      <div className={tileIconClass}>
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={tileLabelClass}>BRAND</div>
                        <div className={tileValueClass}>{activeItem.brand}</div>
                      </div>
                    </div>

                    {activeItem.kind === "material" && (
                      <>
                        <div className={tileClass}>
                          <div className={tileIconClass}>
                            <ShoppingCart className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={tileLabelClass}>PURCHASE TYPE</div>
                            <div className={tileValueClass}>
                              {activeItem.purchaseType || "-"}
                            </div>
                          </div>
                        </div>

                        <div className={tileClass}>
                          <div className={tileIconClass}>
                            <Factory className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={tileLabelClass}>MFG. GROUP</div>
                            <div className={tileValueClass}>
                              {activeItem.manufacturingGroup || "-"}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Specifications Card */}
              <div className={`${infoCardClass} space-y-3`}>
                <div className="flex items-center gap-2 text-sm font-bold text-[#0A0E1A] dark:text-white">
                  <Paperclip className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className={tileClass}>
                    <div className={tileIconClass}>
                      <Palette className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={tileLabelClass}>COLOR</div>
                      <div className={tileValueClass}>{activeItem.color}</div>
                    </div>
                  </div>

                  {activeItem.kind === "product" && activeItem.size && (
                    <div className={tileClass}>
                      <div className={tileIconClass}>
                        <Maximize2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={tileLabelClass}>SIZE</div>
                        <div className={tileValueClass}>{activeItem.size}</div>
                      </div>
                    </div>
                  )}

                  {activeItem.kind === "material" && (
                    <>
                      <div className={tileClass}>
                        <div className={tileIconClass}>
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={tileLabelClass}>GSM</div>
                          <div className={tileValueClass}>{activeItem.gsm || "-"}</div>
                        </div>
                      </div>

                      <div className={tileClass}>
                        <div className={tileIconClass}>
                          <Maximize2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={tileLabelClass}>WIDTH</div>
                          <div className={tileValueClass}>{activeItem.width || "-"}</div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className={tileClass}>
                    <div className={tileIconClass}>
                      <Scale className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={tileLabelClass}>UNIT</div>
                      <div className={tileValueClass}>{activeItem.unit}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
