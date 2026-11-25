import { API_BASE_URL } from "@/lib/config";
import type { Product, ProductAttribute } from "../types/product.types";
import type { ProductVariant } from "../types/productVariant.types";
import { defaultColorPresets } from "../constants/product.constants";

export interface VariantAttributeEntry {
  productAttributeId: string;
  attributeValue: string;
}

export const getColorHex = (name: string): string => {
  if (!name) return "#64748B";
  const clean = name.toLowerCase().trim();
  const found = defaultColorPresets.find(
    (p) => p.name.toLowerCase() === clean
  );
  if (found) return found.hex;
  if (/^#([0-9A-F]{3}){1,2}$/i.test(name.trim())) return name.trim();
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("orderos_custom_color_hexes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[clean]) return parsed[clean];
      }
    } catch {
      // ignore storage errors
    }
  }
  return "#64748B";
};

export const toFullImageUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  let cleanPath = url.startsWith("/") ? url : `/${url}`;
  if (!cleanPath.startsWith("/api/v1")) {
    cleanPath = `/api/v1${cleanPath}`;
  }
  return `${cleanBase}${cleanPath}`;
};

export const getActiveMarketplacesInfo = (
  marketplace?: string | string[],
  product?: Product | null
) => {
  const raw = marketplace ?? product?.marketplace ?? "All";
  let activeMarketplaces = ["all"];
  if (Array.isArray(raw)) {
    activeMarketplaces = raw.map((m) => String(m).trim().toLowerCase());
  } else if (typeof raw === "string") {
    activeMarketplaces = raw
      .split(",")
      .map((m) => m.trim().toLowerCase())
      .filter(Boolean);
  }
  const isAllMarketplace =
    activeMarketplaces.length === 0 || activeMarketplaces.includes("all");
  return {
    activeMarketplaces,
    isAllMarketplace,
    showAsin: isAllMarketplace || activeMarketplaces.includes("amazon"),
    showMyntraSku: isAllMarketplace || activeMarketplaces.includes("myntra"),
    showFsnCode: isAllMarketplace || activeMarketplaces.includes("flipkart"),
  };
};

export const getSizeValue = (
  variant: ProductVariant,
  product?: Product | null
): string => {
  const sizeAttr = variant.attributes?.find((a) =>
    ["size"].includes(
      (a.productAttribute?.attributeName || "").toLowerCase().trim()
    )
  );
  if (sizeAttr?.attributeValue?.trim()) {
    return sizeAttr.attributeValue.trim();
  }

  const sku = variant.variantSku || "";
  if (sku) {
    const parts = sku.split("-");
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1].trim();
      if (/^\d+$/.test(lastPart) && parts.length >= 3) {
        const secondLast = parts[parts.length - 2].trim();
        if (product?.sizeList) {
          const knownSizes = product.sizeList
            .split(",")
            .map((s) => s.trim().toLowerCase());
          if (knownSizes.includes(secondLast.toLowerCase())) {
            return secondLast;
          }
        }
        if (/^(XS|S|M|L|XL|XXL|XXXL|2XL|4XL|\d{2})$/i.test(secondLast)) {
          return secondLast;
        }
      }
      if (product?.sizeList) {
        const knownSizes = product.sizeList
          .split(",")
          .map((s) => s.trim().toLowerCase());
        if (knownSizes.includes(lastPart.toLowerCase())) {
          return lastPart;
        }
      }
      return lastPart;
    }
  }
  return "";
};

export const getColorValue = (
  variant: ProductVariant,
  product?: Product | null
): string => {
  const colAttr = variant.attributes?.find((a) =>
    ["colour", "color"].includes(
      (a.productAttribute?.attributeName || "").toLowerCase().trim()
    )
  );
  if (colAttr?.attributeValue?.trim()) {
    return colAttr.attributeValue.trim();
  }

  const sku = variant.variantSku || "";
  if (sku && Array.isArray(product?.colors) && product.colors.length > 0) {
    const skuParts = sku.toLowerCase().split("-");
    for (const c of product.colors) {
      if (skuParts.includes(c.toLowerCase().trim())) {
        return c;
      }
    }
  }
  return "";
};

export const resolveExistingGender = (
  variants: ProductVariant[] = [],
  product?: Product | null,
  attributes: ProductAttribute[] = []
): string => {
  for (const v of variants) {
    const matched = v.attributes?.find(
      (a) =>
        (a.productAttribute?.attributeName || "").toLowerCase().trim() ===
        "gender"
    );
    if (matched?.attributeValue?.trim()) {
      return matched.attributeValue.trim();
    }
  }

  if (product?.gender && typeof product.gender === "string" && product.gender.trim()) {
    return product.gender.trim();
  }

  const attrGender = attributes.find(
    (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
  );
  if (attrGender?.attributeValue && attrGender.attributeValue.trim()) {
    return attrGender.attributeValue.trim();
  }

  const prodAttrGender = product?.attributes?.find(
    (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
  );
  if (prodAttrGender?.attributeValue && prodAttrGender.attributeValue.trim()) {
    return prodAttrGender.attributeValue.trim();
  }

  return "";
};

export const getGenderValue = (
  variant: ProductVariant,
  existingGender = ""
): string => {
  const genderAttr = variant.attributes?.find(
    (a) =>
      (a.productAttribute?.attributeName || "").toLowerCase().trim() === "gender"
  );
  if (genderAttr?.attributeValue?.trim()) {
    return genderAttr.attributeValue.trim();
  }
  return existingGender || "";
};

export const resolveAvailableGenders = (
  variants: ProductVariant[] = [],
  product?: Product | null,
  existingGender = ""
): string[] => {
  const set = new Set<string>();
  if (product?.gender) {
    if (Array.isArray(product.gender)) {
      (product.gender as unknown[]).forEach((g) => g && set.add(String(g).trim()));
    } else if (typeof product.gender === "string" && product.gender.trim()) {
      product.gender.split(",").forEach((s) => s.trim() && set.add(s.trim()));
    }
  }
  for (const v of variants) {
    const matched = v.attributes?.find(
      (a) =>
        (a.productAttribute?.attributeName || "").toLowerCase().trim() ===
        "gender"
    );
    if (matched?.attributeValue?.trim()) {
      set.add(matched.attributeValue.trim());
    }
  }
  if (existingGender) {
    existingGender.split(",").forEach((s) => s.trim() && set.add(s.trim()));
  }
  return Array.from(set);
};

export const buildGenderPricingMap = (
  variants: ProductVariant[] = []
): Record<string, { cost: number; mrp: number }> => {
  const map: Record<string, { cost: number; mrp: number }> = {};
  for (const v of variants) {
    const matched = v.attributes?.find(
      (a) =>
        (a.productAttribute?.attributeName || "").toLowerCase().trim() ===
        "gender"
    );
    const gen = matched?.attributeValue?.trim() || "";
    if (gen && (!map[gen] || (map[gen].cost === 0 && Number(v.cost) > 0))) {
      map[gen] = {
        cost: v.cost !== undefined && v.cost !== null ? Number(v.cost) : 0,
        mrp: v.mrp !== undefined && v.mrp !== null ? Number(v.mrp) : 0,
      };
    }
  }
  return map;
};

export const resolveAttributeId = (
  targetNames: string[],
  attributes: ProductAttribute[] = [],
  product?: Product | null,
  variants: ProductVariant[] = []
): string | undefined => {
  const fromProp = attributes.find((a) =>
    targetNames.includes((a.attributeName || "").toLowerCase().trim())
  );
  if (fromProp?.id) return fromProp.id;

  const fromProduct = (product?.attributes || []).find((a) =>
    targetNames.includes((a.attributeName || "").toLowerCase().trim())
  );
  if (fromProduct?.id) return fromProduct.id;

  for (const v of variants) {
    for (const a of v.attributes || []) {
      if (
        targetNames.includes(
          (a.productAttribute?.attributeName || "").toLowerCase().trim()
        )
      ) {
        return a.productAttributeId || a.productAttribute?.id;
      }
    }
  }
  return undefined;
};

export const buildExtraAttributes = (
  attributes: ProductAttribute[] = [],
  existingGender = "",
  resolvedGenderAttrId?: string
): ProductAttribute[] => {
  const list = attributes.filter(
    (a) =>
      !["colour", "color", "size"].includes(
        (a.attributeName || "").toLowerCase().trim()
      )
  );

  const hasGender = list.some(
    (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
  );
  if (!hasGender && (existingGender || resolvedGenderAttrId)) {
    list.push({
      id: resolvedGenderAttrId,
      attributeName: "Gender",
      attributeValue: existingGender,
    });
  }

  return list;
};

export const checkHasSizeAttribute = (
  attributes: ProductAttribute[] = [],
  product?: Product | null,
  variants: ProductVariant[] = []
): boolean => {
  const inAttrs = attributes.some((a) =>
    ["size"].includes((a.attributeName || "").toLowerCase().trim())
  );
  if (inAttrs) return true;

  const inProdAttrs = (product?.attributes || []).some((a) =>
    ["size"].includes((a.attributeName || "").toLowerCase().trim())
  );
  if (inProdAttrs) return true;

  if (product?.sizeList && product.sizeList.trim().length > 0) return true;

  const inVariants = variants.some((v) =>
    (v.attributes || []).some(
      (a) =>
        (a.productAttribute?.attributeName || "").toLowerCase().trim() ===
          "size" && Boolean(a.attributeValue && a.attributeValue.trim())
    )
  );
  return inVariants;
};

export const getDefinedSizes = (
  product?: Product | null,
  attributes: ProductAttribute[] = [],
  variants: ProductVariant[] = []
): string[] => {
  const list: string[] = [];
  const pushUnique = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed && !list.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
      list.push(trimmed);
    }
  };

  if (product?.sizeList?.trim()) {
    product.sizeList.split(",").forEach(pushUnique);
  }
  const sizeAttr = attributes.find((a) =>
    ["size"].includes((a.attributeName || "").toLowerCase().trim())
  );
  if (sizeAttr?.attributeValue) {
    sizeAttr.attributeValue.split(",").forEach(pushUnique);
  }
  variants.forEach((v) => {
    const sz = getSizeValue(v, product).trim();
    if (sz) pushUnique(sz);
  });

  return list;
};

export const generateVariantSku = (
  colorName: string,
  sizeVal: string,
  baseSku = ""
): string => {
  const base = (baseSku || "").trim();
  const c = (colorName || "").trim();
  const s = (sizeVal || "").trim();

  const isNonStandardColor = Boolean(c && c.toLowerCase() !== "standard");

  if (base && isNonStandardColor && s) return `${base}-${c}-${s}`;
  if (base && s) return `${base}-${s}`;
  if (base && isNonStandardColor) return `${base}-${c}`;
  if (isNonStandardColor && s) return `${c}-${s}`;

  return base || s || c || "SKU";
};

export const getCleanVariantSku = (
  variant: ProductVariant,
  groupColorName?: string,
  baseSku = "",
  product?: Product | null
): string => {
  const sz = getSizeValue(variant, product);
  const col =
    (groupColorName && groupColorName.toLowerCase() !== "standard"
      ? groupColorName
      : "") || getColorValue(variant, product);
  const base = (baseSku || product?.masterSku || "").trim();

  if (base && (col || sz)) {
    return generateVariantSku(col, sz, base);
  }

  const rawSku = (variant.variantSku || "").trim();
  if (!rawSku) return "";

  if (sz) {
    const sizeSuffixRegex = new RegExp(`(-${sz})-\\d+$`, "i");
    if (sizeSuffixRegex.test(rawSku)) {
      return rawSku.replace(/-\d+$/, "");
    }
  }

  const match = rawSku.match(
    /^(.*?-(?:XS|S|M|L|XL|XXL|XXXL|2XL|4XL|\d{2}))-\d+$/i
  );
  if (match && match[1]) {
    return match[1];
  }

  return rawSku.replace(/(?<=[a-zA-Z])-\d+$/, "");
};

export const findDuplicateVariant = (
  variants: ProductVariant[],
  excludeVariantId: string,
  effectiveColor: string,
  effectiveSize: string,
  effectiveGender: string,
  existingGender: string,
  product?: Product | null
): ProductVariant | undefined => {
  const targetCol = (effectiveColor || "standard").trim().toLowerCase();
  const targetSz = effectiveSize.trim().toLowerCase();
  const targetGen = (effectiveGender || "").trim().toLowerCase();

  return variants.find((v) => {
    if (v.id === excludeVariantId) return false;
    const vCol = (getColorValue(v, product) || "standard").trim().toLowerCase();
    const vSz = getSizeValue(v, product).trim().toLowerCase();
    const vGen = (getGenderValue(v, existingGender) || "").trim().toLowerCase();
    return vCol === targetCol && vSz === targetSz && vGen === targetGen;
  });
};
