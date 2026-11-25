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
  ChevronDown,
  X,
  Warehouse as WarehouseIcon,
  Trash2,
  Tags,
  Plus,
} from "lucide-react";

import type { Product } from "../types/product.types";
import { useWarehouses } from "@/components/Dashboard/Warehouse/hooks/useWarehouse";
import {
  productCategoryOptions,
  getCategoryAttributeConfig,
  getAttributePlaceholder,
  defaultShoeSizes,
  defaultNumericSizes,
  sortSizes,
  getSizeRank,
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
import GenderMultiSelect from "./GenderMultiSelect";
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
  gender: [],
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

  // Cost & MRP state for each variant
  const [variantPricing, setVariantPricing] = useState<
    Record<string, { cost: number | string; mrp: number | string; id?: string }>
  >({});

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

  const watchedColors = watch("colors") || [];
  const watchedSizeList = watch("sizeList") || "";
  const watchedMasterSku = watch("masterSku") || "";
  const watchedMrp = watch("mrp");
  const watchedProductCost = watch("productCost");
  const watchedGender = watch("gender");

  // Warehouses Multi-Select & Per-Warehouse Stock State
  const { data: warehousesResponse } = useWarehouses();
  const availableWarehouses = useMemo(
    () => (warehousesResponse?.data || []).filter((w) => w.isActive !== false),
    [warehousesResponse]
  );
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>([]);
  const [warehouseAllocations, setWarehouseAllocations] = useState<
    Record<
      string,
      {
        openingStock: number | "";
        reorderLevelStock: number | "";
        minimumStock: number | "";
      }
    >
  >({});
  const [warehouseDropdownOpen, setWarehouseDropdownOpen] = useState(false);
  const warehouseDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!warehouseDropdownOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        warehouseDropdownRef.current &&
        !warehouseDropdownRef.current.contains(e.target as Node)
      ) {
        setWarehouseDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [warehouseDropdownOpen]);

  const syncStockTotalsFromWarehouses = (
    ids: string[],
    allocs: Record<
      string,
      {
        openingStock: number | "";
        reorderLevelStock: number | "";
        minimumStock: number | "";
      }
    >
  ) => {
    if (ids.length === 0) return;
    const totalOpening = ids.reduce(
      (sum, id) => sum + (Number(allocs[id]?.openingStock) || 0),
      0
    );
    const totalReorder = ids.reduce(
      (sum, id) => sum + (Number(allocs[id]?.reorderLevelStock) || 0),
      0
    );
    const totalMin = ids.reduce(
      (sum, id) => sum + (Number(allocs[id]?.minimumStock) || 0),
      0
    );
    setValue("openingStock", totalOpening);
    setValue("reorderLevelStock", totalReorder);
    setValue("minimumStock", totalMin);
  };

  const toggleWarehouseSelection = (warehouseId: string) => {
    const exists = selectedWarehouseIds.includes(warehouseId);
    const nextIds = exists
      ? selectedWarehouseIds.filter((id) => id !== warehouseId)
      : [...selectedWarehouseIds, warehouseId];

    const nextAllocs = { ...warehouseAllocations };
    if (!exists && !nextAllocs[warehouseId]) {
      nextAllocs[warehouseId] = {
        openingStock: Number(watch("openingStock")) || 0,
        reorderLevelStock: Number(watch("reorderLevelStock")) || 0,
        minimumStock: Number(watch("minimumStock")) || 0,
      };
    }
    setSelectedWarehouseIds(nextIds);
    setWarehouseAllocations(nextAllocs);
    syncStockTotalsFromWarehouses(nextIds, nextAllocs);
  };

  const updateWarehouseStockField = (
    warehouseId: string,
    field: "openingStock" | "reorderLevelStock" | "minimumStock",
    rawVal: string
  ) => {
    const parsed = rawVal === "" ? "" : Math.max(0, parseInt(rawVal, 10) || 0);
    const existing = warehouseAllocations[warehouseId] || {
      openingStock: 0,
      reorderLevelStock: 0,
      minimumStock: 0,
    };
    const nextAllocs = {
      ...warehouseAllocations,
      [warehouseId]: {
        ...existing,
        [field]: parsed,
      },
    };
    setWarehouseAllocations(nextAllocs);
    syncStockTotalsFromWarehouses(selectedWarehouseIds, nextAllocs);
  };

  const selectedGenders: string[] = useMemo(() => {
    const raw: any = watchedGender;
    if (Array.isArray(raw)) {
      return raw.map((g: any) => String(g).trim()).filter(Boolean);
    }
    if (typeof raw === "string" && raw.trim()) {
      return raw.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }, [watchedGender]);

  // Auto-generate variants from colors and sizes (matching Cartesian SKU logic: MasterSKU-Color-Size)
  const computedVariants = useMemo(() => {
    const sizeParts = watchedSizeList
      ? watchedSizeList
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const colorParts = Array.isArray(watchedColors) ? watchedColors : [];
    const masterSku = (watchedMasterSku || "").trim();

    if (colorParts.length === 0 && sizeParts.length === 0) {
      if (!masterSku) return [];
      return [{ sku: masterSku, color: "", size: "" }];
    }

    const effectiveColors = colorParts.length > 0 ? colorParts : [undefined];
    const effectiveSizes = sizeParts.length > 0 ? sizeParts : [undefined];

    const list: { sku: string; color: string; size: string; id?: string }[] = [];
    for (const col of effectiveColors) {
      for (const sz of effectiveSizes) {
        const skuParts: string[] = [];
        if (col) skuParts.push(col);
        if (sz) skuParts.push(sz);

        const targetSku =
          skuParts.length > 0 && masterSku
            ? `${masterSku}-${skuParts.join("-")}`
            : skuParts.length > 0
            ? skuParts.join("-")
            : masterSku;

        list.push({
          sku: targetSku,
          color: col || "",
          size: sz || "",
        });
      }
    }

    // Include any existing custom variants from database that might not match standard Cartesian grid
    if (mode === "edit") {
      const activeProd = singleProductResponse?.data ?? product;
      const allVars: any[] = [
        ...(Array.isArray(activeProd?.variants) ? activeProd.variants : []),
        ...(Array.isArray(variantsResponse?.data) ? variantsResponse.data : []),
      ];

      allVars.forEach((v) => {
        if (!v?.variantSku) return;
        const rawSku = String(v.variantSku).trim();
        // Check if list already has this SKU (case-insensitive)
        const exists = list.some(
          (item) => item.sku.toLowerCase() === rawSku.toLowerCase()
        );
        if (!exists) {
          const colAttr = (v.attributes || []).find((a: any) =>
            ["colour", "color"].includes(
              (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim()
            )
          );
          const szAttr = (v.attributes || []).find((a: any) =>
            ["size"].includes(
              (a.productAttribute?.attributeName || a.attributeName || "").toLowerCase().trim()
            )
          );
          let col = colAttr?.attributeValue?.trim() || "";
          let sz = szAttr?.attributeValue?.trim() || "";

          if (!col || !sz) {
            if (masterSku && rawSku.startsWith(masterSku + "-")) {
              const remainder = rawSku.slice(masterSku.length + 1);
              const parts = remainder.split("-");
              if (parts.length >= 2) {
                if (!col) col = parts[0];
                if (!sz) sz = parts[1];
              }
            }
          }

          const productColors = Array.isArray(product?.colors) ? product.colors : [];
          const isFromProductColor = productColors.length === 0 || productColors.some((pc: string) => pc.toLowerCase() === col.toLowerCase());

          // If this variant belongs to a product color and its size was removed from sizeParts:
          if (sz && sizeParts.length > 0 && isFromProductColor && !sizeParts.some((sp) => sp.toLowerCase() === sz.toLowerCase())) {
            return;
          }

          // If this variant's color was a product color, but that color was removed from colorParts:
          if (col && isFromProductColor && colorParts.length > 0 && !colorParts.some((cp) => cp.toLowerCase() === col.toLowerCase())) {
            return;
          }

          list.push({
            id: v.id,
            sku: rawSku,
            color: col,
            size: sz,
          });
        }
      });
    }

    return list;
  }, [watchedColors, watchedSizeList, watchedMasterSku, mode, singleProductResponse, product, variantsResponse]);

  // Load existing variant pricing into variantPricing state in edit mode
  useEffect(() => {
    if (mode === "edit") {
      const activeProd = singleProductResponse?.data ?? product;
      const allVars: any[] = [
        ...(Array.isArray(activeProd?.variants) ? activeProd.variants : []),
        ...(Array.isArray(variantsResponse?.data) ? variantsResponse.data : []),
      ];

      if (allVars.length > 0) {
        const baseProductCost =
          activeProd?.productCost !== undefined && activeProd?.productCost !== null
            ? Number(activeProd.productCost)
            : null;
        const baseMrp =
          activeProd?.mrp !== undefined &&
          activeProd?.mrp !== null &&
          String(activeProd.mrp).trim() !== ""
            ? Number(activeProd.mrp)
            : null;

        setVariantPricing((prev) => {
          const next = { ...prev };
          allVars.forEach((v) => {
            const costNum = v.cost !== undefined && v.cost !== null ? Number(v.cost) : 0;
            const costVal =
              baseProductCost !== null && costNum !== baseProductCost && costNum > 0
                ? v.cost
                : "";

            const mrpNum = v.mrp !== undefined && v.mrp !== null ? Number(v.mrp) : 0;
            const mrpVal =
              baseMrp !== null && mrpNum !== baseMrp && mrpNum > 0
                ? v.mrp
                : "";

            if (v.variantSku && next[v.variantSku] === undefined) {
              next[v.variantSku] = { cost: costVal, mrp: mrpVal, id: v.id };
            }
            if (v.id && next[v.id] === undefined) {
              next[v.id] = { cost: costVal, mrp: mrpVal, id: v.id };
            }
          });
          return next;
        });
      }
    }
  }, [mode, singleProductResponse, product, variantsResponse]);

  // Default Cost & MRP automatically derived from Kardex (Product Cost) and General (MRP)
  const defaultCost = useMemo(() => {
    if (
      watchedProductCost !== undefined &&
      watchedProductCost !== null &&
      Number(watchedProductCost) > 0
    ) {
      return watchedProductCost;
    }
    return "";
  }, [watchedProductCost]);

  const defaultMrp = useMemo(() => {
    if (
      watchedMrp !== undefined &&
      watchedMrp !== null &&
      String(watchedMrp).trim() !== "" &&
      Number(watchedMrp) > 0
    ) {
      return String(watchedMrp).trim();
    }
    return "";
  }, [watchedMrp]);

  const getVariantCost = (sku: string, fallbackCost?: number) => {
    const custom = variantPricing[sku]?.cost;
    if (custom !== undefined && custom !== "" && Number(custom) >= 0) return Number(custom);
    if (
      watchedProductCost !== undefined &&
      watchedProductCost !== null &&
      Number(watchedProductCost) > 0
    ) {
      return Number(watchedProductCost);
    }
    if (fallbackCost !== undefined && fallbackCost !== null && fallbackCost > 0)
      return fallbackCost;
    return 0;
  };

  const getVariantMrp = (sku: string, fallbackMrp?: number) => {
    const custom = variantPricing[sku]?.mrp;
    if (custom !== undefined && custom !== "" && Number(custom) >= 0) return Number(custom);
    if (
      watchedMrp !== undefined &&
      watchedMrp !== null &&
      String(watchedMrp).trim() !== "" &&
      Number(watchedMrp) > 0
    ) {
      return Number(watchedMrp);
    }
    if (fallbackMrp !== undefined && fallbackMrp !== null && fallbackMrp > 0)
      return fallbackMrp;
    return 0;
  };

  const handleVariantPriceChange = (
    sku: string,
    field: "cost" | "mrp",
    value: string
  ) => {
    setVariantPricing((prev) => {
      const current = prev[sku];
      return {
        ...prev,
        [sku]: {
          id: current?.id,
          cost:
            field === "cost"
              ? value
              : current?.cost !== undefined
              ? current.cost
              : defaultCost,
          mrp:
            field === "mrp"
              ? value
              : current?.mrp !== undefined
              ? current.mrp
              : defaultMrp,
        },
      };
    });
  };

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
      [],
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.brands
    );
  }, [dropdownData]);

  const unitOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "unit",
      [],
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.units
    );
  }, [dropdownData]);

  const genderOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "gender",
      [],
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.genders
    );
  }, [dropdownData]);

  const referencePartyOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "referenceparty",
      [],
      dropdownData?.savedOptions,
      [...(dropdownData?.parties || []), ...(dropdownData?.distinctFromProducts?.referenceParties || [])]
    );
  }, [dropdownData]);

  const gstRateOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      ["gstrate", "gst"],
      [],
      dropdownData?.savedOptions,
      (dropdownData?.distinctFromProducts as any)?.gstRates
    );
  }, [dropdownData]);

  const availabilityOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "availability",
      [],
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.availabilities
    );
  }, [dropdownData]);

  const marketplaceOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "marketplace",
      [],
      dropdownData?.savedOptions
    );
  }, [dropdownData]);

  const rackOptions: DropdownOption[] = useMemo(() => {
    return buildMergedOptions(
      "rackaddress",
      [],
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

    const distProd = dropdownData?.distinctFromProducts;
    const merged = buildMergedOptions(
      ["color", "colors"],
      [],
      dropdownData?.savedOptions,
      [...(distProd?.colors || []), ...localSaved]
    );

    const getDisplayName = (o: { label?: string; value: string }) => {
      const lbl = String(o.label || "").trim();
      const val = String(o.value || "").trim();
      if (val.startsWith("#") && lbl && !lbl.startsWith("#")) return lbl;
      if (lbl.startsWith("#") && val && !val.startsWith("#")) return val;
      return lbl || val;
    };

    return merged.map(getDisplayName);
  }, [dropdownData]);

  const serverColorHexMap = useMemo(() => {
    const map: Record<string, string> = {};
    (dropdownData?.savedOptions || [])
      .filter((o) => ["color", "colors"].includes(o.field?.toLowerCase()) && o.isActive !== false)
      .forEach((o) => {
        const val = String(o.value || "").trim();
        const lbl = String(o.label || "").trim();
        if (val.startsWith("#") && lbl) {
          map[lbl.toLowerCase()] = val.toUpperCase();
        } else if (lbl.startsWith("#") && val) {
          map[val.toLowerCase()] = lbl.toUpperCase();
        }
      });
    return map;
  }, [dropdownData]);

  const dynamicSizes = useMemo(() => {
    let localSaved: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_sizes");
        localSaved = stored ? JSON.parse(stored) : [];
      } catch {}
    }

    const merged = buildMergedOptions(
      ["size", "sizes", "sizelist"],
      [],
      dropdownData?.savedOptions,
      localSaved
    );
    return merged.map((o) => o.label || o.value);
  }, [dropdownData]);

  // Sync initial values in Edit mode
  const disabledColors = useMemo(() => {
    const disabled: string[] = [];
    (dropdownData?.savedOptions || [])
      .filter(
        (o) =>
          ["color", "colors"].includes(o.field?.toLowerCase()) &&
          (o.isActive === false || o.label === "__DELETED__")
      )
      .forEach((o) => {
        if (o.value) disabled.push(o.value);
        if (o.label && o.label !== "__DELETED__") disabled.push(o.label);
      });
    return disabled;
  }, [dropdownData]);

  const disabledSizes = useMemo(() => {
    const disabled: string[] = [];
    (dropdownData?.savedOptions || [])
      .filter(
        (o) =>
          ["size", "sizes", "sizelist"].includes(o.field?.toLowerCase()) &&
          (o.isActive === false || o.label === "__DELETED__")
      )
      .forEach((o) => {
        if (o.value) disabled.push(o.value);
        if (o.label && o.label !== "__DELETED__") disabled.push(o.label);
      });
    return disabled;
  }, [dropdownData]);

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

      // Extract all colors from uniqueVariants (including custom added variants)
      const variantColors: string[] = [];
      const mSku = (activeProduct.masterSku || activeProduct.sku || "").trim();

      uniqueVariants.forEach((v: any) => {
        // 1. Check variant attributes
        (v.attributes || []).forEach((va: any) => {
          const attrName = (
            va.productAttribute?.attributeName ||
            va.attributeName ||
            ""
          ).toLowerCase().trim();
          if (["colour", "color"].includes(attrName) && va.attributeValue?.trim()) {
            va.attributeValue
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
              .forEach((c: string) => variantColors.push(c));
          }
        });

        // 2. Parse color from variantSku
        const rawSku = (v.variantSku || "").trim();
        if (rawSku && mSku && rawSku.startsWith(mSku + "-")) {
          const remainder = rawSku.slice(mSku.length + 1);
          const parts = remainder.split("-");
          // If remainder is "Marron-S" or "Maroon-S-1"
          if (parts.length >= 2) {
            const colorPart = parts[0].trim();
            const sizeRegex = /^(XS|S|M|L|XL|XXL|XXXL|2XL|4XL|28|30|32|34|36|38|40|42|44|46|48|\d+)$/i;
            if (colorPart && !sizeRegex.test(colorPart)) {
              variantColors.push(colorPart);
            }
          }
        }
      });

      // Match against known colors in variant SKUs
      const allKnownColors = Array.from(
        new Set([
          ...dynamicColors,
          "Magenta", "Black", "White", "Navy", "Red", "Blue", "Green", "Yellow",
          "Orange", "Grey", "Gray", "Purple", "Pink", "Maroon", "Marron", "Beige",
          "Brown", "Teal", "Olive", "Lavender", "Peach", "Charcoal", "Cream", "Aqua"
        ])
      );

      uniqueVariants.forEach((v: any) => {
        const skuStr = v.variantSku || "";
        allKnownColors.forEach((col) => {
          const regex = new RegExp(`(^|[-_\\s/])${col}([-_\\s/]|$)`, "i");
          if (regex.test(skuStr)) {
            variantColors.push(col);
          }
        });
      });

      // Merge extra colors from variants into initialColors ONLY if product has NO colors defined
      if (initialColors.length === 0 && variantColors.length > 0) {
        initialColors = Array.from(new Set(variantColors));
      }

      if (initialColors.length === 0) {
        const textToSearch = `${activeProduct.productName || ""} ${activeProduct.masterSku || ""}`;
        const matchedColors = allKnownColors.filter((col) => {
          const regex = new RegExp(`(^|[-_\\s/])${col}([-_\\s/]|$)`, "i");
          return regex.test(textToSearch);
        });
        if (matchedColors.length > 0) {
          initialColors = matchedColors;
        }
      }

      // 2. Extract sizeList with preserved sequence and extra variant sizes included
      let initialSizeList = (activeProduct.sizeList || "").trim();
      if (!initialSizeList) {
        const sizeAttr = (activeProduct.attributes || []).find((a: any) =>
          ["size"].includes((a.attributeName || "").toLowerCase().trim())
        );
        if (sizeAttr?.attributeValue?.trim()) {
          initialSizeList = sizeAttr.attributeValue.trim();
        }
      }

      const sizeAttrIds = (activeProduct.attributes || [])
        .filter((a: any) => ["size"].includes((a.attributeName || "").toLowerCase().trim()))
        .map((a: any) => a.id)
        .filter(Boolean);

      const variantSizes: string[] = uniqueVariants.flatMap((v: any) =>
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

      // Also extract size from variant SKUs
      const sizeRegex = /[-_](XS|S|M|L|XL|XXL|XXXL|2XL|4XL|28|30|32|34|36|38|40|42|44|46|48)$/i;
      uniqueVariants.forEach((v: any) => {
        const m = (v.variantSku || "").match(sizeRegex);
        if (m && m[1]) {
          variantSizes.push(m[1].toUpperCase());
        }
      });

      // Only set initialSizeList from variantSizes if product has NO sizes defined
      if (!initialSizeList && variantSizes.length > 0) {
        const uniqueSizes = Array.from(new Set(variantSizes));
        initialSizeList = sortSizes(uniqueSizes).join(", ");
      }

      // 3. Extract SKU
      const initialSku =
        (activeProduct.masterSku || "").trim() ||
        (activeProduct.sku || "").trim();

      // 4. Extract Gender
      let initialGender: string[] = [];
      const rawGender = activeProduct.gender;
      if (Array.isArray(rawGender)) {
        initialGender = rawGender.map((g: any) => String(g).trim()).filter(Boolean);
      } else if (typeof rawGender === "string" && rawGender.trim()) {
        initialGender = rawGender.split(",").map((s) => s.trim()).filter(Boolean);
      } else {
        const genderAttr = (activeProduct.attributes || []).find(
          (a: any) => (a.attributeName || "").toLowerCase().trim() === "gender"
        );
        if (genderAttr?.attributeValue?.trim()) {
          initialGender = genderAttr.attributeValue.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
      // Also extract any genders present on custom variants
      const variantGenders = uniqueVariants.flatMap((v: any) =>
        (v.attributes || [])
          .filter((va: any) => (va.productAttribute?.attributeName || va.attributeName || "").toLowerCase().trim() === "gender")
          .flatMap((va: any) => (va.attributeValue || "").split(",").map((s: string) => s.trim()))
          .filter(Boolean)
      );
      if (variantGenders.length > 0) {
        const extraGenders = Array.from(new Set(variantGenders)).filter(
          (vg) => !initialGender.some((ig) => ig.toLowerCase() === vg.toLowerCase())
        );
        if (extraGenders.length > 0) {
          initialGender = [...initialGender, ...extraGenders];
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
        String(activeProduct.mrp).trim() !== "" &&
        String(activeProduct.mrp).trim() !== "0"
          ? String(activeProduct.mrp)
          : uniqueVariants[0]?.mrp !== undefined &&
            uniqueVariants[0]?.mrp !== null &&
            Number(uniqueVariants[0].mrp) > 0
          ? String(uniqueVariants[0].mrp)
          : "";

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

      // Hydrate per-warehouse stock allocations from existing variant inventories if present
      const existingInventories = ((activeProduct as any).variants?.[0]?.inventories || []) as Array<{
        warehouseId: string;
        availableStock?: number;
        reorderLevel?: number;
      }>;
      if (existingInventories.length > 0) {
        const initIds: string[] = [];
        const initAllocs: Record<
          string,
          { openingStock: number | ""; reorderLevelStock: number | ""; minimumStock: number | "" }
        > = {};
        for (const inv of existingInventories) {
          if (inv.warehouseId && !initIds.includes(inv.warehouseId)) {
            initIds.push(inv.warehouseId);
            initAllocs[inv.warehouseId] = {
              openingStock: Number(inv.availableStock) || 0,
              reorderLevelStock: Number(inv.reorderLevel) || 0,
              minimumStock: initialMinimumStock || 0,
            };
          }
        }
        setSelectedWarehouseIds(initIds);
        setWarehouseAllocations(initAllocs);
      }
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
      const genderVal = Array.isArray(values.gender)
        ? values.gender.join(", ").trim()
        : values.gender
        ? String(values.gender).trim()
        : "";
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
        gender: Array.isArray(values.gender)
          ? values.gender.join(", ").trim()
          : values.gender
          ? String(values.gender).trim()
          : "",
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
        ...(selectedWarehouseIds.length > 0
          ? {
              warehouseStocks: selectedWarehouseIds.map((whId) => ({
                warehouseId: whId,
                openingStock: Number(warehouseAllocations[whId]?.openingStock) || 0,
                reorderLevelStock: Number(warehouseAllocations[whId]?.reorderLevelStock) || 0,
                minimumStock: Number(warehouseAllocations[whId]?.minimumStock) || 0,
              })),
            }
          : {}),
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
          if (freshVariants.length > 0) {
            // Update cost and mrp for each created variant if set in variantPricing or default
            const updateCostPromises = freshVariants.map((v: any) => {
              const newCost = getVariantCost(v.variantSku);
              const newMrp = getVariantMrp(v.variantSku);
              if (newCost > 0 || newMrp > 0) {
                return productVariantService
                  .update(v.id, { cost: newCost, mrp: newMrp }, token)
                  .catch((e) => console.warn("Update created variant cost/mrp error:", e));
              }
              return Promise.resolve();
            });
            await Promise.allSettled(updateCostPromises);
          } else {
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
            const genderVal = Array.isArray(values.gender)
              ? values.gender.join(", ").trim()
              : values.gender
              ? String(values.gender).trim()
              : "";

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

            // Generate Cartesian combinations: ALL sizes for ALL colors
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

              const itemCost = getVariantCost(targetVariantSku);
              const itemMrp = getVariantMrp(targetVariantSku);

              return productVariantService
                .create(
                  {
                    productId: createdProduct.id,
                    variantSku: targetVariantSku,
                    cost: itemCost,
                    mrp: itemMrp,
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
          : (Array.isArray(product?.variants) ? product.variants : []);

        // Update cost and mrp for variants where custom pricing or master pricing changed
        const updateCostPromises = freshVariants
          .map((v: any) => {
            const newCost = getVariantCost(v.variantSku, v.cost);
            const newMrp = getVariantMrp(v.variantSku, v.mrp);
            if (newCost !== (v.cost ?? 0) || newMrp !== (v.mrp ?? 0)) {
              return productVariantService
                .update(v.id, { cost: newCost, mrp: newMrp }, token)
                .catch((e) => console.warn("Update variant cost/mrp error:", e));
            }
            return null;
          })
          .filter(Boolean);

        if (updateCostPromises.length > 0) {
          await Promise.allSettled(updateCostPromises);
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
                            disabledColors={disabledColors}
                            colorHexMap={serverColorHexMap}
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
                          <GenderMultiSelect
                            label={categoryConfig.genderLabel || "Gender"}
                            value={field.value || []}
                            options={genderOptions}
                            onChange={field.onChange}
                            placeholder="Select Gender..."
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
                            additionalSizes={[
                              ...(categoryConfig.sizeLabel.toLowerCase().includes("shoe")
                                ? defaultShoeSizes
                                : defaultNumericSizes),
                              ...dynamicSizes,
                            ]}
                            disabledSizes={disabledSizes}
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
                    onFocus={(e) => {
                      if (
                        e.target.value === "0" ||
                        e.target.value === "0.00" ||
                        Number(e.target.value) === 0
                      ) {
                        field.onChange("");
                      }
                    }}
                    onClick={(e) => {
                      if (
                        e.currentTarget.value === "0" ||
                        e.currentTarget.value === "0.00" ||
                        Number(e.currentTarget.value) === 0
                      ) {
                        field.onChange("");
                      }
                    }}
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
                      value={field.value ?? ""}
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00" ||
                          Number(e.target.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onClick={(e) => {
                        if (
                          e.currentTarget.value === "0" ||
                          e.currentTarget.value === "0.00" ||
                          Number(e.currentTarget.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : parseFloat(e.target.value)
                        )
                      }
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
                      value={field.value ?? ""}
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00" ||
                          Number(e.target.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onClick={(e) => {
                        if (
                          e.currentTarget.value === "0" ||
                          e.currentTarget.value === "0.00" ||
                          Number(e.currentTarget.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : parseFloat(e.target.value)
                        )
                      }
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
                      value={field.value ?? ""}
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          Number(e.target.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onClick={(e) => {
                        if (
                          e.currentTarget.value === "0" ||
                          Number(e.currentTarget.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? ""
                            : parseInt(e.target.value, 10)
                        )
                      }
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
                      value={field.value ?? ""}
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          Number(e.target.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onClick={(e) => {
                        if (
                          e.currentTarget.value === "0" ||
                          Number(e.currentTarget.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? ""
                            : parseInt(e.target.value, 10)
                        )
                      }
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
                        value={field.value ?? ""}
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00" ||
                            Number(e.target.value) === 0
                          ) {
                            field.onChange("");
                          }
                        }}
                        onClick={(e) => {
                          if (
                            e.currentTarget.value === "0" ||
                            e.currentTarget.value === "0.00" ||
                            Number(e.currentTarget.value) === 0
                          ) {
                            field.onChange("");
                          }
                        }}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : parseFloat(e.target.value)
                          )
                        }
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
                      value={field.value ?? ""}
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          Number(e.target.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onClick={(e) => {
                        if (
                          e.currentTarget.value === "0" ||
                          Number(e.currentTarget.value) === 0
                        ) {
                          field.onChange("");
                        }
                      }}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? ""
                            : parseInt(e.target.value, 10)
                        )
                      }
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

          {/* Warehouse-Wise Stock Allocation (Multi-Select Warehouses for Opening, Minimum & Re-Order Stock) */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  <WarehouseIcon size={14} className="text-[#B88728] dark:text-[#F5C451]" />
                  <span>Warehouses (Multi-Select Stock Allocation)</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select warehouses to set Opening Stock, Minimum Stock, and Re-Order Level Stock per warehouse.
                </p>
              </div>
              {availableWarehouses.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = availableWarehouses.map((w) => w.id);
                      const nextAllocs = { ...warehouseAllocations };
                      for (const id of allIds) {
                        if (!nextAllocs[id]) {
                          nextAllocs[id] = {
                            openingStock: Number(watch("openingStock")) || 0,
                            reorderLevelStock: Number(watch("reorderLevelStock")) || 0,
                            minimumStock: Number(watch("minimumStock")) || 0,
                          };
                        }
                      }
                      setSelectedWarehouseIds(allIds);
                      setWarehouseAllocations(nextAllocs);
                      syncStockTotalsFromWarehouses(allIds, nextAllocs);
                    }}
                    className="text-[11px] font-bold text-[#B88728] dark:text-[#F5C451] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  {selectedWarehouseIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWarehouseIds([]);
                      }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Multi-Select Dropdown */}
            <div className="relative" ref={warehouseDropdownRef}>
              <div
                onClick={() => setWarehouseDropdownOpen((o) => !o)}
                className="min-h-11 sm:min-h-12 w-full px-3.5 py-2 rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] flex items-center justify-between gap-2 cursor-pointer hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50 transition-all shadow-xs"
              >
                <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                  {selectedWarehouseIds.length === 0 ? (
                    <span className="text-xs sm:text-sm text-slate-400">
                      {availableWarehouses.length === 0
                        ? "No warehouses added yet"
                        : "Select Warehouses..."}
                    </span>
                  ) : (
                    selectedWarehouseIds.map((whId) => {
                      const wh = availableWarehouses.find((w) => w.id === whId);
                      if (!wh) return null;
                      return (
                        <span
                          key={whId}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#FFF9EC] text-[#7A581F] border border-[#E8C16D]/50 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30"
                        >
                          <span>{wh.warehouseName}</span>
                          <button
                            type="button"
                            onClick={() => toggleWarehouseSelection(whId)}
                            className="hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                            aria-label={`Remove ${wh.warehouseName}`}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    "text-slate-400 shrink-0 transition-transform",
                    warehouseDropdownOpen && "rotate-180"
                  )}
                />
              </div>

              {warehouseDropdownOpen && availableWarehouses.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-1.5 shadow-2xl max-h-56 overflow-y-auto custom-scrollbar space-y-0.5">
                  {availableWarehouses.map((wh) => {
                    const isSelected = selectedWarehouseIds.includes(wh.id);
                    return (
                      <button
                        key={wh.id}
                        type="button"
                        onClick={() => toggleWarehouseSelection(wh.id)}
                        className={cn(
                          "w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-left text-xs font-semibold transition-colors cursor-pointer",
                          isSelected
                            ? "bg-[#FFF9EC] text-[#7A581F] dark:bg-[#F5C451]/15 dark:text-[#F5C451]"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{wh.warehouseName}</span>
                          {wh.warehouseCode && (
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              ({wh.warehouseCode})
                            </span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "h-4 w-4 rounded flex items-center justify-center border shrink-0",
                            isSelected
                              ? "border-[#E8C16D] bg-[#E8C16D] text-[#0A0E1A]"
                              : "border-slate-300 dark:border-white/20"
                          )}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Warehouses Stock Quantities */}
            {selectedWarehouseIds.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {selectedWarehouseIds.map((whId) => {
                  const wh = availableWarehouses.find((w) => w.id === whId);
                  if (!wh) return null;
                  const alloc = warehouseAllocations[whId] || {
                    openingStock: 0,
                    reorderLevelStock: 0,
                    minimumStock: 0,
                  };
                  return (
                    <div
                      key={whId}
                      className="rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#0B0F17] p-3 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-[#0A0E1A] dark:text-white truncate">
                            {wh.warehouseName}
                          </span>
                          {wh.warehouseCode && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                              {wh.warehouseCode}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleWarehouseSelection(whId)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          title={`Remove ${wh.warehouseName}`}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Opening Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={alloc.openingStock}
                            onChange={(e) =>
                              updateWarehouseStockField(whId, "openingStock", e.target.value)
                            }
                            placeholder="0"
                            className="w-full h-9 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Min Stock
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={alloc.minimumStock}
                            onChange={(e) =>
                              updateWarehouseStockField(whId, "minimumStock", e.target.value)
                            }
                            placeholder="0"
                            className="w-full h-9 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Re-Order Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={alloc.reorderLevelStock}
                            onChange={(e) =>
                              updateWarehouseStockField(whId, "reorderLevelStock", e.target.value)
                            }
                            placeholder="0"
                            className="w-full h-9 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* COST & MRP TAB CONTENT                                       */}
      {/* ============================================================ */}
      {activeTab === "cost_mrp" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Cost & MRP Configuration</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#F5C451]/10 dark:text-[#F5C451] dark:border-[#F5C451]/20">
                  {computedVariants.length} Variant{computedVariants.length === 1 ? "" : "s"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically pre-filled from General (MRP) and Kardex (Cost). You can customize each variant below as needed.
              </p>
            </div>
          </div>

          {computedVariants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E7E0D2] dark:border-white/[0.08] p-8 text-center bg-[#FEFAEE]/40 dark:bg-[#0B0F17]/40">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No variants generated yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Please enter a Master SKU, select at least one Color, and specify Sizes in the{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("general")}
                  className="font-bold text-[#B88728] dark:text-[#F5C451] underline hover:opacity-80"
                >
                  General
                </button>{" "}
                tab. Variants will automatically appear here for Cost and MRP pricing.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E7E0D2] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-left font-sans">
                  <thead className="border-b border-[#F5E6BE] bg-[#FEFAEE] text-xs font-bold tracking-wider text-[#6A4D1D] dark:border-white/[0.08] dark:bg-[#080B11] dark:text-[#E8C16D]">
                    <tr>
                      <th className="px-4 py-3 text-center w-[60px] uppercase">#</th>
                      <th className="px-4 py-3 text-left uppercase min-w-[200px]">Variant SKU</th>
                      {(categoryConfig.hasGender || selectedGenders.length > 0) && (
                        <th className="px-4 py-3 text-center uppercase min-w-[100px]">Gender</th>
                      )}
                      <th className="px-4 py-3 text-left uppercase min-w-[150px]">Cost (₹)</th>
                      <th className="px-4 py-3 text-left uppercase min-w-[150px]">MRP (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E0D2] dark:divide-white/[0.06] text-xs sm:text-sm">
                    {computedVariants.map((item, idx) => {
                      const pricing = variantPricing[item.sku] || (item.id ? variantPricing[item.id] : {}) || {};
                      const currentCost =
                        pricing.cost !== undefined && pricing.cost !== ""
                          ? pricing.cost
                          : defaultCost;
                      const currentMrp =
                        pricing.mrp !== undefined && pricing.mrp !== ""
                          ? pricing.mrp
                          : defaultMrp;

                      return (
                        <tr
                          key={item.sku}
                          className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-3 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span>{item.sku}</span>
                              {item.color && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 font-sans font-normal">
                                  {item.color}
                                </span>
                              )}
                              {item.size && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20 font-mono font-bold">
                                  {item.size}
                                </span>
                              )}
                            </div>
                          </td>
                          {(categoryConfig.hasGender || selectedGenders.length > 0) && (
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {selectedGenders.length > 0 ? (
                                  selectedGenders.map((gen) => (
                                    <span
                                      key={gen}
                                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20 font-sans"
                                    >
                                      {gen}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400">--</span>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="relative flex items-center max-w-[160px]">
                              <span className="absolute left-3 text-xs font-semibold text-slate-400">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={currentCost ?? ""}
                                onFocus={(e) => {
                                  if (
                                    e.target.value === "0" ||
                                    e.target.value === "0.00" ||
                                    Number(e.target.value) === 0
                                  ) {
                                    handleVariantPriceChange(item.sku, "cost", "");
                                  }
                                }}
                                onClick={(e) => {
                                  if (
                                    e.currentTarget.value === "0" ||
                                    e.currentTarget.value === "0.00" ||
                                    Number(e.currentTarget.value) === 0
                                  ) {
                                    handleVariantPriceChange(item.sku, "cost", "");
                                  }
                                }}
                                onChange={(e) =>
                                  handleVariantPriceChange(item.sku, "cost", e.target.value)
                                }
                                className="w-full h-9 pl-7 pr-3 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-slate-900 dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 transition shadow-2xs"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative flex items-center max-w-[160px]">
                              <span className="absolute left-3 text-xs font-semibold text-slate-400">₹</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={currentMrp ?? ""}
                                onFocus={(e) => {
                                  if (
                                    e.target.value === "0" ||
                                    e.target.value === "0.00" ||
                                    Number(e.target.value) === 0
                                  ) {
                                    handleVariantPriceChange(item.sku, "mrp", "");
                                  }
                                }}
                                onClick={(e) => {
                                  if (
                                    e.currentTarget.value === "0" ||
                                    e.currentTarget.value === "0.00" ||
                                    Number(e.currentTarget.value) === 0
                                  ) {
                                    handleVariantPriceChange(item.sku, "mrp", "");
                                  }
                                }}
                                onChange={(e) =>
                                  handleVariantPriceChange(item.sku, "mrp", e.target.value)
                                }
                                className="w-full h-9 pl-7 pr-3 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-slate-900 dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 transition shadow-2xs"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
