"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Package,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  TrendingUp,
  Boxes,
  MapPin,
  ListFilter,
  CheckCircle2,
  Check,

  Trash2,
  Tags,
  Plus,
} from "lucide-react";

import type { Product } from "../types/product.types";
import {
  productCategoryOptions,
  defaultMarketplaceOptions,
  brandOptions as defaultBrandOptions,
  unitOptions as defaultUnitOptions,
  genderOptions as defaultGenderOptions,
  gstOptions as defaultGstOptions,
  availabilityOptions as defaultAvailabilityOptions,
  rackAddressOptions as defaultRackOptions,
  defaultColorPresets,
  getCategoryAttributeConfig,
  getAttributePlaceholder,
  defaultShoeSizes,
  defaultNumericSizes,
} from "../constants/product.constants";

import {
  productSchema,
  type ProductFormValues,
} from "../validations/product.validation";

import { useCreateProduct, useUpdateProduct, useProduct } from "../hooks/useProducts";
import { useQueryClient } from "@tanstack/react-query";
import { useProductVariants } from "../hooks/useProductVariants";
import { productVariantService } from "../services/productVariant.service";
import type { ProductVariant } from "../types/productVariant.types";
import { useDropdownOptions, useSaveDropdownOption } from "../hooks/useDropdownOptions";
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";

import DropdownWithOther, { type DropdownOption } from "./DropdownWithOther";
import MarketplaceMultiSelect from "./MarketplaceMultiSelect";
import ColorMultiSelect from "./ColorMultiSelect";
import SizeMultiSelect from "./SizeMultiSelect";
import ProductTabsNav, { type ProductActiveTab } from "./ProductTabsNav";
import DeleteAttributeModal from "./DeleteAttributeModal";

const getFriendlyErrorMessage = (error: any, fallback: string): string => {
  const rawMsg =
    error?.response?.data?.message ||
    error?.message ||
    (typeof error === "string" ? error : "");

  if (
    rawMsg.includes("expired transaction") ||
    rawMsg.includes("Transaction already closed") ||
    rawMsg.includes("Transaction API error") ||
    rawMsg.includes("timeout") ||
    rawMsg.includes("P2028")
  ) {
    return "Operation timed out while processing variants. Please try again with fewer combinations.";
  }

  if (
    rawMsg.includes("Unique constraint failed") ||
    rawMsg.includes("P2002") ||
    rawMsg.includes("already exists")
  ) {
    return "A product with this Master SKU or Variant SKU already exists.";
  }

  if (
    rawMsg.includes("Invalid `prisma.") ||
    rawMsg.includes("PrismaClient") ||
    rawMsg.includes("invocation:")
  ) {
    return "Failed to save product due to a database issue. Please review your details and try again.";
  }

  return rawMsg || fallback;
};

interface Props {
  mode: "create" | "edit";
  product?: Product;
  onSuccess: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDeleteClick?: () => void;
}

const defaultValues: ProductFormValues = {
  productName: "",
  masterSku: "",
  sku: "",
  marketplace: ["All"],
  brand: "No Brand",
  category: "",
  subCategory: "",
  unit: "Pcs",
  sizeList: "",
  colors: [],
  gender: "",
  referenceParty: "",
  description: "",
  asin: "",
  myntraSku: "",
  fsnCode: "",
  rackAddress: "",
  generateBarcode: "No",
  mrp: "",
  mfgMonth: "",
  hsnCode: "",
  gstRate: 5,

  // Kardex Details
  productCost: 0,
  dealerRate: 0,
  retailRate: 0,
  openingStock: 0,
  reorderLevelStock: 0,
  minimumStock: 0,
  productPoints: 1,
  isPaired: false,
  availability: "Public",

  isActive: true,
  attributes: [],
};

export default function ProductForm({
  mode,
  product,
  onSuccess,
  onLoadingChange,
  onDeleteClick,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProductActiveTab>("general");
  const [isSubmittingVariants, setIsSubmittingVariants] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as never,
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  // Fetch dynamic dropdown options from backend DB
  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  const { data: variantsResponse } = useProductVariants(
    mode === "edit" && product?.id ? product.id : ""
  );
  const { data: singleProductResponse } = useProduct(
    mode === "edit" && product?.id ? product.id : ""
  );

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "attributes",
  });

  const watchedCategory = watch("category");
  const categoryConfig = useMemo(() => {
    return getCategoryAttributeConfig(watchedCategory);
  }, [watchedCategory]);

  const saveOptionMutation = useSaveDropdownOption();



  // State to confirm attribute deletion with themed modal
  const [deleteAttrIndex, setDeleteAttrIndex] = useState<number | null>(null);
  const [deleteAttrName, setDeleteAttrName] = useState<string>("");

  const confirmDeleteAttribute = () => {
    if (deleteAttrIndex !== null) {
      remove(deleteAttrIndex);
      setDeleteAttrIndex(null);
      setDeleteAttrName("");
      toast.success("Attribute removed");
    }
  };

  // Local storage for custom saved attributes per category
  const [customSavedAttrs, setCustomSavedAttrs] = useState<Record<string, string[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_saved_attributes");
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const currentCatKey = (watchedCategory || "general").trim().toLowerCase();

  // When category changes, clean up old category defaults and auto-populate new category defaults
  const prevCategoryRef = useRef<string | null>(null);
  useEffect(() => {
    const currentCat = (watchedCategory || "").trim().toLowerCase();

    if (prevCategoryRef.current === null) {
      prevCategoryRef.current = currentCat;
      if (mode === "create" && fields.length === 0 && categoryConfig.defaultAttributes.length > 0) {
        replace(categoryConfig.defaultAttributes.map((attr) => ({ ...attr })));
      }
      return;
    }

    if (prevCategoryRef.current !== currentCat) {
      const oldCat = prevCategoryRef.current;
      prevCategoryRef.current = currentCat;

      const oldConfig = getCategoryAttributeConfig(oldCat);
      const newConfig = getCategoryAttributeConfig(currentCat);

      const oldDefaultNames = new Set(
        oldConfig.defaultAttributes.map((a) => a.attributeName.trim().toLowerCase())
      );
      const newDefaultNames = new Set(
        newConfig.defaultAttributes.map((a) => a.attributeName.trim().toLowerCase())
      );

      const oldSuggestedNames = new Set(
        oldConfig.suggestedAttributes.map((a) => a.trim().toLowerCase())
      );
      const newSuggestedNames = new Set(
        newConfig.suggestedAttributes.map((a) => a.trim().toLowerCase())
      );

      // 1. Remove attributes that belonged to the previous category's defaults (like Storage/RAM)
      // or empty suggested attributes that don't belong to the new category
      const cleanedFields = fields.filter((f) => {
        const name = (f.attributeName || "").trim().toLowerCase();
        const hasVal = Boolean(f.attributeValue && f.attributeValue.trim());

        // Default attributes of old category that are not default of new category must be removed
        if (oldDefaultNames.has(name) && !newDefaultNames.has(name)) {
          return false;
        }

        // Empty attributes belonging to old category suggestions that are not part of new category
        if (!hasVal && oldSuggestedNames.has(name) && !newSuggestedNames.has(name)) {
          return false;
        }

        return true;
      });

      // 2. Add any default attributes of the new category that are missing
      const existingNames = new Set(
        cleanedFields.map((f) => (f.attributeName || "").trim().toLowerCase())
      );
      const toAdd = newConfig.defaultAttributes.filter(
        (da) => !existingNames.has(da.attributeName.trim().toLowerCase())
      );

      replace([...cleanedFields, ...toAdd.map((a) => ({ ...a }))]);

    }
  }, [watchedCategory, mode, fields, replace, categoryConfig]);



  // Combine suggested category attributes with saved attributes
  const allSuggestedAttributes = useMemo(() => {
    const base = categoryConfig.suggestedAttributes || [];
    const custom = customSavedAttrs[currentCatKey] || [];
    const dbAttrs = (dropdownData?.savedOptions || [])
      .filter((o) =>
        [
          `attribute_${currentCatKey}`,
          "attributename",
          "attribute",
        ].includes(o.field.toLowerCase())
      )
      .map((o) => o.value);
    return Array.from(new Set([...base, ...custom, ...dbAttrs]));
  }, [categoryConfig, customSavedAttrs, currentCatKey, dropdownData]);

  // Dynamic Options merged with DB saved options and distinct options
  const categoryOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "category",
      productCategoryOptions.filter((opt) => opt.value !== "other"),
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.categories
    );
  }, [dropdownData]);

  const brandOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "brand",
      defaultBrandOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.brands
    );
  }, [dropdownData]);

  const unitOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "unit",
      defaultUnitOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.units
    );
  }, [dropdownData]);

  const genderOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "gender",
      defaultGenderOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.genders
    );
  }, [dropdownData]);

  const referencePartyOptions: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      { label: "Select Reference Party", value: "" },
      { label: "Direct Customer / Cash", value: "Direct Customer / Cash" },
    ];
    return buildMergedOptions(
      "referenceparty",
      list,
      dropdownData?.savedOptions,
      [...(dropdownData?.parties || []), ...(dropdownData?.distinctFromProducts?.referenceParties || [])]
    );
  }, [dropdownData]);

  const gstRateOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      ["gstrate", "gst"],
      defaultGstOptions,
      dropdownData?.savedOptions,
      (dropdownData?.distinctFromProducts as any)?.gstRates
    );
  }, [dropdownData]);

  const availabilityOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "availability",
      defaultAvailabilityOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.availabilities
    );
  }, [dropdownData]);

  const marketplaceOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "marketplace",
      defaultMarketplaceOptions,
      dropdownData?.savedOptions
    );
  }, [dropdownData]);

  const rackOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "rackaddress",
      defaultRackOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.rackAddresses
    );
  }, [dropdownData]);

  const dynamicColors = useMemo(() => {
    let localSaved: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_colors");
        localSaved = stored ? JSON.parse(stored) : [];
      } catch {}
    }

    const merged = buildMergedOptions(
      ["color", "colors"],
      [],
      dropdownData?.savedOptions,
      [...(dropdownData?.distinctFromProducts?.colors || []), ...localSaved]
    );
    return merged.map((o) => o.value);
  }, [dropdownData]);

  // Sync initial values in Edit mode
  const lastSyncedKeyRef = useRef<string>("");

  useEffect(() => {
    if (mode === "edit" && product) {
      const activeProduct = singleProductResponse?.data ?? product;
      const allVariants: any[] = [
        ...(Array.isArray(activeProduct.variants) ? activeProduct.variants : []),
        ...(Array.isArray(variantsResponse?.data) ? variantsResponse.data : []),
      ];

      // Deduplicate variants
      const uniqueVariantsMap = new Map<string, any>();
      allVariants.forEach((v) => {
        const key = v.id || v.variantSku;
        if (key && !uniqueVariantsMap.has(key)) {
          uniqueVariantsMap.set(key, v);
        }
      });
      const uniqueVariants = Array.from(uniqueVariantsMap.values());

      const existingCategory = activeProduct.category || "";

      // 1. Extract colors
      const rawColors: unknown = (activeProduct as any).colors;
      let initialColors: string[] = [];
      if (Array.isArray(rawColors) && rawColors.length > 0) {
        initialColors = rawColors.filter((c): c is string => typeof c === "string" && Boolean(c.trim()));
      } else if (typeof rawColors === "string" && rawColors.trim()) {
        try {
          const parsed = JSON.parse(rawColors);
          initialColors = Array.isArray(parsed) ? parsed : [rawColors];
        } catch {
          initialColors = rawColors.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }

      // Check product attributes
      if (initialColors.length === 0) {
        const colorAttr = (activeProduct.attributes || []).find((a: any) =>
          ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim())
        );
        if (colorAttr?.attributeValue?.trim()) {
          initialColors = colorAttr.attributeValue.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
      const colorAttrIds = (activeProduct.attributes || [])
        .filter((a: any) => ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim()))
        .map((a: any) => a.id)
        .filter(Boolean);

      // Fallback colors from variants
      if (initialColors.length === 0 && uniqueVariants.length > 0) {
        const variantColors = uniqueVariants.flatMap((v: any) =>
          (v.attributes || [])
            .filter((va: any) => {
              if (va.productAttributeId && colorAttrIds.includes(va.productAttributeId)) return true;
              const attrName = (va.productAttribute?.attributeName || "").toLowerCase().trim();
              return ["colour", "color"].includes(attrName);
            })
            .flatMap((va: any) => {
              const val = va.attributeValue?.trim();
              return val ? val.split(",").map((s: string) => s.trim()) : [];
            })
            .filter(Boolean)
        );
        if (variantColors.length > 0) {
          initialColors = Array.from(new Set(variantColors));
        }
      }

      // Fallback colors from product title, master SKU or variant SKUs against known colors
      if (initialColors.length === 0) {
        const allKnownColors = Array.from(
          new Set([
            ...defaultColorPresets.map((c) => c.name),
            ...dynamicColors,
            "Magenta",
            "Black",
            "White",
            "Navy",
            "Red",
            "Blue",
            "Green",
            "Yellow",
            "Orange",
            "Grey",
            "Gray",
            "Purple",
            "Pink",
            "Maroon",
            "Beige",
            "Brown",
            "Teal",
            "Olive",
            "Lavender",
            "Peach",
            "Charcoal",
          ])
        );

        const textToSearch = `${activeProduct.productName || ""} ${activeProduct.masterSku || ""} ${uniqueVariants
          .map((v) => v.variantSku || "")
          .join(" ")}`;

        const matchedColors = allKnownColors.filter((col) => {
          const regex = new RegExp(`(^|[-_\\s/])${col}([-_\\s/]|$)`, "i");
          return regex.test(textToSearch);
        });

        if (matchedColors.length > 0) {
          initialColors = matchedColors;
        }
      }

      // 2. Extract sizeList
      let initialSizeList = (activeProduct.sizeList || "").trim();
      if (!initialSizeList) {
        const sizeAttr = (activeProduct.attributes || []).find((a: any) =>
          ["size"].includes((a.attributeName || "").toLowerCase().trim())
        );
        if (sizeAttr?.attributeValue?.trim()) {
          initialSizeList = sizeAttr.attributeValue.trim();
        }
      }
      if (!initialSizeList && uniqueVariants.length > 0) {
        const sizeAttrIds = (activeProduct.attributes || [])
          .filter((a: any) => ["size"].includes((a.attributeName || "").toLowerCase().trim()))
          .map((a: any) => a.id)
          .filter(Boolean);

        const variantSizes = uniqueVariants.flatMap((v: any) =>
          (v.attributes || [])
            .filter((va: any) => {
              if (va.productAttributeId && sizeAttrIds.includes(va.productAttributeId)) return true;
              const attrName = (va.productAttribute?.attributeName || "").toLowerCase().trim();
              return ["size"].includes(attrName);
            })
            .flatMap((va: any) => {
              const val = va.attributeValue?.trim();
              return val ? val.split(",").map((s: string) => s.trim()) : [];
            })
            .filter(Boolean)
        );
        if (variantSizes.length > 0) {
          initialSizeList = Array.from(new Set(variantSizes)).join(", ");
        }
      }

      // Try extracting size from variant SKUs
      if (!initialSizeList && uniqueVariants.length > 0) {
        const sizeRegex = /[-_](XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|28|30|32|34|36|38|40|42|44)$/i;
        const skuSizes = uniqueVariants
          .map((v) => {
            const m = (v.variantSku || "").match(sizeRegex);
            return m ? m[1].toUpperCase() : null;
          })
          .filter((s): s is string => Boolean(s));

        if (skuSizes.length > 0) {
          initialSizeList = Array.from(new Set(skuSizes)).join(", ");
        }
      }

      // 3. Extract SKU
      const initialSku =
        (activeProduct.masterSku || "").trim() ||
        (activeProduct.sku || "").trim();

      // 4. Extract Gender
      let initialGender = (activeProduct.gender || "").trim();
      if (!initialGender) {
        const genderAttr = (activeProduct.attributes || []).find(
          (a: any) => (a.attributeName || "").toLowerCase().trim() === "gender"
        );
        if (genderAttr?.attributeValue?.trim()) {
          initialGender = genderAttr.attributeValue.trim();
        }
      }
      if (!initialGender && uniqueVariants.length > 0) {
        const variantGender = uniqueVariants.flatMap((v: any) =>
          (v.attributes || [])
            .filter((va: any) => (va.productAttribute?.attributeName || "").toLowerCase().trim() === "gender")
            .map((va: any) => va.attributeValue?.trim())
            .filter(Boolean)
        );
        if (variantGender.length > 0) {
          initialGender = variantGender[0];
        }
      }
      if (!initialGender) {
        const text = `${activeProduct.productName || ""} ${activeProduct.category || ""} ${
          activeProduct.subCategory || ""
        }`.toLowerCase();
        if (/\b(women|woman|ladies|lady|kurti|saree|lehenga|gown|dress|top|skirt|girl|girls)\b/.test(text)) {
          initialGender = "Women";
        } else if (/\b(men|man|mens|polo|shirt|t-shirt|trouser|pant|jeans|boy|boys)\b/.test(text)) {
          initialGender = "Men";
        } else if (/\b(kid|kids|baby|child|children|infant)\b/.test(text)) {
          initialGender = "Kids";
        } else {
          initialGender = "Unisex";
        }
      }

      // 4.5 Extract Marketplace
      let initialMarketplace: string[] = ["All"];
      const rawMkt = (activeProduct as any)?.marketplace;
      if (Array.isArray(rawMkt) && rawMkt.length > 0) {
        initialMarketplace = rawMkt;
      } else if (typeof rawMkt === "string" && rawMkt.trim()) {
        initialMarketplace = rawMkt.split(",").map((s: string) => s.trim()).filter(Boolean);
      } else {
        const mktAttr = (activeProduct.attributes || []).find(
          (a: any) => (a.attributeName || "").toLowerCase().trim() === "marketplace"
        );
        if (mktAttr?.attributeValue?.trim()) {
          initialMarketplace = mktAttr.attributeValue.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
      if (!initialMarketplace || initialMarketplace.length === 0) {
        initialMarketplace = ["All"];
      }

      // 5. Extract Reference Party
      let initialReferenceParty = (activeProduct.referenceParty || "").trim();
      if (!initialReferenceParty) {
        initialReferenceParty = dropdownData?.parties?.[0] || "Direct Customer / Cash";
      }

      // 6. Extract Kardex Fields
      const initialProductCost =
        typeof activeProduct.productCost === "number" && !isNaN(activeProduct.productCost)
          ? activeProduct.productCost
          : typeof uniqueVariants[0]?.productCost === "number"
          ? uniqueVariants[0].productCost
          : 0;

      const initialDealerRate =
        typeof activeProduct.dealerRate === "number" && !isNaN(activeProduct.dealerRate)
          ? activeProduct.dealerRate
          : typeof uniqueVariants[0]?.dealerRate === "number"
          ? uniqueVariants[0].dealerRate
          : 0;

      const initialRetailRate =
        typeof activeProduct.retailRate === "number" && !isNaN(activeProduct.retailRate)
          ? activeProduct.retailRate
          : typeof uniqueVariants[0]?.retailRate === "number"
          ? uniqueVariants[0].retailRate
          : 0;

      const initialOpeningStock =
        typeof activeProduct.openingStock === "number" && !isNaN(activeProduct.openingStock)
          ? activeProduct.openingStock
          : typeof uniqueVariants[0]?.openingStock === "number"
          ? uniqueVariants[0].openingStock
          : 0;

      const initialReorderLevel =
        typeof activeProduct.reorderLevelStock === "number" && !isNaN(activeProduct.reorderLevelStock)
          ? activeProduct.reorderLevelStock
          : typeof uniqueVariants[0]?.reorderLevelStock === "number"
          ? uniqueVariants[0].reorderLevelStock
          : 0;

      const initialMinimumStock =
        typeof activeProduct.minimumStock === "number" && !isNaN(activeProduct.minimumStock)
          ? activeProduct.minimumStock
          : typeof uniqueVariants[0]?.minimumStock === "number"
          ? uniqueVariants[0].minimumStock
          : 0;

      const initialProductPoints =
        typeof activeProduct.productPoints === "number" && !isNaN(activeProduct.productPoints)
          ? activeProduct.productPoints
          : 1;

      const initialIsPaired = Boolean(activeProduct.isPaired);

      const initialAvailability = activeProduct.availability || "Public";

      const initialRackAddress =
        (activeProduct.rackAddress || "").trim() ||
        (uniqueVariants.find((v: any) => v.rackAddress)?.rackAddress || "").trim();

      const initialMrp =
        activeProduct.mrp !== null &&
        activeProduct.mrp !== undefined &&
        String(activeProduct.mrp).trim() !== ""
          ? String(activeProduct.mrp)
          : uniqueVariants[0]?.mrp !== undefined && uniqueVariants[0]?.mrp !== null
          ? String(uniqueVariants[0].mrp)
          : "0";

      const allVariantAttrs = uniqueVariants.flatMap((v: any) => v.attributes || []);

      const customExistingAttrs = (activeProduct.attributes || [])
        .filter((a: any) => {
          const lower = (a.attributeName || "").toLowerCase().trim();
          return !["colour", "color", "size", "gender", "marketplace"].includes(lower);
        })
        .map((a: any) => {
          const matchedValues = allVariantAttrs
            .filter((va: any) => {
              if (va.productAttributeId && a.id && va.productAttributeId === a.id) return true;
              const vaName = (va.productAttribute?.attributeName || "").toLowerCase().trim();
              const aName = (a.attributeName || "").toLowerCase().trim();
              return vaName && aName && vaName === aName;
            })
            .map((va: any) => (va.attributeValue || "").trim())
            .filter(Boolean);

          const uniqueValues = Array.from(new Set(matchedValues));
          const valString = uniqueValues.join(", ");

          return {
            id: a.id,
            attributeName: a.attributeName,
            attributeValue: valString || a.attributeValue || "",
          };
        });

      const seenAttrNames = new Set(
        customExistingAttrs.map((ca: any) => (ca.attributeName || "").toLowerCase().trim())
      );
      allVariantAttrs.forEach((va: any) => {
        const name = (va.productAttribute?.attributeName || "").trim();
        const lower = name.toLowerCase();
        if (name && !["colour", "color", "size", "gender", "marketplace"].includes(lower) && !seenAttrNames.has(lower)) {
          seenAttrNames.add(lower);
          const val = (va.attributeValue || "").trim();
          customExistingAttrs.push({
            id: va.productAttributeId || undefined,
            attributeName: name,
            attributeValue: val,
          });
        }
      });

      const customAttrsKey = customExistingAttrs
        .map((ca: any) => `${ca.attributeName}:${ca.attributeValue}`)
        .join("|");

      const syncKey = `${activeProduct.id}-${activeProduct.masterSku || ""}-${Boolean(singleProductResponse?.data)}-${'\n'}        uniqueVariants.length${'\n'}      }-${initialColors.join(",")}-${initialSizeList}-${initialGender}-${initialMarketplace.join(",")}-${initialReferenceParty}-${initialProductCost}-${initialMrp}-${customAttrsKey}`;

      if (lastSyncedKeyRef.current === syncKey) return;
      lastSyncedKeyRef.current = syncKey;

      reset({
        productName: activeProduct.productName || "",
        masterSku: activeProduct.masterSku || "",
        sku: initialSku,
        marketplace: initialMarketplace,
        brand: activeProduct.brand || "No Brand",
        category: existingCategory,
        subCategory: activeProduct.subCategory || "",
        unit: activeProduct.unit || "Pcs",
        sizeList: initialSizeList,
        colors: initialColors,
        gender: initialGender,
        referenceParty: initialReferenceParty,
        description: activeProduct.description ?? "",
        asin: activeProduct.asin ?? "",
        myntraSku: (activeProduct as any).myntraSku ?? "",
        fsnCode: (activeProduct as any).fsnCode ?? "",
        rackAddress: initialRackAddress,
        generateBarcode: activeProduct.generateBarcode ?? "No",
        mrp: initialMrp,
        mfgMonth: activeProduct.mfgMonth ?? "",
        hsnCode: activeProduct.hsnCode ?? "",
        gstRate: activeProduct.gstRate ?? 5,

        // Kardex
        productCost: initialProductCost,
        dealerRate: initialDealerRate,
        retailRate: initialRetailRate,
        openingStock: initialOpeningStock,
        reorderLevelStock: initialReorderLevel,
        minimumStock: initialMinimumStock,
        productPoints: initialProductPoints,
        isPaired: initialIsPaired,
        availability: initialAvailability,

        isActive: activeProduct.isActive ?? true,
        attributes: customExistingAttrs,
      });
    } else if (mode === "create") {
      if (!lastSyncedKeyRef.current) {
        lastSyncedKeyRef.current = "create-initialized";
        reset(defaultValues);
      }
    }
  }, [mode, product, reset, singleProductResponse, variantsResponse, dynamicColors]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const activeProduct = singleProductResponse?.data ?? product;
      const existingAttrs = (activeProduct?.attributes || product?.attributes || []) as any[];

      // Match existing attribute IDs to avoid "Invalid attribute payload. Existing attribute ids are missing"
      const existingColorAttr = existingAttrs.find((a: any) =>
        ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim())
      );
      const existingSizeAttr = existingAttrs.find((a: any) =>
        ["size"].includes((a.attributeName || "").toLowerCase().trim())
      );
      const existingGenderAttr = existingAttrs.find((a: any) =>
        ["gender"].includes((a.attributeName || "").toLowerCase().trim())
      );

      const combinedAttributes: { id?: string; attributeName: string; attributeValue?: string }[] = [];
      const seenNames = new Set<string>();

      // 1. Colour (Preset attribute)
      const colorVal = (values.colors || []).join(", ").trim();
      const colorName = existingColorAttr?.attributeName || "Colour";
      if (colorVal || existingColorAttr?.id) {
        combinedAttributes.push({
          ...(existingColorAttr?.id ? { id: existingColorAttr.id } : {}),
          attributeName: colorName,
          attributeValue: colorVal,
        });
        seenNames.add("colour");
        seenNames.add("color");
      }

      // 2. Size (Preset attribute)
      const sizeVal = (values.sizeList || "").trim();
      const sizeName = existingSizeAttr?.attributeName || "Size";
      if (sizeVal || existingSizeAttr?.id) {
        combinedAttributes.push({
          ...(existingSizeAttr?.id ? { id: existingSizeAttr.id } : {}),
          attributeName: sizeName,
          attributeValue: sizeVal,
        });
        seenNames.add("size");
      }

      // 3. Gender (Preset attribute)
      const genderVal = (values.gender || "").trim();
      const genderName = existingGenderAttr?.attributeName || "Gender";
      if (genderVal || existingGenderAttr?.id) {
        combinedAttributes.push({
          ...(existingGenderAttr?.id ? { id: existingGenderAttr.id } : {}),
          attributeName: genderName,
          attributeValue: genderVal,
        });
        seenNames.add("gender");
      }

      // 4. Custom dynamic attributes from values.attributes
      for (const ca of values.attributes || []) {
        const name = (ca.attributeName || "").trim();
        const lower = name.toLowerCase();
        if (!name || seenNames.has(lower)) continue;
        seenNames.add(lower);
        combinedAttributes.push({
          ...(ca.id ? { id: ca.id } : {}),
          attributeName: name,
          attributeValue: (ca.attributeValue || "").trim(),
        });
      }

      // 5. Retain any other existing attributes so backend doesn't delete them and fail foreign keys
      for (const ea of existingAttrs) {
        const lower = (ea.attributeName || "").toLowerCase().trim();
        if (!lower || seenNames.has(lower)) continue;
        seenNames.add(lower);
        combinedAttributes.push({
          id: ea.id,
          attributeName: ea.attributeName.trim(),
          attributeValue: ea.attributeValue || "",
        });
      }

      const sanitizedPayload = {
        ...values,
        marketplace: Array.isArray(values.marketplace)
          ? values.marketplace
          : typeof (values.marketplace as any) === "string" && (values.marketplace as any).trim()
          ? (values.marketplace as any).split(",").map((s: string) => s.trim()).filter(Boolean)
          : ["All"],
        productName: values.productName.trim(),
        masterSku: values.masterSku.trim(),
        sku: values.sku ? values.sku.trim() : values.masterSku.trim(),
        brand: values.brand ? values.brand.trim() : "No Brand",
        category: values.category.trim(),
        subCategory: values.subCategory ? values.subCategory.trim() : "",
        unit: values.unit ? values.unit.trim() : "Pcs",
        sizeList: values.sizeList ? values.sizeList.trim() : "",
        colors: values.colors || [],
        gender: values.gender ? values.gender.trim() : "",
        referenceParty: values.referenceParty ? values.referenceParty.trim() : "",
        description: values.description ? values.description.trim() : "",
        asin: values.asin ? values.asin.trim() : "",
        myntraSku: (values as any).myntraSku ? (values as any).myntraSku.trim() : "",
        fsnCode: (values as any).fsnCode ? (values as any).fsnCode.trim() : "",
        rackAddress: values.rackAddress ? values.rackAddress.trim() : "",
        hsnCode: values.hsnCode ? values.hsnCode.trim() : "",
        mrp: values.mrp !== undefined && values.mrp !== null ? String(values.mrp).trim() : "0",
        gstRate: Number(values.gstRate) || 0,
        productCost: Number(values.productCost) || 0,
        dealerRate: Number(values.dealerRate) || 0,
        retailRate: Number(values.retailRate) || 0,
        openingStock: Number(values.openingStock) || 0,
        reorderLevelStock: Number(values.reorderLevelStock) || 0,
        minimumStock: Number(values.minimumStock) || 0,
        productPoints: Number(values.productPoints) || 1,
        isPaired: Boolean(values.isPaired),
        availability: values.availability || "Public",
        attributes: combinedAttributes,
      };

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ?? ""
          : "";

      if (mode === "create") {
        setIsSubmittingVariants(true);
        const createRes: any = await createProductMutation.mutateAsync(sanitizedPayload as any);
        const createdProduct = createRes?.data;

        if (createdProduct?.id && (values.colors?.length > 0 || values.sizeList?.trim())) {
          const freshVariants = createdProduct.variants || [];
          if (freshVariants.length === 0) {
            const createdAttrs = createdProduct.attributes || [];
            const colorAttr = createdAttrs.find((a: any) =>
              ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim())
            );
            const sizeAttr = createdAttrs.find((a: any) =>
              ["size"].includes((a.attributeName || "").toLowerCase().trim())
            );
            const genderAttr = createdAttrs.find((a: any) =>
              ["gender"].includes((a.attributeName || "").toLowerCase().trim())
            );

            const colorId = colorAttr?.id;
            const sizeId = sizeAttr?.id;
            const genderId = genderAttr?.id;

            const sizeParts = values.sizeList
              ? values.sizeList.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            const colorParts = values.colors || [];
            const genderVal = values.gender ? values.gender.trim() : "";

            const otherAttrs = createdAttrs
              .filter((a: any) => {
                const aId = a.id;
                return aId && aId !== colorId && aId !== sizeId && aId !== genderId && a.attributeValue;
              })
              .map((a: any) => ({
                productAttributeId: a.id,
                attributeValue: String(a.attributeValue).trim(),
              }))
              .filter((a: any) => Boolean(a.attributeValue));

            // Generate Cartesian combinations: ALL sizes for ALL colors!
            const effectiveColors = colorParts.length > 0 ? colorParts : [undefined];
            const effectiveSizes = sizeParts.length > 0 ? sizeParts : [undefined];

            const targetCombinations: {
              skuParts: string[];
              attributeList: { productAttributeId: string; attributeValue: string }[];
            }[] = [];

            for (const col of effectiveColors) {
              for (const sz of effectiveSizes) {
                const skuParts: string[] = [];
                const attributeList: { productAttributeId: string; attributeValue: string }[] = [];

                if (col && colorId) {
                  attributeList.push({ productAttributeId: colorId, attributeValue: col });
                  skuParts.push(col);
                }
                if (sz && sizeId) {
                  attributeList.push({ productAttributeId: sizeId, attributeValue: sz });
                  skuParts.push(sz);
                }
                if (genderVal && genderId) {
                  attributeList.push({ productAttributeId: genderId, attributeValue: genderVal });
                }
                attributeList.push(...otherAttrs);

                targetCombinations.push({
                  skuParts,
                  attributeList,
                });
              }
            }

            const masterSku = sanitizedPayload.masterSku;

            const createPromises = targetCombinations.map((combo) => {
              const targetVariantSku =
                combo.skuParts.length > 0 && masterSku
                  ? `${masterSku}-${combo.skuParts.join("-")}`
                  : masterSku;

              return productVariantService
                .create(
                  {
                    productId: createdProduct.id,
                    variantSku: targetVariantSku,
                    asin: sanitizedPayload.asin || undefined,
                    myntraSku: (sanitizedPayload as any).myntraSku || undefined,
                    fsnCode: (sanitizedPayload as any).fsnCode || undefined,
                    rackAddress: sanitizedPayload.rackAddress || undefined,
                    isActive: sanitizedPayload.isActive ?? true,
                    attributes: combo.attributeList,
                  },
                  token
                )
                .catch((e) => console.error("Initial variant create error:", e));
            });

            await Promise.race([
              Promise.allSettled(createPromises),
              new Promise((res) => setTimeout(res, 2000)),
            ]);
          }
        }
      } else if (product) {
        setIsSubmittingVariants(true);
        const updateRes: any = await updateProductMutation.mutateAsync({
          id: product.id,
          data: sanitizedPayload as any,
        });

        // Check if backend already handled and returned variants
        const activeUpdatedProduct = updateRes?.data ?? activeProduct;
        const freshVariants = Array.isArray(activeUpdatedProduct?.variants)
          ? activeUpdatedProduct.variants
          : [];

        const sizeParts = values.sizeList
          ? values.sizeList.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const colorParts = values.colors || [];
        const expectedVariantCount = Math.max(1, (colorParts.length || 1) * (sizeParts.length || 1));

        const backendAlreadyHandled =
          freshVariants.length >= expectedVariantCount &&
          (colorParts.length === 0 ||
            colorParts.every((c) =>
              freshVariants.some((v: any) =>
                (v.attributes || []).some(
                  (a: any) => a.attributeValue?.trim().toLowerCase() === c.trim().toLowerCase()
                )
              )
            ));

        if (!backendAlreadyHandled) {
          try {
            const freshAttrs = (activeUpdatedProduct?.attributes || combinedAttributes) as any[];

            const colorAttr = freshAttrs.find((a: any) =>
              ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim())
            );
            const sizeAttr = freshAttrs.find((a: any) =>
              ["size"].includes((a.attributeName || "").toLowerCase().trim())
            );
            const genderAttr = freshAttrs.find((a: any) =>
              ["gender"].includes((a.attributeName || "").toLowerCase().trim())
            );

            const colorId = colorAttr?.id || existingColorAttr?.id;
            const sizeId = sizeAttr?.id || existingSizeAttr?.id;
            const genderId = genderAttr?.id || existingGenderAttr?.id;

            const allChildVariants = [
              ...freshVariants,
              ...(Array.isArray(product.variants) ? product.variants : []),
              ...(Array.isArray(variantsResponse?.data) ? variantsResponse.data : []),
            ];

            const uniqueVarMap = new Map<string, any>();
            allChildVariants.forEach((v) => {
              if (v?.id && !uniqueVarMap.has(v.id)) {
                uniqueVarMap.set(v.id, v);
              }
            });
            const childVars = Array.from(uniqueVarMap.values());

            const genderVal = values.gender ? values.gender.trim() : "";

            const otherAttrs = freshAttrs
              .filter((a: any) => {
                const aId = a.id;
                return aId && aId !== colorId && aId !== sizeId && aId !== genderId && a.attributeValue;
              })
              .map((a: any) => ({
                productAttributeId: a.id,
                attributeValue: String(a.attributeValue).trim(),
              }))
              .filter((a: any) => Boolean(a.attributeValue));

            const effectiveColors = colorParts.length > 0 ? colorParts : [undefined];
            const effectiveSizes = sizeParts.length > 0 ? sizeParts : [undefined];

            const targetCombinations: {
              color?: string;
              size?: string;
              skuParts: string[];
              attributeList: { productAttributeId: string; attributeValue: string }[];
            }[] = [];

            for (const col of effectiveColors) {
              for (const sz of effectiveSizes) {
                const skuParts: string[] = [];
                const attributeList: { productAttributeId: string; attributeValue: string }[] = [];

                if (col && colorId) {
                  attributeList.push({ productAttributeId: colorId, attributeValue: col });
                  skuParts.push(col);
                }
                if (sz && sizeId) {
                  attributeList.push({ productAttributeId: sizeId, attributeValue: sz });
                  skuParts.push(sz);
                }
                if (genderVal && genderId) {
                  attributeList.push({ productAttributeId: genderId, attributeValue: genderVal });
                }
                attributeList.push(...otherAttrs);

                targetCombinations.push({
                  color: col,
                  size: sz,
                  skuParts,
                  attributeList,
                });
              }
            }

            const masterSku = (values.masterSku || product.masterSku || "").trim();
            const matchedVariantIds = new Set<string>();
            const usedComboIndices = new Set<number>();
            const syncPromises: Promise<any>[] = [];

            // Pass 1: Match existing child variants that have the exact same color and size
            for (let cIdx = 0; cIdx < targetCombinations.length; cIdx++) {
              const combo = targetCombinations[cIdx];
              const matched = childVars.find((v) => {
                if (!v?.id || matchedVariantIds.has(v.id)) return false;
                const vAttrs = v.attributes || [];
                const vCol = vAttrs.find((a: any) => {
                  const aId = a.productAttributeId || a.productAttribute?.id;
                  return aId === colorId;
                })?.attributeValue?.trim().toLowerCase();
                const vSz = vAttrs.find((a: any) => {
                  const aId = a.productAttributeId || a.productAttribute?.id;
                  return aId === sizeId;
                })?.attributeValue?.trim().toLowerCase();

                const targetCol = combo.color ? combo.color.trim().toLowerCase() : undefined;
                const targetSz = combo.size ? combo.size.trim().toLowerCase() : undefined;

                return vCol === targetCol && vSz === targetSz;
              });

              if (matched) {
                matchedVariantIds.add(matched.id);
                usedComboIndices.add(cIdx);

                const targetVariantSku =
                  combo.skuParts.length > 0 && masterSku
                    ? `${masterSku}-${combo.skuParts.join("-")}`
                    : masterSku;

                syncPromises.push(
                  productVariantService
                    .update(
                      matched.id,
                      {
                        variantSku: targetVariantSku,
                        attributes: combo.attributeList,
                        rackAddress: values.rackAddress || undefined,
                        asin: values.asin || undefined,
                      myntraSku: (values as any).myntraSku || undefined,
                      fsnCode: (values as any).fsnCode || undefined,


  
  


  
  


  
  
                      },
                      token
                    )
                    .catch((err) => console.warn("Update matched variant warning:", err))
                );
              }
            }

            // Pass 2: Reuse unmatched existing variants for remaining combos
            const remainingComboIndices = targetCombinations
              .map((_, idx) => idx)
              .filter((idx) => !usedComboIndices.has(idx));

            const unmatchedVariants = childVars.filter((v) => v?.id && !matchedVariantIds.has(v.id));

            for (let i = 0; i < Math.min(remainingComboIndices.length, unmatchedVariants.length); i++) {
              const combo = targetCombinations[remainingComboIndices[i]];
              const variant = unmatchedVariants[i];

              matchedVariantIds.add(variant.id);
              usedComboIndices.add(remainingComboIndices[i]);

              const targetVariantSku =
                combo.skuParts.length > 0 && masterSku
                  ? `${masterSku}-${combo.skuParts.join("-")}`
                  : masterSku;

              syncPromises.push(
                productVariantService
                  .update(
                    variant.id,
                    {
                      variantSku: targetVariantSku,
                      attributes: combo.attributeList,
                      rackAddress: values.rackAddress || undefined,
                      asin: values.asin || undefined,
                      myntraSku: (values as any).myntraSku || undefined,
                      fsnCode: (values as any).fsnCode || undefined,






                    },
                    token
                  )
                  .catch((err) => console.warn("Update unmatched variant warning:", err))
              );
            }

            // Pass 3: Create missing combination variants
            const stillUnusedComboIndices = targetCombinations
              .map((_, idx) => idx)
              .filter((idx) => !usedComboIndices.has(idx));

            for (const cIdx of stillUnusedComboIndices) {
              const combo = targetCombinations[cIdx];
              const targetVariantSku =
                combo.skuParts.length > 0 && masterSku
                  ? `${masterSku}-${combo.skuParts.join("-")}`
                  : masterSku;

              syncPromises.push(
                productVariantService
                  .create(
                    {
                      productId: product.id,
                      variantSku: targetVariantSku,
                      asin: values.asin || undefined,
                      myntraSku: (values as any).myntraSku || undefined,
                      fsnCode: (values as any).fsnCode || undefined,






                      rackAddress: values.rackAddress || undefined,
                      isActive: values.isActive ?? true,
                      attributes: combo.attributeList,
                    },
                    token
                  )
                  .catch((err) => console.warn("Create new combination variant warning:", err))
              );
            }

            if (syncPromises.length > 0) {
              await Promise.race([
                Promise.allSettled(syncPromises),
                new Promise((res) => setTimeout(res, 2000)),
              ]);
            }
          } catch (variantSyncErr) {
            console.warn("Child variants sync non-fatal error:", variantSyncErr);
          }
        }
      }

      const activeId = product?.id;
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: ["product-variants", activeId] });
        queryClient.invalidateQueries({ queryKey: ["product", activeId] });
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });

      setIsSubmittingVariants(false);
      onSuccess();
    } catch (error: any) {
      console.error("Failed to submit product:", error);
      const friendlyMessage = getFriendlyErrorMessage(
        error,
        mode === "create" ? "Failed to create product" : "Failed to update product"
      );
      toast.error(friendlyMessage);
    } finally {
      setIsSubmittingVariants(false);
    }
  };

  useEffect(() => {
    onLoadingChange?.(
      form.formState.isSubmitting ||
        createProductMutation.isPending ||
        updateProductMutation.isPending ||
        isSubmittingVariants
    );
  }, [
    form.formState.isSubmitting,
    createProductMutation.isPending,
    updateProductMutation.isPending,
    isSubmittingVariants,
    onLoadingChange,
  ]);

  return (
    <form
      id="product-form"
      onSubmit={handleSubmit(onSubmit, (validationErrors) => {
        console.error("Form validation errors on submit:", validationErrors);
        const errorKeys = Object.keys(validationErrors);
        if (errorKeys.length > 0) {
          const firstKey = errorKeys[0];
          const errObj = (validationErrors as any)[firstKey];
          const msg = errObj?.message || `Please check field "${firstKey}"`;
          toast.error(msg);

          const kardexFieldNames = [
            "mrp",
            "retailRate",
            "dealerRate",
            "productCost",
            "openingStock",
            "reorderLevelStock",
            "minimumStock",
            "productPoints",
            "availability",
            "isPaired",
          ];
          if (kardexFieldNames.includes(firstKey)) {
            setActiveTab("kardex");
          } else {
            setActiveTab("general");
          }
        }
      })}
      className="space-y-6 py-2 px-1 text-slate-900 dark:text-white"
    >
      {/* Centered Tab Switcher: General & Kardex */}
      <ProductTabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ============================================================ */}
      {/* GENERAL TAB CONTENT (Matching Image 2: Add Product)          */}
      {/* ============================================================ */}
      {activeTab === "general" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                General Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Specify the primary product identification, classification, and tax details.
              </p>
            </div>

            <div className="w-full sm:w-72 md:w-80 lg:w-96 shrink-0">
              <Controller
                name="marketplace"
                control={control}
                render={({ field }) => (
                  <MarketplaceMultiSelect
                    label="Marketplace"
                    value={field.value || ["All"]}
                    options={marketplaceOptions}
                    onChange={field.onChange}
                    placeholder="Select Marketplace..."
                    error={errors.marketplace?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Row 1: SKU * | Master SKU * | Name * */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val);
                      setValue("masterSku", val, { shouldValidate: true, shouldDirty: true });
                    }}
                    placeholder="Enter SKU..."
                    className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                  />
                  {errors.sku && <p className="text-[11px] text-rose-500">{errors.sku.message}</p>}
                </div>
              )}
            />

            <Controller
              name="masterSku"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    Master SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...field}
                    placeholder="e.g. POLO-5244"
                    className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                  />
                  {errors.masterSku && (
                    <p className="text-[11px] text-rose-500">{errors.masterSku.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              name="productName"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...field}
                    placeholder="e.g. Jacquard Polo Magenta"
                    className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                  />
                  {errors.productName && (
                    <p className="text-[11px] text-rose-500">{errors.productName.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Row 2: Category * | Unit | HSN Code * */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Category"
                  required
                  value={field.value || ""}
                  options={categoryOptions}
                  onChange={field.onChange}
                  placeholder="Select Category..."
                  fieldKey="category"
                  error={errors.category?.message}
                />
              )}
            />

            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Unit"
                  value={field.value || "Pcs"}
                  options={unitOptions}
                  onChange={field.onChange}
                  placeholder="Select Unit..."
                  fieldKey="unit"
                  error={errors.unit?.message}
                />
              )}
            />

            <Controller
              name="hsnCode"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    HSN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. 61091000"
                    className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                  />
                  {errors.hsnCode && (
                    <p className="text-[11px] text-rose-500">{errors.hsnCode.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* ============================================================ */}
          {/* PRODUCT ATTRIBUTES SECTION (Dynamic according to Category)   */}
          {/* ============================================================ */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/60 dark:border-white/[0.05]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/20 shadow-2xs">
                      <Tags className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                          Product Attributes
                        </h4>
                        {watchedCategory && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-[#F5C451]/10 dark:text-[#F5C451] dark:border-[#F5C451]/20">
                            {watchedCategory}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Attribute options tailored for {watchedCategory ? `"${watchedCategory}"` : "this category"} to keep complete product records.
                      </p>
                    </div>
                  </div>

                  {/* Attribute Action Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {/* Add Attribute Button */}
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          attributeName: "",
                          attributeValue: "",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-[#FFF9EC] text-[#0A0E1A] border border-[#E8C16D] hover:bg-[#FFF3D6] ring-1 ring-[#E8C16D]/30 active:scale-[0.98] transition-all cursor-pointer dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/40 dark:hover:bg-[#F5C451]/25 shrink-0 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Attribute</span>
                    </button>
                  </div>
                </div>

                {/* Core Preset Attribute Grid (Only shows the ones that apply to this category) */}
                {(categoryConfig.hasColors || categoryConfig.hasGender || categoryConfig.hasSizeList) && (
                  <div
                    className={cn(
                      "grid gap-4",
                      categoryConfig.hasColors && categoryConfig.hasGender && categoryConfig.hasSizeList
                        ? "grid-cols-1 md:grid-cols-3"
                        : (Number(categoryConfig.hasColors) + Number(categoryConfig.hasGender) + Number(categoryConfig.hasSizeList) === 2)
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1"
                    )}
                  >
                    {/* 1. Colors */}
                    {categoryConfig.hasColors && (
                      <Controller
                        name="colors"
                        control={control}
                        render={({ field }) => (
                          <ColorMultiSelect
                            label={categoryConfig.colorsLabel || "Colors"}
                            value={field.value || []}
                            onChange={field.onChange}
                            additionalColors={dynamicColors}
                            error={errors.colors?.message}
                          />
                        )}
                      />
                    )}

                    {/* 2. Gender */}
                    {categoryConfig.hasGender && (
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                          <DropdownWithOther
                            label={categoryConfig.genderLabel || "Gender"}
                            value={field.value || ""}
                            options={genderOptions}
                            onChange={field.onChange}
                            placeholder="Select Gender..."
                            fieldKey="gender"
                            error={errors.gender?.message}
                          />
                        )}
                      />
                    )}

                    {/* 3. Size List (Not required) */}
                    {categoryConfig.hasSizeList && (
                      <Controller
                        name="sizeList"
                        control={control}
                        render={({ field }) => (
                          <SizeMultiSelect
                            label={categoryConfig.sizeLabel || "Size List"}
                            required={false}
                            value={field.value || ""}
                            onChange={field.onChange}
                            additionalSizes={
                              categoryConfig.sizeLabel.toLowerCase().includes("shoe")
                                ? defaultShoeSizes
                                : defaultNumericSizes
                            }
                            error={errors.sizeList?.message}
                          />
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Added Custom Attributes (Field & Value option with save and delete buttons) */}
                {fields.map((fieldItem, index) => {
                  const currentName = fieldItem.attributeName || "";
                  const dynamicPlaceholder = getAttributePlaceholder(currentName);

                  return (
                    <div
                      key={fieldItem.id}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_44px] items-end gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-[#0B0F17]/60 border border-slate-200/80 dark:border-white/[0.08]"
                    >
                      {/* Attribute Name (Field) */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          Attribute Name
                        </label>
                        <Controller
                          control={control}
                          name={`attributes.${index}.attributeName`}
                          render={({ field }) => (
                            <input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="e.g. Storage, RAM, Material, Weight..."
                              className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                            />
                          )}
                        />
                        {errors.attributes?.[index]?.attributeName && (
                          <p className="text-[11px] text-rose-500">
                            {errors.attributes[index]?.attributeName?.message}
                          </p>
                        )}
                      </div>

                      {/* Attribute Value (Value) */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          Attribute Value
                        </label>
                        <Controller
                          control={control}
                          name={`attributes.${index}.attributeValue`}
                          render={({ field }) => (
                            <input
                              {...field}
                              value={field.value ?? ""}
                              placeholder={dynamicPlaceholder}
                              className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                            />
                          )}
                        />
                        {errors.attributes?.[index]?.attributeValue && (
                          <p className="text-[11px] text-rose-500">
                            {errors.attributes[index]?.attributeValue?.message}
                          </p>
                        )}
                      </div>

                      {/* Delete Button */}
                      <div className="flex items-center justify-end sm:justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const currentAttr = getValues(`attributes.${index}`);
                            const name = currentAttr?.attributeName || fieldItem.attributeName || "Attribute";
                            setDeleteAttrIndex(index);
                            setDeleteAttrName(name);
                          }}
                          title="Remove attribute"
                          className="h-11 sm:h-12 w-full sm:w-11 flex items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/60 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer shadow-xs"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sm:hidden text-xs font-semibold ml-1.5 text-rose-600 dark:text-rose-400">Remove Attribute</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {allSuggestedAttributes.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#0B0F17]/50 border border-slate-200/60 dark:border-white/[0.05]">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#B88728] dark:text-[#F5C451]" />
                    Add {watchedCategory || "Category"} Attributes:
                  </span>
                  {allSuggestedAttributes.map((attrName) => {
                    const isAdded = fields.some(
                      (f) => f.attributeName?.trim().toLowerCase() === attrName.toLowerCase()
                    );
                    return (
                      <button
                        key={attrName}
                        type="button"
                        onClick={() => {
                          if (!isAdded) {
                            append({
                              attributeName: attrName,
                              attributeValue: "",
                            });
                            toast.success(`Added "${attrName}" attribute`);
                          }
                        }}
                        disabled={isAdded}
                        title={isAdded ? `"${attrName}" already added` : `Add "${attrName}"`}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shadow-2xs",
                          isAdded
                            ? "bg-slate-100 text-slate-400 dark:bg-white/[0.04] dark:text-slate-500 cursor-not-allowed border border-transparent"
                            : "bg-white text-slate-700 border border-slate-200 hover:border-[#E8C16D] hover:bg-[#FFF9EC] hover:text-[#0A0E1A] dark:bg-[#0B0F17] dark:text-slate-200 dark:border-white/[0.08] dark:hover:border-[#F5C451]/50 dark:hover:bg-[#F5C451]/10 dark:hover:text-[#F5C451] cursor-pointer active:scale-95"
                        )}
                      >
                        {isAdded ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Plus className="w-3 h-3 text-[#B88728] dark:text-[#F5C451]" />
                        )}
                        <span>{attrName}</span>
                      </button>
                    );
                  })}
                </div>
              )}

          {/* Row 4: GST (%) | MRP | Brand Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="gstRate"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="GST (%)"
                  value={field.value !== undefined ? String(field.value) : "5"}
                  options={gstRateOptions}
                  onChange={(val) => field.onChange(Number(val) || 0)}
                  placeholder="Select GST %..."
                  fieldKey="gstrate"
                  error={errors.gstRate?.message}
                />
              )}
            />

            <Controller
              name="mrp"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    MRP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="0.00"
                    className={`w-full min-h-[44px] sm:min-h-[48px] px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border ${
                      errors.mrp ? "border-rose-500" : "border-slate-200 dark:border-white/[0.08]"
                    } bg-white dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs`}
                  />
                  {errors.mrp && <p className="text-[11px] text-rose-500 font-medium">{errors.mrp.message}</p>}
                </div>
              )}
            />

            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Brand Name"
                  value={field.value || "No Brand"}
                  options={brandOptions}
                  onChange={field.onChange}
                  placeholder="Select Brand..."
                  fieldKey="brand"
                  error={errors.brand?.message}
                />
              )}
            />
          </div>

          {/* Row 5: Description ( key points ) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
              Description ( key points )
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Describe product key points."
                  className="w-full p-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 resize-none shadow-xs"
                />
              )}
            />
            {errors.description && (
              <p className="text-[11px] text-rose-500">{errors.description.message}</p>
            )}
          </div>

          {/* Row 6: Reference Party * */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="referenceParty"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Reference Party"
                  value={field.value || ""}
                  options={referencePartyOptions}
                  onChange={field.onChange}
                  placeholder="Select Reference Party..."
                  fieldKey="referenceparty"
                  error={errors.referenceParty?.message}
                />
              )}
            />

            {/* Product Status Switch */}
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <div className="flex h-11 sm:h-12 items-center justify-between px-4 mt-6 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-white/[0.08] dark:bg-[#0B0F17] shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-[#0A0E1A] dark:text-white">
                      Active Status
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Available across all channels</p>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* KARDEX TAB CONTENT (Matching Image 1: Product Profile)       */}
      {/* ============================================================ */}
      {activeTab === "kardex" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Kardex Details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage inventory levels, purchase/sales pricing, worker incentives, and warehouse rack location.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Column 1 */}
            <div className="space-y-4">
              {/* Product Cost */}
              <Controller
                name="productCost"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      Product Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                    />
                    {errors.productCost && (
                      <p className="text-[11px] text-rose-500">{errors.productCost.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Dealer Rate */}
              <Controller
                name="dealerRate"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      Dealer Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                    />
                    {errors.dealerRate && (
                      <p className="text-[11px] text-rose-500">{errors.dealerRate.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Opening Stock */}
              <Controller
                name="openingStock"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      Opening Stock
                    </label>
                    <input
                      type="number"
                      step="1"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                    />
                    {errors.openingStock && (
                      <p className="text-[11px] text-rose-500">{errors.openingStock.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Minimum Stock */}
              <Controller
                name="minimumStock"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      Minimum Stock
                    </label>
                    <input
                      type="number"
                      step="1"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                    />
                    {errors.minimumStock && (
                      <p className="text-[11px] text-rose-500">{errors.minimumStock.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Product Points (for worker incentive) */}
              <Controller
                name="productPoints"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5 p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-white/[0.08] dark:bg-[#0B0F17] shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                          Product Points
                        </label>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">for worker incentive</p>
                      </div>
                      <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2 rounded-lg bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#F5C451]/20 dark:text-[#F5C451] dark:border-[#F5C451]/30 text-xs font-bold">
                        {field.value ?? 1}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={field.value ?? 1}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="w-full accent-[#B88728] dark:accent-[#F5C451] cursor-pointer mt-1"
                    />
                  </div>
                )}
              />
            </div>

            {/* Column 2 */}
            <div className="space-y-4">

              {/* Retail Rate */}
              <Controller
                name="retailRate"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      Retail Rate
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs pr-10"
                      />
                      <span className="absolute right-3.5 text-[#B88728] dark:text-[#F5C451] text-xs font-bold pointer-events-none">
                        <ListFilter size={16} />
                      </span>
                    </div>
                    {errors.retailRate && (
                      <p className="text-[11px] text-rose-500">{errors.retailRate.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Re-Order Level Stock */}
              <Controller
                name="reorderLevelStock"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      Re-Order Level Stock
                    </label>
                    <input
                      type="number"
                      step="1"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs"
                    />
                    {errors.reorderLevelStock && (
                      <p className="text-[11px] text-rose-500">{errors.reorderLevelStock.message}</p>
                    )}
                  </div>
                )}
              />

              {/* Rack Address */}
              <Controller
                name="rackAddress"
                control={control}
                render={({ field }) => (
                  <DropdownWithOther
                    label="Rack Address"
                    value={field.value || ""}
                    options={rackOptions}
                    onChange={field.onChange}
                    placeholder="Select Racks..."
                    fieldKey="rackaddress"
                    error={errors.rackAddress?.message}
                  />
                )}
              />

              {/* Is Paired */}
              <Controller
                name="isPaired"
                control={control}
                render={({ field }) => (
                  <div className="flex h-[72px] items-center justify-between px-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-white/[0.08] dark:bg-[#0B0F17] shadow-xs">
                    <div>
                      <span className="text-xs font-bold text-[#0A0E1A] dark:text-white">
                        Is Paired
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Enable if product is in paired</p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                )}
              />

              {/* Availability * */}
              <Controller
                name="availability"
                control={control}
                render={({ field }) => (
                  <DropdownWithOther
                    label="Availability"
                    required
                    value={field.value || "Public"}
                    options={availabilityOptions}
                    onChange={field.onChange}
                    placeholder="Select Availability..."
                    fieldKey="availability"
                    error={errors.availability?.message}
                  />
                )}
              />
            </div>
          </div>
        </div>
      )}

      <DeleteAttributeModal
        open={deleteAttrIndex !== null}
        attributeName={deleteAttrName}
        onClose={() => {
          setDeleteAttrIndex(null);
          setDeleteAttrName("");
        }}
        onConfirm={confirmDeleteAttribute}
      />
    </form>
  );
}
