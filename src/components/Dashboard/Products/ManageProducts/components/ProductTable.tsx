"use client";

import { Fragment } from "react";
import { ChevronDown, ChevronUp, Package, Layers, Tag, Store } from "lucide-react";

import type { Product } from "../types/product.types";
import ProductStatusBadge from "./ProductStatusBadge";
import ProductActionMenu from "./ProductActionMenu";
import ProductVariantInline from "./ProductVariantInline";
import { getDefaultAttributesForCategory, sortSizes } from "../constants/product.constants";

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onStatusChange: (product: Product) => void;
  expandedProductId: string | null;
  onVariantToggle: (product: Product) => void;
  selectedProductIds?: string[];
  onToggleSelect?: (productId: string) => void;
  onToggleSelectAll?: () => void;
  tableWrapperClassName?: string;
  parentScrollRef?: React.RefObject<HTMLDivElement | null>;
}

const getProductAttributeItems = (product: Product) => {
  const defaultNames = getDefaultAttributesForCategory(product.category);
  const baseAttrs: {
    id?: string;
    attributeName: string;
    attributeValue?: string;
  }[] =
    Array.isArray(product.attributes) && product.attributes.length > 0
      ? [...product.attributes]
      : defaultNames.map((name) => ({ attributeName: name }));

  const allVariantAttrs = (product.variants || []).flatMap(
    (v: any) => v.attributes || []
  );

  // Ensure "Colour" is included if product has colors
  const hasColorAttr = baseAttrs.some((a) =>
    ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim())
  );
  if (!hasColorAttr && (product.colors?.length || defaultNames.includes("Colour"))) {
    baseAttrs.unshift({ attributeName: "Colour" });
  }

  // Ensure "Size" is included if product has sizeList
  const hasSizeAttr = baseAttrs.some((a) =>
    ["size"].includes((a.attributeName || "").toLowerCase().trim())
  );
  if (!hasSizeAttr && (product.sizeList || defaultNames.includes("Size"))) {
    baseAttrs.push({ attributeName: "Size" });
  }

  // Ensure "Gender" is included if product has gender or gender attribute
  const hasGenderAttr = baseAttrs.some((a) =>
    ["gender"].includes((a.attributeName || "").toLowerCase().trim())
  );
  const hasGenderVal = Boolean(
    product.gender ||
      baseAttrs.some((a) => (a.attributeName || "").toLowerCase().trim() === "gender" && a.attributeValue?.trim()) ||
      allVariantAttrs.some((va: any) => (va.productAttribute?.attributeName || "").toLowerCase().trim() === "gender")
  );
  if (!hasGenderAttr && (hasGenderVal || defaultNames.includes("Gender"))) {
    baseAttrs.push({ attributeName: "Gender" });
  }

  // Deduplicate baseAttrs by normalized attributeName
  const seenBase = new Set<string>();
  const uniqueBaseAttrs = baseAttrs.filter((attr) => {
    let lower = (attr.attributeName || "").toLowerCase().trim();
    if (lower === "color") lower = "colour";
    if (!lower || seenBase.has(lower)) return false;
    seenBase.add(lower);
    return true;
  });

  return uniqueBaseAttrs.map((attr) => {
    const attrName = attr.attributeName?.trim() || "";
    const lowerName = attrName.toLowerCase();

    // 1. Gender: prioritize product.gender, then attr.attributeValue, then variant attributes
    if (lowerName === "gender") {
      let g = (product.gender || "").trim();
      if (!g && attr.attributeValue?.trim()) {
        g = attr.attributeValue.trim();
      }
      if (!g) {
        const fromVariants = allVariantAttrs
          .filter((va: any) => {
            if (attr.id && va.productAttributeId === attr.id) return true;
            if (va.productAttribute?.id && attr.id && va.productAttribute.id === attr.id) return true;
            const vaName = (va.productAttribute?.attributeName || "").trim().toLowerCase();
            return vaName === "gender";
          })
          .map((va: any) => va.attributeValue?.trim())
          .filter(Boolean);
        if (fromVariants.length > 0) {
          g = fromVariants[0];
        }
      }
      return {
        name: "Gender",
        values: g ? [g] : [],
      };
    }

    // 2. Colour: prioritize product.colors, then fallback to variant attributes
    if (["colour", "color"].includes(lowerName)) {
      let colors: string[] = [];
      if (Array.isArray(product.colors) && product.colors.length > 0) {
        colors = product.colors.filter((c): c is string => typeof c === "string" && Boolean(c.trim()));
      } else if (typeof product.colors === "string" && (product.colors as string).trim()) {
        colors = (product.colors as string).split(",").map((s) => s.trim()).filter(Boolean);
      }

      if (colors.length === 0) {
        const fromVariants = allVariantAttrs
          .filter((va: any) => {
            if (attr.id && va.productAttributeId === attr.id) return true;
            if (va.productAttribute?.id && attr.id && va.productAttribute.id === attr.id) return true;
            const vaName = (va.productAttribute?.attributeName || "").trim().toLowerCase();
            return ["colour", "color"].includes(vaName);
          })
          .flatMap((va: any) => {
            const val = va.attributeValue;
            if (!val || typeof val !== "string") return [];
            return val.split(",").map((s: string) => s.trim()).filter(Boolean);
          });
        colors = Array.from(new Set(fromVariants));
      }

      if (colors.length === 0 && attr.attributeValue?.trim()) {
        colors = attr.attributeValue.split(",").map((s) => s.trim()).filter(Boolean);
      }

      return {
        name: attrName,
        values: colors,
      };
    }

    // 3. Size: prioritize product.sizeList, then fallback to variant attributes
    if (["size"].includes(lowerName)) {
      let sizes: string[] = [];
      if (product.sizeList && typeof product.sizeList === "string" && product.sizeList.trim()) {
        sizes = product.sizeList.split(",").map((s) => s.trim()).filter(Boolean);
      }

      if (sizes.length === 0) {
        const fromVariants = allVariantAttrs
          .filter((va: any) => {
            if (attr.id && va.productAttributeId === attr.id) return true;
            if (va.productAttribute?.id && attr.id && va.productAttribute.id === attr.id) return true;
            const vaName = (va.productAttribute?.attributeName || "").trim().toLowerCase();
            return ["size"].includes(vaName);
          })
          .flatMap((va: any) => {
            const val = va.attributeValue;
            if (!val || typeof val !== "string") return [];
            return val.split(",").map((s: string) => s.trim()).filter(Boolean);
          });
        sizes = Array.from(new Set(fromVariants));
      }

      if (sizes.length === 0 && attr.attributeValue?.trim()) {
        sizes = attr.attributeValue.split(",").map((s) => s.trim()).filter(Boolean);
      }

      const definedSizes = product.sizeList
        ? product.sizeList.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const sortedSizes = sortSizes(sizes, definedSizes);

      return {
        name: attrName,
        values: sortedSizes,
      };
    }

    // 4. Other attributes:
    const valuesFromVariants = allVariantAttrs
      .filter((va: any) => {
        if (attr.id && va.productAttributeId === attr.id) return true;
        if (va.productAttribute?.id && attr.id && va.productAttribute.id === attr.id) return true;
        const vaName = va.productAttribute?.attributeName?.trim().toLowerCase();
        return Boolean(vaName && vaName === lowerName);
      })
      .flatMap((va: any) => {
        const val = va.attributeValue;
        if (!val || typeof val !== "string") return [];
        return val.split(",").map((s: string) => s.trim()).filter(Boolean);
      })
      .filter((v: string | undefined): v is string => Boolean(v && v.trim()));

    const uniqueVals = Array.from(new Set(valuesFromVariants));

    if (uniqueVals.length === 0 && attr.attributeValue?.trim()) {
      const parts = attr.attributeValue.split(",").map((s) => s.trim()).filter(Boolean);
      uniqueVals.push(...parts);
    }

    return {
      name: attrName,
      values: uniqueVals,
    };
  });
};

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onStatusChange,
  expandedProductId,
  onVariantToggle,
  selectedProductIds = [],
  onToggleSelect,
  onToggleSelectAll,
  tableWrapperClassName,
  parentScrollRef,
}: Props) {
  const isAllCurrentPageSelected =
    products.length > 0 &&
    products.every((p) => selectedProductIds.includes(p.id));
  const isSomeCurrentPageSelected =
    products.some((p) => selectedProductIds.includes(p.id)) &&
    !isAllCurrentPageSelected;

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
          <Package className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
          No Products Found
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm dark:text-slate-400">
          No product records matched your search or filter criteria. Try clearing your filters or adding a new product.
        </p>
      </div>
    );
  }

  return (
    <div className={tableWrapperClassName || "w-full min-w-0"}>
      <table className="w-full min-w-[1250px] border-collapse text-left font-sans">
        <thead className="lg:sticky lg:top-0 z-10 bg-[#FEFAEE] dark:bg-[#080B11] text-xs sm:text-sm font-bold tracking-wider text-[#6A4D1D] border-b border-[#F5E6BE] dark:border-white/[0.08] dark:text-[#E8C16D] select-none shadow-xs">
          <tr>
            <th className="px-4 py-3.5 text-center w-12">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={isAllCurrentPageSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeCurrentPageSelected;
                  }}
                  onChange={() => onToggleSelectAll?.()}
                  className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] cursor-pointer focus:ring-[#E8C16D] focus:ring-offset-0 transition"
                  title="Select all products on this page"
                />
              </div>
            </th>

            <th className="px-4 py-3.5 text-center font-semibold min-w-[240px]">
              Product Details
            </th>

            <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-[150px]">
              Master SKU
            </th>

            <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-[130px]">
              Brand & Unit
            </th>

            <th className="px-4 py-3.5 text-center font-semibold min-w-[200px]">
              Category
            </th>

            <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-28">
              Status
            </th>

            <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20">
              Actions
            </th>

            <th className="px-4 py-3.5 text-center font-semibold whitespace-nowrap w-20">
              Variants
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans dark:divide-white/[0.06] dark:bg-[#0F1626]">
          {products.map((product) => {
            const isSelected = selectedProductIds.includes(product.id);
            return (
              <Fragment key={product.id}>
                <tr
                  className={`transition-colors ${
                    isSelected
                      ? "bg-[#FFF9EC]/80 dark:bg-[#F5C451]/10 hover:bg-[#FFF9EC] dark:hover:bg-[#F5C451]/15"
                      : "hover:bg-slate-50/80 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <td className="px-4 py-3.5 text-center w-12 align-middle">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(product.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0A0E1A] accent-[#0A0E1A] dark:accent-[#F5C451] cursor-pointer focus:ring-[#E8C16D] focus:ring-offset-0 transition"
                        title={isSelected ? "Deselect row" : "Select row"}
                      />
                    </div>
                  </td>

                  {/* Product Details (Name, SKU, Description, Party) */}
                  <td className="px-4 py-3.5 align-middle text-center min-w-[240px]">
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-[#0A0E1A] truncate dark:text-white text-center" title={product.productName}>
                        {product.productName}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px]">
                        {product.sku && (
                          <span className="inline-flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                            <span className="text-slate-400 dark:text-slate-500 font-normal">SKU:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{product.sku}</span>
                          </span>
                        )}
                        {product.referenceParty && (
                          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <span className="text-slate-400 dark:text-slate-500 font-normal">Party:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">{product.referenceParty}</span>
                          </span>
                        )}
                        {(() => {
                          let effGender =
                            (product.gender || "").trim() ||
                            product.attributes?.find(
                              (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
                            )?.attributeValue?.trim() ||
                            "";
                          if (!effGender && Array.isArray(product.variants)) {
                            for (const v of product.variants) {
                              const found = (v.attributes || []).find(
                                (va: any) =>
                                  (va.productAttribute?.attributeName || "").toLowerCase().trim() === "gender"
                              );
                              if (found?.attributeValue?.trim()) {
                                effGender = found.attributeValue.trim();
                                break;
                              }
                            }
                          }
                          if (!effGender) return null;
                          return (
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <span className="text-slate-400 dark:text-slate-500 font-normal">Gender:</span>
                              <span className="font-medium text-purple-700 dark:text-purple-300">{effGender}</span>
                            </span>
                          );
                        })()}
                        {(() => {
                          const rawMkt = (product as any)?.marketplace;
                          let mkts: string[] = [];
                          if (Array.isArray(rawMkt)) {
                            mkts = rawMkt.map((m) => String(m).trim()).filter(Boolean);
                          } else if (typeof rawMkt === "string" && rawMkt.trim()) {
                            mkts = rawMkt.split(",").map((m) => m.trim()).filter(Boolean);
                          }
                          if (mkts.length === 0) return null;
                          return (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B88728] dark:text-[#F5C451]"
                              title={`Marketplace: ${mkts.join(", ")}`}
                            >
                              <Store className="h-3 w-3" />
                              <span>{mkts.join(", ")}</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </td>

                  {/* Master SKU */}
                  <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap w-[150px]">
                    <span className="font-semibold text-slate-900 font-mono dark:text-slate-200">
                      {product.masterSku}
                    </span>
                  </td>

                  {/* Brand & Unit */}
                  <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap w-[130px]">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-slate-800 dark:text-slate-200 text-center">
                        {product.brand || "No Brand"}
                      </span>
                      {product.unit && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                          Unit: {product.unit}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Category & Attributes */}
                  <td className="px-4 py-3.5 align-middle text-center min-w-[200px]">
                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-center">
                        {product.category}
                      </span>
                      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
                        {getProductAttributeItems(product).map((attr, idx) => {
                          const hasValues = attr.values.length > 0;
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400"
                            >
                              <span className="text-slate-400 dark:text-slate-500 font-normal">
                                {attr.name}:
                              </span>
                              {hasValues && (
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                  {attr.values.join(", ")}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap w-28">
                    <div className="flex items-center justify-center">
                      <ProductStatusBadge isActive={product.isActive} />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap w-20">
                    <div className="flex items-center justify-center">
                      <ProductActionMenu
                        product={product}

                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                      />
                    </div>
                  </td>

                  {/* Variants */}
                  <td className="px-4 py-3.5 align-middle text-center whitespace-nowrap w-20">
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => onVariantToggle(product)}
                        className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-[#E8C16D] hover:bg-[#FFF9EC] hover:text-[#B88728] transition-all shadow-2xs active:scale-95 cursor-pointer dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-300 dark:hover:border-[#F5C451]/50 dark:hover:bg-[#F5C451]/10 dark:hover:text-[#F5C451]"
                        title={expandedProductId === product.id ? "Collapse variants" : "Expand variants"}
                      >
                        {expandedProductId === product.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>

                {expandedProductId === product.id && (
                  <tr>
                    <td
                      colSpan={8}
                      className="border-t border-[#E7E0D2] bg-slate-50/60 p-2 sm:p-4 md:p-5 dark:border-white/[0.08] dark:bg-[#080B11]/50"
                    >
                      <ProductVariantInline
                        productId={product.id}
                        attributes={
                          product.attributes && product.attributes.length > 0
                            ? product.attributes
                            : getDefaultAttributesForCategory(product.category).map(
                                (name) => ({ attributeName: name })
                              )
                        }
                        masterSku={product.masterSku}
                        product={product}
                        parentScrollRef={parentScrollRef}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
