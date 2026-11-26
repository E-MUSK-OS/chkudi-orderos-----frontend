"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crop,
  ImageIcon,
  ImagePlus,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import DashboardLayout from "../../layout/DashboardLayout";
import { Switch } from "@/components/ui/switch";
import { usePagePermissions } from "@/utils/pagePermissions";
import { productService } from "./services/product.service";
import { useProduct } from "./hooks/useProducts";
import {
  useDeleteProductVariant,
  useProductVariant,
  useProductVariants,
  useUpdateProductVariant,
} from "./hooks/useProductVariants";
import {
  defaultNumericSizes,
  defaultShoeSizes,
  getDefaultAttributesForCategory,
  getSizeRank,
} from "./constants/product.constants";
import type { Product, ProductAttribute } from "./types/product.types";
import type { ProductVariant } from "./types/productVariant.types";
import { productVariantService } from "./services/productVariant.service";
import DeleteVariantModal from "./components/DeleteVariantModal";
import ProductImageAdjustModal from "./components/ProductImageAdjustModal";
import DropdownWithOther from "./components/DropdownWithOther";
import ColorMultiSelect from "./components/ColorMultiSelect";
import SizeMultiSelect from "./components/SizeMultiSelect";
import GenderMultiSelect from "./components/GenderMultiSelect";
import { useDropdownOptions } from "./hooks/useDropdownOptions";
import { buildMergedOptions, extractDbSizeGroups } from "@/utils/dropdownOptions.utils";
import {
  buildExtraAttributes,
  buildGenderPricingMap,
  checkHasSizeAttribute,
  findDuplicateVariant,
  generateVariantSku,
  getActiveMarketplacesInfo,
  getCleanVariantSku,
  getColorHex,
  getColorValue,
  getDefinedSizes,
  getSizeValue,
  resolveAttributeId,
  resolveExistingGender,
  toFullImageUrl,
} from "./utils/productVariant.utils";

interface Props {
  variantId?: string;
  returnPath?: string;
}

interface ErrorLike {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getFriendlyVariantError = (error: unknown, fallback: string): string => {
  const errObj = error as ErrorLike | undefined;
  const rawMsg =
    errObj?.response?.data?.message ||
    errObj?.message ||
    (typeof error === "string" ? error : "");
  return rawMsg || fallback;
};

const INPUT_CLASS =
  "w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs";

const LABEL_CLASS =
  "block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight";

const parseSizesCsv = (csv: string): string[] => {
  if (!csv) return [];
  const seen = new Set<string>();
  const list: string[] = [];
  csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => {
      const key = s.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(s);
      }
    });
  return list.sort((a, b) => getSizeRank(a) - getSizeRank(b));
};

const stripTrailingSizeFromSku = (sku: string, size: string): string => {
  const raw = sku.trim();
  const sz = size.trim();
  if (!raw || !sz) return raw;
  const suffix = `-${sz}`.toLowerCase();
  if (raw.toLowerCase().endsWith(suffix)) {
    return raw.slice(0, raw.length - suffix.length);
  }
  return raw;
};

const buildSizeSkuFromBase = (baseSku: string, size: string): string => {
  const base = baseSku.trim();
  const sz = size.trim();
  if (!sz) return base;
  if (!base) return sz;
  if (base.toLowerCase().endsWith(`-${sz}`.toLowerCase())) {
    return base;
  }
  return `${base}-${sz}`;
};

const deriveColorBaseSku = (
  currentSku: string,
  prevSizes: string[],
  colorName: string,
  masterSku: string
): string => {
  const trimmed = currentSku.trim();
  if (prevSizes.length === 1 && prevSizes[0]) {
    const stripped = stripTrailingSizeFromSku(trimmed, prevSizes[0]);
    if (stripped && stripped !== trimmed) {
      return stripped;
    }
  } else if (trimmed) {
    return trimmed;
  }
  return generateVariantSku(colorName, "", masterSku);
};

const EMPTY_VARIANTS: ProductVariant[] = [];

type VariantWithProduct = ProductVariant & { product?: Product };

interface EditVariantFormProps {
  variant?: VariantWithProduct;
  product?: Product;
  allVariants: ProductVariant[];
  dropdownData?: ReturnType<typeof useDropdownOptions>["data"] extends infer D
  ? D extends { data?: infer Inner }
  ? Inner
  : undefined
  : undefined;
  isNewVariant: boolean;
  colorParam: string;
  isColorGroupMode: boolean;
  effectiveReturnPath: string;
  backLabel: string;
  productId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function EditProductVariant({
  variantId: propVariantId,
  returnPath = "/dashboard/settings/manage-product/product-profile",
}: Props) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const rawId =
    propVariantId ||
    (Array.isArray(params?.id) ? params.id[0] : (params?.id as string)) ||
    searchParams.get("id") ||
    "";

  const isNewVariant = rawId === "new";
  const fromParam = searchParams.get("from") || "";
  const colorParam = (searchParams.get("color") || "").trim();
  const isColorGroupMode =
    searchParams.get("mode") === "color" ||
    (fromParam === "product-gallery" && Boolean(colorParam));
  const effectiveReturnPath =
    fromParam === "product-gallery"
      ? "/dashboard/sales/product-gallery"
      : returnPath;
  const backLabel =
    fromParam === "product-gallery"
      ? "Back to Product Gallery"
      : "Back to Product Profile";

  const { canCreate, canUpdate, canDelete } = usePagePermissions("settings/manage-product");

  const {
    data: variantResponse,
    isLoading: variantLoading,
    error: variantError,
    refetch: refetchVariant,
  } = useProductVariant(isNewVariant ? "" : rawId);

  const variant = variantResponse?.data as VariantWithProduct | undefined;
  const productId = variant?.productId || searchParams.get("productId") || "";

  const { data: productResponse, isLoading: productLoading } = useProduct(productId);
  const { data: variantsResponse, isLoading: variantsLoading } = useProductVariants(productId);
  const { data: dropdownResponse } = useDropdownOptions();

  const product: Product | undefined = productResponse?.data ?? variant?.product;
  const allVariants = variantsResponse?.data || EMPTY_VARIANTS;
  const isDataLoading =
    (!isNewVariant && variantLoading) ||
    (Boolean(productId) && (productLoading || variantsLoading));
  const hasLoadedTarget = Boolean(variant || (isNewVariant && product));

  if (!canUpdate) {
    return (
      <DashboardLayout title="Edit Product Variant">
        <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5 p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400">
            Access Denied
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You do not have permission to edit product variants.
          </p>
          <button
            type="button"
            onClick={() => router.push(effectiveReturnPath)}
            className="h-10 px-5 rounded-2xl text-xs font-bold bg-[#E8C16D] text-[#0A0E1A] cursor-pointer"
          >
            {backLabel}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (isDataLoading) {
    return (
      <DashboardLayout title="Edit Product Variant">
        <div className="space-y-3 font-sans text-slate-900 dark:text-slate-100 py-0 max-w-[1600px] mx-auto">
          <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="h-56 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-56 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if ((!isNewVariant && variantError) || !hasLoadedTarget) {
    return (
      <DashboardLayout title="Edit Product Variant">
        <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5 p-8 text-center space-y-3">
          <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-base font-bold text-red-600 dark:text-red-400">
            Variant Not Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {(variantError as ErrorLike | null)?.message ||
              "The requested product variant could not be loaded or may have been deleted."}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => refetchVariant()}
              className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 cursor-pointer"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push(effectiveReturnPath)}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-[#0A0E1A] text-[#E8C16D] hover:bg-slate-900 dark:bg-[#F5C451] dark:text-black cursor-pointer"
            >
              {backLabel}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formMountKey = `${variant?.id || "new"}-${product?.id || productId}-${colorParam}-${isColorGroupMode ? "color" : "single"}`;

  return (
    <EditVariantForm
      key={formMountKey}
      variant={variant}
      product={product}
      allVariants={allVariants}
      dropdownData={dropdownResponse?.data}
      isNewVariant={isNewVariant}
      colorParam={colorParam}
      isColorGroupMode={isColorGroupMode}
      effectiveReturnPath={effectiveReturnPath}
      backLabel={backLabel}
      productId={productId}
      canCreate={canCreate}
      canUpdate={canUpdate}
      canDelete={canDelete}
    />
  );
}

function EditVariantForm({
  variant,
  product,
  allVariants,
  dropdownData,
  isNewVariant,
  colorParam,
  isColorGroupMode,
  effectiveReturnPath,
  backLabel,
  productId,
  canCreate,
  canUpdate,
  canDelete,
}: EditVariantFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const updateVariant = useUpdateProductVariant();
  const deleteVariant = useDeleteProductVariant();

  const attributes: ProductAttribute[] = useMemo(() => {
    if (product?.attributes && product.attributes.length > 0) {
      return product.attributes;
    }
    if (product?.category) {
      return getDefaultAttributesForCategory(product.category).map((name) => ({
        attributeName: name,
      }));
    }
    return [];
  }, [product]);

  const effectiveMasterSku = (product?.masterSku || "").trim();

  const existingGender = useMemo(
    () => resolveExistingGender(allVariants, product, attributes),
    [allVariants, product, attributes]
  );

  const genderPricingMap = useMemo(
    () => buildGenderPricingMap(allVariants),
    [allVariants]
  );

  const resolvedColorAttrId = useMemo(
    () => resolveAttributeId(["colour", "color"], attributes, product, allVariants),
    [attributes, product, allVariants]
  );

  const resolvedSizeAttrId = useMemo(
    () => resolveAttributeId(["size"], attributes, product, allVariants),
    [attributes, product, allVariants]
  );

  const resolvedGenderAttrId = useMemo(
    () => resolveAttributeId(["gender"], attributes, product, allVariants),
    [attributes, product, allVariants]
  );

  const extraAttributes = useMemo(
    () => buildExtraAttributes(attributes, existingGender, resolvedGenderAttrId),
    [attributes, existingGender, resolvedGenderAttrId]
  );

  const genderAttr = useMemo(
    () =>
      extraAttributes.find(
        (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
      ),
    [extraAttributes]
  );

  const remainingAttributes = useMemo(
    () =>
      extraAttributes.filter(
        (a) => (a.attributeName || "").toLowerCase().trim() !== "gender"
      ),
    [extraAttributes]
  );

  const hasSizeAttribute = useMemo(
    () => checkHasSizeAttribute(attributes, product, allVariants),
    [attributes, product, allVariants]
  );

  const definedSizes = useMemo(
    () => getDefinedSizes(product, attributes, allVariants),
    [product, attributes, allVariants]
  );

  const marketplaceInfo = useMemo(
    () => getActiveMarketplacesInfo(undefined, product),
    [product]
  );

  const showAsin = marketplaceInfo.showAsin || Boolean(variant?.asin);
  const showMyntraSku = marketplaceInfo.showMyntraSku || Boolean(variant?.myntraSku);
  const showFsnCode = marketplaceInfo.showFsnCode || Boolean(variant?.fsnCode);

  // Compute initial form defaults once on mount from loaded variant/product/allVariants
  const initialDefaults = useMemo(() => {
    const preMatchedBase =
      variant ||
      allVariants.find(
        (v) =>
          (getColorValue(v, product) || "Standard").toLowerCase() ===
          (colorParam || "Standard").toLowerCase()
      );
    const col =
      colorParam ||
      (preMatchedBase ? getColorValue(preMatchedBase, product) : "") ||
      (Array.isArray(product?.colors) && product.colors[0]) ||
      "";
    const groupColor = col || "Standard";

    const matchedGroup = allVariants.filter((v) => {
      const vc = (getColorValue(v, product) || "Standard").toLowerCase();
      return vc === groupColor.toLowerCase();
    });

    let sizesList: string[] = [];
    if (isColorGroupMode) {
      const activeMatched = matchedGroup.filter((v) => v.isActive !== false);
      const sourceGroup = activeMatched.length > 0 ? activeMatched : matchedGroup;
      const seen = new Set<string>();
      sourceGroup.forEach((v) => {
        const s = getSizeValue(v, product).trim();
        if (s && !seen.has(s.toLowerCase())) {
          seen.add(s.toLowerCase());
          sizesList.push(s);
        }
      });
      if (sizesList.length === 0 && isNewVariant && product?.sizeList) {
        sizesList = parseSizesCsv(product.sizeList);
      }
      sizesList.sort((a, b) => getSizeRank(a) - getSizeRank(b));
    } else if (preMatchedBase) {
      const sz = getSizeValue(preMatchedBase, product).trim();
      sizesList = sz ? [sz] : [];
    }

    let initialSku = "";
    if (sizesList.length > 1 || (isColorGroupMode && sizesList.length === 0)) {
      initialSku = generateVariantSku(groupColor, "", effectiveMasterSku);
    } else if (sizesList.length === 1) {
      const targetForSingle =
        matchedGroup.find(
          (v) => getSizeValue(v, product).toLowerCase() === sizesList[0].toLowerCase()
        ) || preMatchedBase;
      initialSku = targetForSingle
        ? getCleanVariantSku(targetForSingle, groupColor, effectiveMasterSku, product)
        : generateVariantSku(groupColor, sizesList[0], effectiveMasterSku);
    } else if (preMatchedBase) {
      initialSku = getCleanVariantSku(preMatchedBase, groupColor, effectiveMasterSku, product);
    } else {
      initialSku = generateVariantSku(groupColor, "", effectiveMasterSku);
    }

    const refVariant = preMatchedBase;
    const otherVals: Record<string, string> = {};
    extraAttributes.forEach((attr) => {
      const matched = refVariant?.attributes?.find(
        (a) =>
          (attr.id && a.productAttributeId === attr.id) ||
          (a.productAttribute?.attributeName &&
            a.productAttribute.attributeName.toLowerCase() ===
            attr.attributeName.toLowerCase())
      );
      const isGender =
        (attr.attributeName || "").toLowerCase().trim() === "gender";
      otherVals[attr.id || attr.attributeName] =
        matched?.attributeValue ||
        (isGender ? existingGender : "") ||
        attr.attributeValue ||
        "";
    });

    return {
      col,
      groupColor,
      sizesList,
      initialSku,
      cost:
        refVariant?.cost !== undefined && refVariant?.cost !== null
          ? refVariant.cost
          : product?.productCost ?? "",
      mrp:
        refVariant?.mrp !== undefined && refVariant?.mrp !== null
          ? refVariant.mrp
          : product?.mrp ?? "",
      asin: refVariant?.asin || "",
      myntraSku: refVariant?.myntraSku || "",
      fsnCode: refVariant?.fsnCode || "",
      rackAddress: refVariant?.rackAddress || product?.rackAddress || "",
      isActive: refVariant ? refVariant.isActive : product?.isActive ?? true,
      otherVals,
    };
  }, [
    variant,
    product,
    allVariants,
    colorParam,
    isColorGroupMode,
    isNewVariant,
    effectiveMasterSku,
    extraAttributes,
    existingGender,
  ]);

  // Form State
  const [editColor, setEditColor] = useState(() => initialDefaults.col);
  const [editSizes, setEditSizes] = useState<string[]>(() => initialDefaults.sizesList);
  const [editSku, setEditSku] = useState(() => initialDefaults.initialSku);
  const [perSizeSkuOverrides, setPerSizeSkuOverrides] = useState<Record<string, string>>({});
  const [editingSizeSku, setEditingSizeSku] = useState<string | null>(null);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [editCost, setEditCost] = useState<number | string>(() => initialDefaults.cost);
  const [editMrp, setEditMrp] = useState<number | string>(() => initialDefaults.mrp);
  const [editAsin, setEditAsin] = useState(() => initialDefaults.asin);
  const [editMyntraSku, setEditMyntraSku] = useState(() => initialDefaults.myntraSku);
  const [editFsnCode, setEditFsnCode] = useState(() => initialDefaults.fsnCode);
  const [editRackAddress, setEditRackAddress] = useState(() => initialDefaults.rackAddress);
  const [editStatus, setEditStatus] = useState(() => initialDefaults.isActive);
  const [editOtherAttrs, setEditOtherAttrs] = useState<Record<string, string>>(
    () => initialDefaults.otherVals
  );
  const [initialColorName] = useState(() => initialDefaults.groupColor);

  const availableProductColors = useMemo(
    () =>
      Array.isArray(product?.colors)
        ? product.colors.filter((c) => typeof c === "string" && Boolean(c.trim()))
        : [],
    [product]
  );

  const dynamicColors = useMemo(() => {
    let localSaved: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_colors");
        localSaved = stored ? JSON.parse(stored) : [];
      } catch {
        localSaved = [];
      }
    }

    const distProd = dropdownData?.distinctFromProducts;
    const merged = buildMergedOptions(
      ["color", "colors"],
      [],
      dropdownData?.savedOptions,
      [...(distProd?.colors || []), ...availableProductColors, ...localSaved]
    );

    const getDisplayName = (o: { label?: string; value: string }) => {
      const lbl = String(o.label || "").trim();
      const val = String(o.value || "").trim();
      if (val.startsWith("#") && lbl && !lbl.startsWith("#")) return lbl;
      if (lbl.startsWith("#") && val && !val.startsWith("#")) return val;
      return lbl || val;
    };

    return merged.map(getDisplayName);
  }, [availableProductColors, dropdownData]);

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

  const dbSizeGroups = useMemo(
    () => extractDbSizeGroups(dropdownData?.savedOptions),
    [dropdownData?.savedOptions]
  );

  const dynamicSizes = useMemo(() => {
    let localSaved: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_sizes");
        localSaved = stored ? JSON.parse(stored) : [];
      } catch {
        localSaved = [];
      }
    }

    const merged = buildMergedOptions(
      ["size", "sizes", "sizelist"],
      [],
      dropdownData?.savedOptions,
      [...definedSizes, ...localSaved]
    );
    return merged.map((o) => o.label || o.value);
  }, [definedSizes, dropdownData]);

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

  const genderDropdownOptions = useMemo(() => {
    return buildMergedOptions(
      "gender",
      [],
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.genders
    );
  }, [dropdownData]);

  // Image State & Drag Reordering
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const [adjustingImage, setAdjustingImage] = useState<{
    url: string;
    color: string;
    replaceFileName?: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    color: string;
    angleIndex?: number;
  } | null>(null);
  const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [optimisticGalleryByColor, setOptimisticGalleryByColor] = useState<
    Record<string, Array<{ url: string; fileName: string; angle?: string }>>
  >({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const addImageInputRef = useRef<HTMLInputElement | null>(null);

  // Delete & Unsaved-Changes Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteImageTarget, setDeleteImageTarget] = useState<{
    fileName: string;
    url: string;
  } | null>(null);
  const [unsavedModalOpen, setUnsavedModalOpen] = useState(false);
  const [imageAltTexts, setImageAltTexts] = useState<Record<string, string>>({});
  const initialFormSnapshotRef = useRef<string | null>(null);

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") ?? "";
  };

  const { data: imagesResponse, refetch: refetchImages } = useQuery({
    queryKey: ["product-images", effectiveMasterSku],
    queryFn: () => productService.getProductImages(effectiveMasterSku, getToken()),
    enabled: !!effectiveMasterSku,
    staleTime: 1000 * 60 * 5,
  });

  const localImages = useMemo(() => {
    const formatted: Record<string, string> = {};
    if (imagesResponse?.data) {
      for (const [color, pathUrl] of Object.entries(imagesResponse.data)) {
        const full = toFullImageUrl(pathUrl);
        if (full) formatted[color] = full;
      }
    }
    return { ...formatted, ...uploadedImages };
  }, [imagesResponse, uploadedImages]);

  const initialMarketplaceRef = useRef<{
    asin: string;
    myntraSku: string;
    fsnCode: string;
  }>({
    asin: initialDefaults.asin,
    myntraSku: initialDefaults.myntraSku,
    fsnCode: initialDefaults.fsnCode,
  });

  const resolvedGroupColor =
    initialColorName ||
    colorParam ||
    (variant ? getColorValue(variant, product) : "") ||
    "Standard";

  const colorGroupVariants = useMemo(() => {
    const targetLower = resolvedGroupColor.toLowerCase();
    return allVariants.filter((v) => {
      const col = (getColorValue(v, product) || "Standard").toLowerCase();
      return col === targetLower;
    });
  }, [allVariants, product, resolvedGroupColor]);

  const currentFormSnapshot = useMemo(
    () =>
      JSON.stringify({
        editSku,
        editColor,
        editSizes,
        editCost,
        editMrp,
        editAsin,
        editMyntraSku,
        editFsnCode,
        editRackAddress,
        editStatus,
        editOtherAttrs,
      }),
    [
      editSku,
      editColor,
      editSizes,
      editCost,
      editMrp,
      editAsin,
      editMyntraSku,
      editFsnCode,
      editRackAddress,
      editStatus,
      editOtherAttrs,
    ]
  );

  useEffect(() => {
    if (initialFormSnapshotRef.current === null && (variant || isNewVariant)) {
      initialFormSnapshotRef.current = currentFormSnapshot;
    }
  }, [variant, isNewVariant, currentFormSnapshot]);

  const hasUnsavedChanges = Boolean(
    initialFormSnapshotRef.current !== null &&
    initialFormSnapshotRef.current !== currentFormSnapshot
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Load persisted image alt texts for this SKU/color
  useEffect(() => {
    if (typeof window === "undefined" || !effectiveMasterSku) return;
    try {
      const raw = localStorage.getItem(`orderos_img_alts_${effectiveMasterSku}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setImageAltTexts(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [effectiveMasterSku]);

  const navigateBack = (force = false) => {
    if (!force && hasUnsavedChanges && !isSubmitting && !deleteVariant.isPending) {
      setUnsavedModalOpen(true);
      return;
    }
    if (typeof window !== "undefined" && productId) {
      try {
        sessionStorage.setItem("orderos_return_expanded_product", productId);
      } catch {
        // ignore storage errors
      }
    }
    router.push(effectiveReturnPath);
  };

  const activeColorName = editColor.trim() || "Standard";

  const handleUploadImage = async (
    file: File,
    colorName: string,
    replaceFileName?: string
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error(
        "Invalid file format. Only image files (JPEG, PNG, WEBP, etc.) are allowed."
      );
      return;
    }

    if (!effectiveMasterSku) {
      toast.error("Master SKU is required before uploading product images.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("masterSku", effectiveMasterSku);
    formData.append("color", colorName);
    if (replaceFileName) {
      formData.append("replaceFileName", replaceFileName);
    }

    setUploadingColor(colorName);
    try {
      const res = await productService.uploadProductImage(formData, getToken());
      toast.success(`Image for ${colorName} uploaded successfully!`);
      const rawUrl = res.data.imageUrl;
      const cacheBustedUrl = `${toFullImageUrl(rawUrl)}&t=${Date.now()}`;
      setUploadedImages((prev) => ({
        ...prev,
        [colorName]: cacheBustedUrl,
      }));
      setOptimisticGalleryByColor((prev) => {
        const copy = { ...prev };
        delete copy[colorName];
        return copy;
      });
      await refetchImages();
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      }
      queryClient.invalidateQueries({ queryKey: ["product-images", effectiveMasterSku] });
      queryClient.invalidateQueries({ queryKey: ["product-gallery"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: unknown) {
      toast.error(getFriendlyVariantError(err, "Failed to upload image."));
    } finally {
      setUploadingColor(null);
    }
  };

  const handleUploadMultipleImages = async (
    files: FileList | File[],
    colorName: string,
    isAdditionalMode = true
  ) => {
    if (!effectiveMasterSku) {
      toast.error("Master SKU is required before uploading product images.");
      return;
    }

    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) {
      toast.error("Invalid file format. Only image files (JPEG, PNG, WEBP, etc.) are allowed.");
      return;
    }

    setUploadingColor(colorName);
    try {
      const formData = new FormData();
      fileArray.forEach((f) => formData.append("image", f));
      formData.append("masterSku", effectiveMasterSku);
      formData.append("color", colorName);
      if (isAdditionalMode) {
        formData.append("isAdditional", "true");
      }

      await productService.uploadProductImage(formData, getToken());
      toast.success(
        `Uploaded ${fileArray.length} image${fileArray.length > 1 ? "s" : ""} for ${colorName}`
      );
      setOptimisticGalleryByColor((prev) => {
        const copy = { ...prev };
        delete copy[colorName];
        return copy;
      });
      await refetchImages();
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      }
      queryClient.invalidateQueries({ queryKey: ["product-images", effectiveMasterSku] });
      queryClient.invalidateQueries({ queryKey: ["product-gallery"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: unknown) {
      toast.error(getFriendlyVariantError(err, "Failed to upload images."));
    } finally {
      setUploadingColor(null);
    }
  };

  const handleDeleteAngle = async (fileName: string) => {
    if (!effectiveMasterSku || !activeColorName) return;
    try {
      await productService.deleteProductImage(
        effectiveMasterSku,
        activeColorName,
        fileName,
        getToken()
      );
      toast.success("Image removed");
      setOptimisticGalleryByColor((prev) => {
        const copy = { ...prev };
        delete copy[activeColorName];
        return copy;
      });
      await refetchImages();
      setSelectedAngleIndex(0);
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ["product-variants", productId] });
      }
      queryClient.invalidateQueries({ queryKey: ["product-images", effectiveMasterSku] });
      queryClient.invalidateQueries({ queryKey: ["product-gallery"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err: unknown) {
      toast.error(getFriendlyVariantError(err, "Failed to delete image."));
    }
  };

  const handleDropReorder = async (dropTargetIdx: number, sourceIdx?: number) => {
    const fromIdx = sourceIdx !== undefined ? sourceIdx : draggedImgIdx;
    if (
      fromIdx === null ||
      fromIdx === undefined ||
      fromIdx === dropTargetIdx ||
      fromIdx < 0 ||
      fromIdx >= colorAngles.length
    ) {
      setDraggedImgIdx(null);
      setDragOverIdx(null);
      return;
    }

    const currentList = [...colorAngles];
    const [draggedItem] = currentList.splice(fromIdx, 1);
    currentList.splice(dropTargetIdx, 0, draggedItem);
    setDraggedImgIdx(null);
    setDragOverIdx(null);

    const isMainAffected = dropTargetIdx === 0 || fromIdx === 0;
    const isNowMain = dropTargetIdx === 0;

    // 1. Immediately update optimistic gallery in local state so the UI reflects it with zero lag
    setOptimisticGalleryByColor((prev) => ({
      ...prev,
      [activeColorName]: currentList,
    }));

    // 2. If slot 0 (Main) changed, immediately select slot 0 so Current Preview shows the new Main image
    const targetSelection = isMainAffected ? 0 : dropTargetIdx;
    setSelectedAngleIndex(targetSelection);

    if (isMainAffected && currentList[0]?.url) {
      const newMainUrl = currentList[0].url;
      setUploadedImages((prev) => ({
        ...prev,
        [activeColorName]: newMainUrl,
      }));
    }

    if (effectiveMasterSku && activeColorName) {
      setIsReordering(true);
      try {
        const fileNames = currentList.map((item) => item.fileName).filter(Boolean);
        const res = await productService.reorderProductImages(
          effectiveMasterSku,
          activeColorName,
          fileNames,
          getToken()
        );
        toast.success(
          isNowMain
            ? "First image set as Main cover!"
            : "Images reordered successfully"
        );

        // Update localImages with fresh primary image URL from server
        if (res.data?.primaryImageUrl) {
          const freshPrimaryUrl = toFullImageUrl(res.data.primaryImageUrl) || res.data.primaryImageUrl;
          setUploadedImages((prev) => ({
            ...prev,
            [activeColorName]: freshPrimaryUrl,
          }));
        }

        // Sync with the server's cache-busted gallery array
        if (res.data?.gallery && Array.isArray(res.data.gallery)) {
          const freshGallery = res.data.gallery.map((g) => ({
            url: toFullImageUrl(g.url) || g.url || "",
            fileName: g.fileName,
            angle: g.angle || "1",
          }));
          setOptimisticGalleryByColor((prev) => ({
            ...prev,
            [activeColorName]: freshGallery,
          }));
        }

        await refetchImages();
        queryClient.invalidateQueries({ queryKey: ["product-variants"] });
        queryClient.invalidateQueries({ queryKey: ["product-images", effectiveMasterSku] });
        queryClient.invalidateQueries({ queryKey: ["product-gallery"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      } catch (err: unknown) {
        toast.error(getFriendlyVariantError(err, "Failed to reorder images."));
        // Revert optimistic on error
        setOptimisticGalleryByColor((prev) => {
          const copy = { ...prev };
          delete copy[activeColorName];
          return copy;
        });
        await refetchImages();
      } finally {
        setIsReordering(false);
      }
    }
  };

  const handleColorChange = (nextColor: string) => {
    setEditColor(nextColor);
    setPerSizeSkuOverrides({});
    const nextSku =
      editSizes.length === 1
        ? generateVariantSku(nextColor, editSizes[0], effectiveMasterSku)
        : generateVariantSku(nextColor, "", effectiveMasterSku);
    if (nextSku) {
      setEditSku(nextSku);
    }
  };

  const handleSizesChange = (csv: string) => {
    const nextSizes = parseSizesCsv(csv);
    const basePrefix = deriveColorBaseSku(
      editSku,
      editSizes,
      editColor,
      effectiveMasterSku
    );
    setEditSizes(nextSizes);
    setPerSizeSkuOverrides((prev) => {
      const next: Record<string, string> = {};
      nextSizes.forEach((sz) => {
        if (prev[sz]) next[sz] = prev[sz];
      });
      return next;
    });

    if (nextSizes.length === 1) {
      const singleSku =
        perSizeSkuOverrides[nextSizes[0]] ||
        buildSizeSkuFromBase(basePrefix, nextSizes[0]);
      if (singleSku) setEditSku(singleSku);
    } else if (basePrefix) {
      setEditSku(basePrefix);
    }
  };

  const handleGenderChange = (attrKey: string, attrName: string, nextVal: string) => {
    setEditOtherAttrs((prev) => ({
      ...prev,
      [attrKey]: nextVal,
      [attrName]: nextVal,
    }));
    if (genderPricingMap[nextVal]) {
      const pricing = genderPricingMap[nextVal];
      if (pricing.cost > 0) setEditCost(pricing.cost);
      if (pricing.mrp > 0) setEditMrp(pricing.mrp);
    }
  };

  // Variants in the initial color group that have an exact matching size in editSizes vs removed
  const sizeVariantMap = useMemo(() => {
    const map = new Map<string, ProductVariant>();
    colorGroupVariants.forEach((v) => {
      const sz = getSizeValue(v, product).trim().toLowerCase();
      if (sz && !map.has(sz)) {
        map.set(sz, v);
      }
    });
    return map;
  }, [colorGroupVariants, product]);

  const removedExistingVariants = useMemo(() => {
    if (!isColorGroupMode) return [];
    const selectedSet = new Set(editSizes.map((s) => s.toLowerCase()));
    return colorGroupVariants.filter((v) => {
      const sz = getSizeValue(v, product).trim().toLowerCase();
      return Boolean(sz) && !selectedSet.has(sz);
    });
  }, [isColorGroupMode, colorGroupVariants, editSizes, product]);

  // Adjusted per-size variant SKUs derived live from base editSku + color + size
  const resolvedSizeEntries = useMemo(() => {
    const basePrefix = deriveColorBaseSku(
      editSku,
      editSizes,
      editColor,
      effectiveMasterSku
    );
    return editSizes.map((sz) => {
      const existing = sizeVariantMap.get(sz.toLowerCase());
      const autoSku =
        editSizes.length === 1
          ? editSku.trim() || generateVariantSku(editColor, sz, effectiveMasterSku)
          : buildSizeSkuFromBase(basePrefix, sz) ||
          generateVariantSku(editColor, sz, effectiveMasterSku);
      const finalSku = (perSizeSkuOverrides[sz] ?? autoSku).trim();
      return {
        size: sz,
        existingVariant: existing,
        autoSku,
        sku: finalSku,
      };
    });
  }, [editSku, editSizes, editColor, effectiveMasterSku, sizeVariantMap, perSizeSkuOverrides]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant && !(isNewVariant && product)) return;

    if (!canUpdate) {
      toast.error("Access denied. You do not have permission to update variants.");
      return;
    }

    const trimmedSku = editSku.trim();
    if (!trimmedSku || trimmedSku.length < 2) {
      toast.error("Variant SKU must be at least 2 characters.");
      return;
    }

    const numericCost = editCost !== "" ? Number(editCost) : 0;
    const numericMrp = editMrp !== "" ? Number(editMrp) : 0;

    if (Number.isNaN(numericCost) || numericCost < 0) {
      toast.error("Cost must be a valid non-negative number.");
      return;
    }

    if (Number.isNaN(numericMrp) || numericMrp < 0) {
      toast.error("MRP must be a valid non-negative number.");
      return;
    }

    if ((isColorGroupMode || hasSizeAttribute) && editSizes.length === 0 && colorGroupVariants.some((v) => Boolean(getSizeValue(v, product)))) {
      toast.error("Please select at least one size.");
      return;
    }

    if (removedExistingVariants.length > 0 && !canDelete) {
      toast.error("You do not have permission to delete removed sizes.");
      return;
    }

    const effectiveColorVal =
      editColor.trim() ||
      (initialColorName && initialColorName !== "Standard"
        ? initialColorName
        : "") ||
      (variant ? getColorValue(variant, product) : "");

    const buildAttributesForSize = (sizeVal: string) => {
      const attrs: { productAttributeId: string; attributeValue: string }[] = [];
      if (resolvedColorAttrId && effectiveColorVal) {
        attrs.push({
          productAttributeId: resolvedColorAttrId,
          attributeValue: effectiveColorVal,
        });
      }
      if (resolvedSizeAttrId && sizeVal) {
        attrs.push({
          productAttributeId: resolvedSizeAttrId,
          attributeValue: sizeVal,
        });
      }

      let savedGender = false;
      extraAttributes.forEach((attr) => {
        const aId = attr.id;
        const isGender =
          (attr.attributeName || "").toLowerCase().trim() === "gender";
        let val = (
          editOtherAttrs[aId || ""] ??
          editOtherAttrs[attr.attributeName] ??
          ""
        ).trim();
        if (isGender && !val) {
          val = existingGender;
        }
        if (aId && val) {
          attrs.push({
            productAttributeId: aId,
            attributeValue: val,
          });
          if (isGender) savedGender = true;
        }
      });

      if (!savedGender && resolvedGenderAttrId && existingGender) {
        attrs.push({
          productAttributeId: resolvedGenderAttrId,
          attributeValue: existingGender,
        });
      }
      return attrs;
    };

    const effectiveGender =
      (genderAttr
        ? editOtherAttrs[genderAttr.id || ""] ??
        editOtherAttrs[genderAttr.attributeName] ??
        ""
        : ""
      ).trim() || existingGender;

    const targetSizes = editSizes.length > 0 ? editSizes : [""];

    // Fast path: classic single-variant edit with no batch create/delete
    if (
      !isNewVariant &&
      !isColorGroupMode &&
      variant &&
      targetSizes.length === 1 &&
      removedExistingVariants.length === 0
    ) {
      const effectiveSizeVal = targetSizes[0] || getSizeValue(variant, product);
      const duplicate = findDuplicateVariant(
        allVariants,
        variant.id,
        effectiveColorVal,
        effectiveSizeVal,
        effectiveGender,
        existingGender,
        product
      );

      if (duplicate) {
        toast.error(
          `Duplicate record: Variant with Color "${effectiveColorVal || "Standard"}", Size "${effectiveSizeVal}" and Gender "${effectiveGender || "N/A"}" already exists.`
        );
        return;
      }

      const cleanCurrent = getCleanVariantSku(
        variant,
        initialColorName,
        effectiveMasterSku,
        product
      );
      const isCleanSkuUnchanged =
        trimmedSku.toLowerCase() === cleanCurrent.toLowerCase();
      const effectiveSkuToSend = isCleanSkuUnchanged
        ? variant.variantSku
        : trimmedSku;

      try {
        await updateVariant.mutateAsync({
          id: variant.id,
          data: {
            productId: variant.productId,
            variantSku: effectiveSkuToSend,
            cost: numericCost,
            mrp: numericMrp,
            asin: editAsin.trim() || undefined,
            myntraSku: editMyntraSku.trim() || undefined,
            fsnCode: editFsnCode.trim() || undefined,
            rackAddress: editRackAddress.trim() || undefined,
            isActive: editStatus,
            attributes: buildAttributesForSize(effectiveSizeVal),
            expectedUpdatedAt: variant.updatedAt,
          },
        });
        initialFormSnapshotRef.current = currentFormSnapshot;
        queryClient.invalidateQueries({ queryKey: ["product-gallery"] });
        navigateBack(true);
      } catch (err: unknown) {
        toast.error(getFriendlyVariantError(err, "Failed to update variant."));
      }
      return;
    }

    // Batch / Multi-Size path for single color
    const token = getToken();
    const targetProductId = variant?.productId || product?.id || productId;
    if (!targetProductId) {
      toast.error("Product ID missing. Cannot save variants.");
      return;
    }

    const needsCreate = targetSizes.some((sz) => {
      if (!sz) return isNewVariant;
      if (sizeVariantMap.has(sz.toLowerCase())) return false;
      if (!isColorGroupMode && variant && targetSizes[0] === sz) return false;
      return true;
    });
    if (needsCreate && !canCreate) {
      toast.error("Access denied. You do not have permission to create new size variants.");
      return;
    }

    setIsBatchSaving(true);
    let updatedCount = 0;
    let createdCount = 0;
    let deletedCount = 0;

    try {
      const asinChanged =
        editAsin.trim() !== initialMarketplaceRef.current.asin.trim();
      const myntraChanged =
        editMyntraSku.trim() !== initialMarketplaceRef.current.myntraSku.trim();
      const fsnChanged =
        editFsnCode.trim() !== initialMarketplaceRef.current.fsnCode.trim();
      const isMultiTarget = targetSizes.length > 1;

      for (const sz of targetSizes) {
        const entry = resolvedSizeEntries.find(
          (item) => item.size.toLowerCase() === sz.toLowerCase()
        );
        const targetSku = (
          entry?.sku ||
          (targetSizes.length === 1
            ? trimmedSku
            : buildSizeSkuFromBase(trimmedSku, sz)) ||
          generateVariantSku(effectiveColorVal, sz, effectiveMasterSku)
        ).trim();

        const matchedExisting =
          (sz ? sizeVariantMap.get(sz.toLowerCase()) : undefined) ||
          (!isColorGroupMode && !isNewVariant && targetSizes[0] === sz
            ? variant
            : undefined);

        const attrs = buildAttributesForSize(sz);

        if (matchedExisting) {
          const cleanExisting = getCleanVariantSku(
            matchedExisting,
            initialColorName,
            effectiveMasterSku,
            product
          );
          const sameColor =
            (effectiveColorVal || "Standard").toLowerCase() ===
            (initialColorName || "Standard").toLowerCase();
          const effectiveSkuToSend =
            sameColor && targetSku.toLowerCase() === cleanExisting.toLowerCase()
              ? matchedExisting.variantSku
              : targetSku;

          const duplicate = findDuplicateVariant(
            allVariants,
            matchedExisting.id,
            effectiveColorVal,
            sz,
            effectiveGender,
            existingGender,
            product
          );
          if (duplicate) {
            throw new Error(
              `Duplicate record: Variant with Color "${effectiveColorVal || "Standard"}", Size "${sz}" and Gender "${effectiveGender || "N/A"}" already exists.`
            );
          }

          await productVariantService.update(
            matchedExisting.id,
            {
              productId: targetProductId,
              variantSku: effectiveSkuToSend,
              cost: numericCost,
              mrp: numericMrp,
              asin:
                !isMultiTarget || asinChanged
                  ? editAsin.trim() || undefined
                  : matchedExisting.asin || undefined,
              myntraSku:
                !isMultiTarget || myntraChanged
                  ? editMyntraSku.trim() || undefined
                  : matchedExisting.myntraSku || undefined,
              fsnCode:
                !isMultiTarget || fsnChanged
                  ? editFsnCode.trim() || undefined
                  : matchedExisting.fsnCode || undefined,
              rackAddress: editRackAddress.trim() || undefined,
              isActive: editStatus,
              attributes: attrs,
              expectedUpdatedAt: matchedExisting.updatedAt,
            },
            token
          );
          updatedCount++;
        } else {
          const duplicate = findDuplicateVariant(
            allVariants,
            "",
            effectiveColorVal,
            sz,
            effectiveGender,
            existingGender,
            product
          );
          if (duplicate) {
            // Update the existing variant found in target color rather than failing
            await productVariantService.update(
              duplicate.id,
              {
                productId: targetProductId,
                variantSku: targetSku,
                cost: numericCost,
                mrp: numericMrp,
                rackAddress: editRackAddress.trim() || undefined,
                isActive: editStatus,
                attributes: attrs,
              },
              token
            );
            updatedCount++;
          } else {
            await productVariantService.create(
              {
                productId: targetProductId,
                variantSku: targetSku,
                cost: numericCost,
                mrp: numericMrp,
                asin: !isMultiTarget && editAsin.trim() ? editAsin.trim() : undefined,
                myntraSku:
                  !isMultiTarget && editMyntraSku.trim()
                    ? editMyntraSku.trim()
                    : undefined,
                fsnCode:
                  !isMultiTarget && editFsnCode.trim()
                    ? editFsnCode.trim()
                    : undefined,
                rackAddress: editRackAddress.trim() || undefined,
                isActive: editStatus,
                attributes: attrs,
              },
              token
            );
            createdCount++;
          }
        }
      }

      if (removedExistingVariants.length > 0 && canDelete) {
        for (const rem of removedExistingVariants) {
          await productVariantService.delete(rem.id, token);
          deletedCount++;
        }
      }

      queryClient.removeQueries({ queryKey: ["product-variants", targetProductId] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product-gallery"] });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      const summaryParts: string[] = [];
      if (updatedCount > 0) summaryParts.push(`${updatedCount} updated`);
      if (createdCount > 0) summaryParts.push(`${createdCount} added`);
      if (deletedCount > 0) summaryParts.push(`${deletedCount} removed`);

      initialFormSnapshotRef.current = currentFormSnapshot;
      toast.success(
        `Saved variants for ${effectiveColorVal || "Standard"}${summaryParts.length > 0 ? ` (${summaryParts.join(", ")})` : ""
        }.`
      );
      navigateBack(true);
    } catch (err: unknown) {
      toast.error(getFriendlyVariantError(err, "Failed to save variants."));
    } finally {
      setIsBatchSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!variant) return;
    try {
      await deleteVariant.mutateAsync({
        id: variant.id,
        productId: variant.productId,
      });
      setDeleteModalOpen(false);
      navigateBack();
    } catch (err: unknown) {
      toast.error(getFriendlyVariantError(err, "Failed to delete variant."));
    }
  };

  // Resolve image URL for current color
  const matchedColorKey = Object.keys(localImages).find(
    (k) => k.toLowerCase() === activeColorName.toLowerCase()
  );
  const formattedDbUrl = toFullImageUrl(variant?.imageUrl);
  const currentImgUrl =
    (matchedColorKey ? toFullImageUrl(localImages[matchedColorKey]) : undefined) ||
    formattedDbUrl ||
    (effectiveMasterSku
      ? toFullImageUrl(
        `/products/image?masterSku=${encodeURIComponent(
          effectiveMasterSku
        )}&color=${encodeURIComponent(activeColorName)}`
      )
      : undefined);
  const colorAngles = useMemo(() => {
    // 1. Prefer optimistic gallery if user shuffled or modified locally
    if (optimisticGalleryByColor[activeColorName]?.length) {
      return optimisticGalleryByColor[activeColorName];
    }

    const rawList =
      imagesResponse?.gallery?.[activeColorName] ||
      Object.entries(imagesResponse?.gallery || {}).find(
        ([c]) => c.toLowerCase() === activeColorName.toLowerCase()
      )?.[1] ||
      [];

    if (rawList.length > 0) {
      return rawList.map((item) => ({
        url: toFullImageUrl(item.url) || item.url || "",
        fileName: item.fileName,
        angle: item.angle || "1",
      }));
    }

    const fallbackUrl = localImages[activeColorName] || currentImgUrl;
    if (fallbackUrl) {
      return [
        {
          url: fallbackUrl || "",
          fileName: "Main",
          angle: "1",
        },
      ];
    }
    return [];
  }, [
    imagesResponse,
    optimisticGalleryByColor,
    activeColorName,
    localImages,
    currentImgUrl,
  ]);

  const hasImage = Boolean(
    colorAngles.length > 0 ||
    (matchedColorKey && localImages[matchedColorKey]) ||
    formattedDbUrl
  );
  const isUploadingThis = uploadingColor === activeColorName;

  const activeAngleItem =
    colorAngles[selectedAngleIndex] || colorAngles[0];
  const displayedImgUrl =
    activeAngleItem?.url || localImages[activeColorName] || currentImgUrl;

  const isSubmitting = updateVariant.isPending || isBatchSaving;

  const autoPreviewSku =
    editSizes.length === 1
      ? generateVariantSku(editColor, editSizes[0], effectiveMasterSku)
      : generateVariantSku(editColor, "", effectiveMasterSku);
  const isSkuDiverged =
    Boolean(autoPreviewSku) &&
    editSku.trim().toLowerCase() !== autoPreviewSku.toLowerCase();

  const genderValue = genderAttr
    ? editOtherAttrs[genderAttr.id || ""] !== undefined
      ? editOtherAttrs[genderAttr.id || ""]
      : editOtherAttrs[genderAttr.attributeName] !== undefined
        ? editOtherAttrs[genderAttr.attributeName]
        : existingGender
    : existingGender;

  return (
    <DashboardLayout title="Edit Product Variant">
      <div className="space-y-3 font-sans text-slate-900 dark:text-slate-100 py-0 max-w-[1600px] mx-auto">
        {/* Top Header Card */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigateBack()}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title={backLabel}
            >
              <ArrowLeft size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                  Edit Product Variant
                </h1>
                {(editSku || variant?.variantSku) && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
                    <span>{editSku || variant?.variantSku}</span>
                    {editSizes.length > 1 && (
                      <span className="font-sans text-[10px] px-1.5 py-0.2 rounded bg-[#E8C16D]/30 text-[#7A581F] dark:bg-[#F5C451]/25 dark:text-[#F5C451]">
                        {editSizes.length} sizes
                      </span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {product?.productName
                  ? `Update variant details for ${product.productName}${effectiveMasterSku ? ` (${effectiveMasterSku})` : ""}${editColor ? ` — Color: ${editColor}` : ""}.`
                  : "Update variant image, attributes, marketplace mappings, pricing, and SKU."}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => navigateBack()}
              disabled={isSubmitting || deleteVariant.isPending}
              className="inline-flex flex-1 md:flex-initial min-h-[38px] sm:h-11 items-center justify-center px-4 sm:px-6 rounded-full text-xs sm:text-sm font-bold border border-[#E7E0D2] bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-200 dark:hover:bg-white/[0.04] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="edit-variant-form"
              disabled={isSubmitting || deleteVariant.isPending}
              className="inline-flex flex-1 md:flex-initial min-h-[38px] sm:h-11 items-center justify-center gap-2 px-4 sm:px-6 rounded-full text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-current" />
                  <span>Updating...</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>
                    {editSizes.length > 1 ? "Update Variants" : "Update Variant"}
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-xs">
          <form
            id="edit-variant-form"
            onSubmit={handleSubmit}
            className="space-y-3.5 text-slate-900 dark:text-white"
          >
            {/* 1. IMAGE UPLOAD & PREVIEW (Side by side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              {/* Left: Image Upload & Adjust */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLASS}>Variant Image</label>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Color: <strong className="text-slate-700 dark:text-slate-200">{activeColorName}</strong>
                  </span>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (!canCreate || isUploadingThis) return;
                    const droppedFiles = e.dataTransfer.files;
                    if (droppedFiles && droppedFiles.length > 0) {
                      if (droppedFiles.length === 1) {
                        const file = droppedFiles[0];
                        if (file.type.startsWith("image/")) {
                          const objectUrl = URL.createObjectURL(file);
                          setAdjustingImage({
                            url: objectUrl,
                            color: activeColorName,
                            replaceFileName:
                              activeAngleItem?.fileName !== "Main"
                                ? activeAngleItem?.fileName
                                : undefined,
                          });
                        }
                      } else {
                        handleUploadMultipleImages(
                          droppedFiles,
                          activeColorName,
                          true
                        );
                      }
                    }
                  }}
                  onClick={() => {
                    if (!isUploadingThis && canCreate) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`flex-1 min-h-[190px] sm:min-h-[220px] rounded-2xl sm:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-5 text-center transition-all ${canCreate ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                    } ${dragOver
                      ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#F5C451]/10 ring-2 ring-[#E8C16D]/30"
                      : "border-slate-200 dark:border-white/[0.12] bg-slate-50/50 dark:bg-[#0B0F17]/70 hover:border-[#E8C16D] dark:hover:border-[#F5C451]/60 hover:bg-[#FEFAEE]/50 dark:hover:bg-white/[0.02]"
                    }`}
                >
                  {isUploadingThis ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-[#B88728] dark:text-[#F5C451]" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Uploading images...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-white/[0.06] text-[#B88728] dark:text-[#F5C451] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs">
                        <UploadCloud size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs sm:text-sm font-semibold text-[#0A0E1A] dark:text-white">
                          {hasImage
                            ? "Drop images to add or replace"
                            : "Drop images (or select multiple) to browse"}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          Upload multiple images to showcase different views
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        if (e.target.files.length === 1) {
                          const file = e.target.files[0];
                          const objectUrl = URL.createObjectURL(file);
                          setAdjustingImage({
                            url: objectUrl,
                            color: activeColorName,
                            replaceFileName:
                              activeAngleItem?.fileName !== "Main"
                                ? activeAngleItem?.fileName
                                : undefined,
                          });
                        } else {
                          handleUploadMultipleImages(
                            e.target.files,
                            activeColorName,
                            true
                          );
                        }
                        e.target.value = "";
                      }
                    }}
                  />
                </div>

                {/* Adjust Button Below Upload */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingThis || !canCreate}
                    className="flex-1 h-10 sm:h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.03] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={15} className="text-[#B88728] dark:text-[#F5C451]" />
                    <span>Upload Images</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (displayedImgUrl) {
                        setAdjustingImage({
                          url: displayedImgUrl,
                          color: activeColorName,
                          replaceFileName:
                            activeAngleItem?.fileName !== "Main"
                              ? activeAngleItem?.fileName
                              : undefined,
                        });
                      }
                    }}
                    disabled={!hasImage || !displayedImgUrl || isUploadingThis}
                    className="flex-1 h-10 sm:h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#7A581F] dark:text-[#E8C16D] hover:bg-[#FBECC8] dark:hover:bg-[#262014] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      hasImage
                        ? "Adjust crop, move or zoom current image"
                        : "Upload an image first to adjust"
                    }
                  >
                    <Crop size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
                    <span>Adjust Image</span>
                  </button>
                </div>
              </div>

              {/* Right: Current Image Preview with Navigation */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className={LABEL_CLASS}>Current Preview</label>
                    {colorAngles.length > 1 && (
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        (Image {selectedAngleIndex + 1} of {colorAngles.length})
                      </span>
                    )}
                  </div>
                  {hasImage && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                      {activeColorName}
                    </span>
                  )}
                </div>

                <div className="relative flex-1 min-h-[235px] sm:min-h-[265px] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/40 dark:bg-[#0B0F17]/60 flex items-center justify-center p-4 overflow-hidden">
                  {isUploadingThis ? (
                    <div className="flex flex-col items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-7 w-7 animate-spin text-[#E8C16D]" />
                      <span className="text-xs">Updating preview...</span>
                    </div>
                  ) : hasImage && displayedImgUrl ? (
                    <>
                      <img
                        src={displayedImgUrl}
                        alt={`${activeColorName} Image ${selectedAngleIndex + 1}`}
                        onClick={() =>
                          setPreviewImage({
                            url: displayedImgUrl,
                            color: activeColorName,
                            angleIndex: selectedAngleIndex,
                          })
                        }
                        className="max-h-[220px] sm:max-h-[250px] w-auto rounded-2xl object-contain shadow-xs cursor-pointer hover:scale-[1.02] transition-transform"
                        title="Click to view full image"
                      />

                      {/* Left / Right Quick Image Buttons */}
                      {colorAngles.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAngleIndex((prev) =>
                                prev > 0 ? prev - 1 : colorAngles.length - 1
                              );
                            }}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-xs"
                            title="Previous image"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAngleIndex((prev) =>
                                prev < colorAngles.length - 1 ? prev + 1 : 0
                              );
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-md backdrop-blur-xs"
                            title="Next image"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-center text-slate-400 dark:text-slate-500">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-slate-300/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]">
                        {effectiveMasterSku ? (
                          <ImageIcon size={22} />
                        ) : (
                          <ImagePlus size={22} />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        No image uploaded
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Upload images on the left to preview
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Images Strip & Drag-and-Drop Reordering */}
            <div className="pt-3.5 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Product Images ({colorAngles.length})
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    • Drag to shuffle (1st is Main)
                  </span>
                </div>
                {isReordering && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B88728] dark:text-[#F5C451]">
                    <Loader2 size={12} className="animate-spin" />
                    Saving order...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {colorAngles.map((imgItem, idx) => {
                  const isActive = idx === selectedAngleIndex;
                  const isDragging = idx === draggedImgIdx;
                  const isDragOver = idx === dragOverIdx;
                  const isMain = idx === 0;

                  return (
                    <div
                      key={imgItem.fileName || idx}
                      draggable={canCreate && !isReordering}
                      onDragStart={(e) => {
                        setDraggedImgIdx(idx);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(idx));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverIdx !== idx) setDragOverIdx(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverIdx === idx) setDragOverIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const data = e.dataTransfer.getData("text/plain");
                        const source =
                          data !== "" ? parseInt(data, 10) : (draggedImgIdx ?? undefined);
                        handleDropReorder(idx, source);
                      }}
                      onDragEnd={() => {
                        setDraggedImgIdx(null);
                        setDragOverIdx(null);
                      }}
                      onClick={() => setSelectedAngleIndex(idx)}
                      tabIndex={0}
                      role="button"
                      aria-label={isMain ? `Main image ${idx + 1}` : `Image ${idx + 1}`}
                      onKeyDown={(e) => {
                        if (!canCreate || isReordering) return;
                        if (e.key === "ArrowLeft" && idx > 0) {
                          e.preventDefault();
                          handleDropReorder(idx - 1, idx);
                        } else if (e.key === "ArrowRight" && idx < colorAngles.length - 1) {
                          e.preventDefault();
                          handleDropReorder(idx + 1, idx);
                        }
                      }}
                      className={cn(
                        "group relative h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-xl sm:rounded-2xl border-2 p-1 bg-white dark:bg-[#0B0F17] cursor-grab active:cursor-grabbing transition-all overflow-hidden flex items-center justify-center shadow-2xs select-none focus:outline-none focus:ring-2 focus:ring-[#E8C16D]",
                        isActive
                          ? "border-[#E8C16D] dark:border-[#F5C451] ring-2 ring-[#E8C16D]/30"
                          : "border-slate-200 dark:border-white/[0.08] hover:border-slate-400 dark:hover:border-white/20",
                        isDragging && "opacity-40 scale-95 border-dashed border-amber-400",
                        isDragOver && !isDragging && "ring-2 ring-emerald-500 scale-105 border-emerald-500"
                      )}
                      title={
                        isMain
                          ? "Main Image (Drag or press Left/Right arrow keys to shuffle)"
                          : `Image #${idx + 1} (Drag or press Left/Right arrow keys to shuffle)`
                      }
                    >
                      <img
                        src={imgItem.url}
                        alt={imageAltTexts[`${activeColorName}::${imgItem.fileName}`] || `${activeColorName} Image ${idx + 1}`}
                        className="h-full w-full object-contain rounded-lg pointer-events-none"
                      />

                      {/* Keyboard / Arrow-button Left/Right reorder controls */}
                      {canCreate && colorAngles.length > 1 && (
                        <div className="absolute top-0.5 left-0.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDropReorder(idx - 1, idx);
                              }}
                              className="h-4 w-4 rounded bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer"
                              title="Move left"
                              aria-label={`Move image ${idx + 1} left`}
                            >
                              <ChevronLeft size={10} />
                            </button>
                          )}
                          {idx < colorAngles.length - 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDropReorder(idx + 1, idx);
                              }}
                              className="h-4 w-4 rounded bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer"
                              title="Move right"
                              aria-label={`Move image ${idx + 1} right`}
                            >
                              <ChevronRight size={10} />
                            </button>
                          )}
                        </div>
                      )}
                      {/* Position badge: Main or number */}
                      <span
                        className={cn(
                          "absolute bottom-0.5 right-1 text-[9px] font-black px-1.5 py-0.2 rounded backdrop-blur-xs",
                          isMain
                            ? "bg-[#E8C16D] text-slate-900 shadow-xs"
                            : "bg-black/75 text-white"
                        )}
                      >
                        {isMain ? "Main" : `#${idx + 1}`}
                      </span>

                      {/* Quick button to make Main if not index 0 */}
                      {!isMain && canCreate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDropReorder(0, idx);
                          }}
                          className="absolute bottom-0.5 left-1 text-[9px] font-bold px-1 rounded bg-[#E8C16D]/90 text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#dfb458] shadow-xs"
                          title="Make this Main image"
                        >
                          Set Main
                        </button>
                      )}

                      {/* Delete this image (with confirmation) */}
                      {colorAngles.length > 1 && canCreate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteImageTarget({
                              fileName: imgItem.fileName,
                              url: imgItem.url,
                            });
                          }}
                          className="absolute top-0.5 right-0.5 h-4.5 w-4.5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity hover:bg-red-700 shadow-xs"
                          title="Delete this image"
                          aria-label={`Delete image ${idx + 1}`}
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* + Add Image Button */}
                <button
                  type="button"
                  onClick={() => addImageInputRef.current?.click()}
                  disabled={isUploadingThis || !canCreate}
                  className="h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-xl sm:rounded-2xl border-2 border-dashed border-[#E8C16D]/60 dark:border-[#F5C451]/40 bg-[#FFF9EC]/40 dark:bg-[#1A160E]/40 hover:bg-[#FBECC8]/60 dark:hover:bg-[#262014] text-[#7A581F] dark:text-[#E8C16D] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Upload additional images"
                >
                  <Plus size={16} />
                  <span className="text-[10px] font-bold">+ Image</span>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={addImageInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUploadMultipleImages(
                        e.target.files,
                        activeColorName,
                        true
                      );
                      e.target.value = "";
                    }
                  }}
                />
              </div>

              {/* Alt Text / Caption for Active Image (F6) */}
              {activeAngleItem?.fileName && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                  <label
                    htmlFor="active-image-alt"
                    className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0"
                  >
                    Image #{selectedAngleIndex + 1} Alt Text:
                  </label>
                  <input
                    id="active-image-alt"
                    type="text"
                    maxLength={250}
                    value={imageAltTexts[`${activeColorName}::${activeAngleItem.fileName}`] || ""}
                    onChange={(e) => {
                      const key = `${activeColorName}::${activeAngleItem.fileName}`;
                      const nextVal = e.target.value;
                      setImageAltTexts((prev) => {
                        const updated = { ...prev, [key]: nextVal };
                        if (typeof window !== "undefined" && effectiveMasterSku) {
                          try {
                            localStorage.setItem(
                              `orderos_img_alts_${effectiveMasterSku}`,
                              JSON.stringify(updated)
                            );
                          } catch {
                            // ignore storage errors
                          }
                        }
                        return updated;
                      });
                    }}
                    placeholder={`Describe ${activeColorName} image #${selectedAngleIndex + 1} (for accessibility & SEO)...`}
                    className="flex-1 h-8 px-3 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#E8C16D]"
                  />
                </div>
              )}
            </div>

            {/* 2. VARIANT SKU & VARIANT STATUS */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Variant SKU */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className={LABEL_CLASS}>
                      {editSizes.length > 1 ? "Color Base SKU" : "Variant SKU"}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    {isSkuDiverged && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditSku(autoPreviewSku);
                          setPerSizeSkuOverrides({});
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B88728] dark:text-[#F5C451] hover:underline cursor-pointer"
                        title={`Reset to ${autoPreviewSku}`}
                      >
                        <RotateCcw size={11} />
                        <span>Auto: {autoPreviewSku}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    placeholder="Enter Variant SKU..."
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>

                {/* Variant Status */}
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Variant Status</label>
                  <div className="flex h-11 sm:h-12 items-center justify-between px-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-slate-50/50 dark:border-white/[0.08] dark:bg-[#0B0F17] transition-all">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Status:
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${editStatus
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                          }`}
                      >
                        {editStatus ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <Switch
                      checked={editStatus}
                      onCheckedChange={setEditStatus}
                    />
                  </div>
                </div>
              </div>

              {/* Auto-Adjusted Per-Size Variant SKUs Preview when Multiple Sizes Selected */}
              {resolvedSizeEntries.length > 1 && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0B0F17]/70 p-3 sm:p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Variant SKUs for {activeColorName} ({resolvedSizeEntries.length} sizes)
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Click a chip to customize its individual SKU
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resolvedSizeEntries.map((entry) => {
                      const isEditingThis = editingSizeSku === entry.size;
                      const isOverridden = Boolean(perSizeSkuOverrides[entry.size]);
                      return isEditingThis ? (
                        <div
                          key={entry.size}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#E8C16D] bg-white dark:bg-[#0F1626] px-2 py-1 shadow-xs"
                        >
                          <span className="text-[11px] font-bold text-[#B88728] dark:text-[#F5C451] px-1">
                            {entry.size}
                          </span>
                          <input
                            type="text"
                            autoFocus
                            value={perSizeSkuOverrides[entry.size] ?? entry.sku}
                            onChange={(e) =>
                              setPerSizeSkuOverrides((prev) => ({
                                ...prev,
                                [entry.size]: e.target.value,
                              }))
                            }
                            onBlur={() => setEditingSizeSku(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === "Escape") {
                                e.preventDefault();
                                setEditingSizeSku(null);
                              }
                            }}
                            className="w-44 text-[11px] font-mono font-bold text-[#0A0E1A] dark:text-white bg-transparent outline-none"
                          />
                          {isOverridden && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setPerSizeSkuOverrides((prev) => {
                                  const next = { ...prev };
                                  delete next[entry.size];
                                  return next;
                                });
                              }}
                              title="Reset to auto SKU"
                              className="text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          key={entry.size}
                          type="button"
                          onClick={() => setEditingSizeSku(entry.size)}
                          title="Click to edit SKU for this size"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] hover:border-[#E8C16D] dark:hover:border-[#F5C451]/50 text-[11px] transition-all cursor-pointer shadow-2xs"
                        >
                          <span className="font-extrabold text-[#0A0E1A] dark:text-white">
                            {entry.size}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                            {entry.sku}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${entry.existingVariant
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                                : "bg-[#FFF9EC] text-[#B88728] dark:bg-[#F5C451]/15 dark:text-[#F5C451]"
                              }`}
                          >
                            {entry.existingVariant ? "Saved" : "+ New"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. COLOR & SIZE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              {/* Color Selector (Edit Product style) */}
              <div className="space-y-1.5">
                {resolvedColorAttrId ? (
                  <ColorMultiSelect
                    label="Color"
                    singleSelect
                    value={editColor ? [editColor] : []}
                    onChange={(cols) => handleColorChange(cols[0] || "")}
                    additionalColors={dynamicColors}
                    disabledColors={disabledColors}
                    colorHexMap={serverColorHexMap}
                    useExternalColorsOnly={Boolean(dropdownData)}
                  />
                ) : (
                  <div>
                    <label className={LABEL_CLASS}>Color</label>
                    <div className="mt-1.5 flex h-11 sm:h-12 items-center gap-2 px-3.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-white/[0.08] dark:bg-[#0B0F17]/70 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-white/20"
                        style={{
                          backgroundColor: getColorHex(editColor || "Standard"),
                        }}
                      />
                      <span>{editColor || "Standard"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Size Selector (Multi-Size for Single Color) */}
              <div className="space-y-1.5">
                {hasSizeAttribute || editSizes.length > 0 ? (
                  <>
                    <SizeMultiSelect
                      label={editColor ? `Sizes (${editColor})` : "Size"}
                      value={editSizes.join(", ")}
                      onChange={handleSizesChange}
                      additionalSizes={[
                        ...(product?.category?.toLowerCase().includes("shoe") ||
                          product?.category?.toLowerCase().includes("footwear")
                          ? defaultShoeSizes
                          : []),
                        ...dynamicSizes,
                      ]}
                      disabledSizes={disabledSizes}
                      externalAlphaSizes={dbSizeGroups.alphaSizes}
                      externalNumericSizes={dbSizeGroups.numericSizes}
                      useExternalSizesOnly={Boolean(dropdownData)}
                    />
                    {removedExistingVariants.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-amber-50/90 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                        <span>
                          Removing{" "}
                          <strong>
                            {removedExistingVariants
                              .map((v) => getSizeValue(v, product))
                              .filter(Boolean)
                              .join(", ")}
                          </strong>{" "}
                          on save
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const restored = [
                              ...editSizes,
                              ...removedExistingVariants
                                .map((v) => getSizeValue(v, product).trim())
                                .filter(Boolean),
                            ];
                            handleSizesChange(restored.join(", "));
                          }}
                          className="font-bold underline hover:opacity-80 cursor-pointer"
                        >
                          Undo
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className={LABEL_CLASS}>Size</label>
                    <div className="mt-1.5 flex h-11 sm:h-12 items-center px-3.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-white/[0.08] dark:bg-[#0B0F17]/70 text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">
                      Not applicable for this product
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4. GENDER & REMAINING CATEGORY ATTRIBUTES (Side by side with Gender) */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
              <div className={`grid grid-cols-1 ${remainingAttributes.length > 0 ? "md:grid-cols-2" : "md:grid-cols-1"} gap-3.5`}>
                {/* Gender Selector (Edit Product style) */}
                <div className="space-y-1.5">
                  {genderAttr ? (
                    <GenderMultiSelect
                      label="Gender"
                      value={
                        Array.isArray(genderValue)
                          ? genderValue
                          : typeof genderValue === "string" && genderValue.trim()
                            ? genderValue.split(",").map((s) => s.trim()).filter(Boolean)
                            : []
                      }
                      options={genderDropdownOptions}
                      onChange={(vals) =>
                        handleGenderChange(
                          genderAttr.id || "",
                          genderAttr.attributeName,
                          vals.join(", ")
                        )
                      }
                      placeholder="Select Gender..."
                    />
                  ) : (
                    <div>
                      <label className={LABEL_CLASS}>Gender</label>
                      <div className="mt-1.5 flex h-11 sm:h-12 items-center px-3.5 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/70 dark:border-white/[0.08] dark:bg-[#0B0F17]/70 text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">
                        {existingGender || "Not specified"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Remaining side with Gender: first remaining attribute if any, or extra attributes */}
                {remainingAttributes.length > 0 && (
                  <div className="space-y-1.5">
                    <DropdownWithOther
                      label={remainingAttributes[0].attributeName}
                      value={
                        editOtherAttrs[remainingAttributes[0].id || ""] !== undefined
                          ? editOtherAttrs[remainingAttributes[0].id || ""]
                          : editOtherAttrs[remainingAttributes[0].attributeName] !== undefined
                            ? editOtherAttrs[remainingAttributes[0].attributeName]
                            : ""
                      }
                      options={buildMergedOptions(
                        remainingAttributes[0].attributeName,
                        [],
                        dropdownData?.savedOptions
                      )}
                      onChange={(val) => {
                        setEditOtherAttrs((prev) => ({
                          ...prev,
                          [remainingAttributes[0].id || ""]: val,
                          [remainingAttributes[0].attributeName]: val,
                        }));
                      }}
                      placeholder={`Select or enter ${remainingAttributes[0].attributeName}...`}
                      fieldKey={remainingAttributes[0].attributeName}
                      allowOther={true}
                    />
                  </div>
                )}
              </div>

              {/* If more than 1 remaining attribute, display them cleanly */}
              {remainingAttributes.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5 pt-1">
                  {remainingAttributes.slice(1).map((attr) => {
                    const attrKey = attr.id || attr.attributeName;
                    const currentVal =
                      editOtherAttrs[attr.id || ""] !== undefined
                        ? editOtherAttrs[attr.id || ""]
                        : editOtherAttrs[attr.attributeName] !== undefined
                          ? editOtherAttrs[attr.attributeName]
                          : "";

                    return (
                      <div key={attrKey} className="space-y-1.5">
                        <DropdownWithOther
                          label={attr.attributeName}
                          value={currentVal}
                          options={buildMergedOptions(
                            attr.attributeName,
                            [],
                            dropdownData?.savedOptions
                          )}
                          onChange={(val) => {
                            setEditOtherAttrs((prev) => ({
                              ...prev,
                              [attr.id || ""]: val,
                              [attr.attributeName]: val,
                            }));
                          }}
                          placeholder={`Select or enter ${attr.attributeName}...`}
                          fieldKey={attr.attributeName}
                          allowOther={true}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. COST & MRP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              {/* Cost */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Cost (₹)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-semibold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCost}
                    onFocus={(e) => {
                      if (
                        e.target.value === "0" ||
                        e.target.value === "0.00" ||
                        Number(e.target.value) === 0
                      ) {
                        setEditCost("");
                      }
                    }}
                    onClick={(e) => {
                      if (
                        e.currentTarget.value === "0" ||
                        e.currentTarget.value === "0.00" ||
                        Number(e.currentTarget.value) === 0
                      ) {
                        setEditCost("");
                      }
                    }}
                    onChange={(e) => setEditCost(e.target.value)}
                    placeholder="0.00"
                    className={`${INPUT_CLASS} pl-8 font-mono`}
                  />
                </div>
              </div>

              {/* MRP */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>MRP (₹)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-semibold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editMrp}
                    onFocus={(e) => {
                      if (
                        e.target.value === "0" ||
                        e.target.value === "0.00" ||
                        Number(e.target.value) === 0
                      ) {
                        setEditMrp("");
                      }
                    }}
                    onClick={(e) => {
                      if (
                        e.currentTarget.value === "0" ||
                        e.currentTarget.value === "0.00" ||
                        Number(e.currentTarget.value) === 0
                      ) {
                        setEditMrp("");
                      }
                    }}
                    onChange={(e) => setEditMrp(e.target.value)}
                    placeholder="0.00"
                    className={`${INPUT_CLASS} pl-8 font-mono`}
                  />
                </div>
              </div>
            </div>

            {/* 6. ASIN, FSN, MYNTRA, RACK */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {showAsin && (
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>ASIN</label>
                    <input
                      type="text"
                      value={editAsin}
                      onChange={(e) => setEditAsin(e.target.value)}
                      placeholder="e.g. B0XXXXXX"
                      className={`${INPUT_CLASS} font-mono`}
                    />
                  </div>
                )}

                {showFsnCode && (
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>FSN Code</label>
                    <input
                      type="text"
                      value={editFsnCode}
                      onChange={(e) => setEditFsnCode(e.target.value)}
                      placeholder="Enter FSN Code..."
                      className={`${INPUT_CLASS} font-mono`}
                    />
                  </div>
                )}

                {showMyntraSku && (
                  <div className="space-y-1.5">
                    <label className={LABEL_CLASS}>Myntra SKU</label>
                    <input
                      type="text"
                      value={editMyntraSku}
                      onChange={(e) => setEditMyntraSku(e.target.value)}
                      placeholder="Enter Myntra SKU..."
                      className={`${INPUT_CLASS} font-mono`}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Rack Address</label>
                  <input
                    type="text"
                    value={editRackAddress}
                    onChange={(e) => setEditRackAddress(e.target.value)}
                    placeholder="e.g. RACK-A1"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Bottom Actions */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {canDelete && variant ? (
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                disabled={isSubmitting || deleteVariant.isPending}
                className="w-full sm:w-auto h-10 px-4 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/80 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={15} />
                <span>Delete Variant</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigateBack()}
                disabled={isSubmitting || deleteVariant.isPending}
                className="flex-1 sm:flex-none h-10 px-5 rounded-xl text-xs font-semibold border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-slate-300 dark:hover:bg-white/[0.03] disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98] text-center"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="edit-variant-form"
                disabled={isSubmitting || deleteVariant.isPending}
                className="flex-1 sm:flex-none h-10 px-6 rounded-xl text-xs font-semibold bg-[#E8C16D] hover:bg-[#dfb458] active:scale-[0.98] text-[#0A0E1A] transition-all cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-current" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    <span>
                      {editSizes.length > 1 ? "Update Variants" : "Update Variant"}
                    </span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-3xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-[#0F1626] border border-slate-200/90 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {previewImage.color}
                </h3>
                {colorAngles.length > 1 && (
                  <span className="text-xs text-slate-500 font-semibold">
                    (Image {(previewImage.angleIndex ?? selectedAngleIndex) + 1} of {colorAngles.length})
                  </span>
                )}
                {effectiveMasterSku && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20">
                    {effectiveMasterSku}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative py-4 flex justify-center items-center">
              <img
                src={previewImage.url}
                alt={previewImage.color}
                className="max-h-[60vh] w-auto rounded-2xl object-contain shadow-sm"
              />

              {colorAngles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIdx = previewImage.angleIndex ?? selectedAngleIndex;
                      const nextIdx = currentIdx > 0 ? currentIdx - 1 : colorAngles.length - 1;
                      const nextItem = colorAngles[nextIdx];
                      if (nextItem && nextItem.url) {
                        setPreviewImage({
                          url: nextItem.url,
                          color: previewImage.color,
                          angleIndex: nextIdx,
                        });
                        setSelectedAngleIndex(nextIdx);
                      }
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs"
                    title="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentIdx = previewImage.angleIndex ?? selectedAngleIndex;
                      const nextIdx = currentIdx < colorAngles.length - 1 ? currentIdx + 1 : 0;
                      const nextItem = colorAngles[nextIdx];
                      if (nextItem && nextItem.url) {
                        setPreviewImage({
                          url: nextItem.url,
                          color: previewImage.color,
                          angleIndex: nextIdx,
                        });
                        setSelectedAngleIndex(nextIdx);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs"
                    title="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Image Strip inside Lightbox */}
            {colorAngles.length > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-3">
                {colorAngles.map((imgItem, idx) => {
                  const isCurrent =
                    (previewImage.angleIndex ?? selectedAngleIndex) === idx;
                  return (
                    <button
                      key={imgItem.fileName || idx}
                      type="button"
                      onClick={() => {
                        setPreviewImage({
                          url: imgItem.url || "",
                          color: previewImage.color,
                          angleIndex: idx,
                        });
                        setSelectedAngleIndex(idx);
                      }}
                      className={cn(
                        "h-12 w-12 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer bg-white p-0.5",
                        isCurrent
                          ? "border-[#E8C16D] ring-2 ring-[#E8C16D]/30"
                          : "border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100"
                      )}
                    >
                      <img
                        src={imgItem.url}
                        alt={`Image ${idx + 1}`}
                        className="h-full w-full object-contain rounded-lg"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  const targetUrl = previewImage.url;
                  const targetCol = previewImage.color;
                  const currentIdx = previewImage.angleIndex ?? selectedAngleIndex;
                  const targetItem = colorAngles[currentIdx];
                  setPreviewImage(null);
                  setAdjustingImage({
                    url: targetUrl,
                    color: targetCol,
                    replaceFileName:
                      targetItem?.fileName !== "Main"
                        ? targetItem?.fileName
                        : undefined,
                  });
                }}
                disabled={isUploadingThis}
                className="h-10 px-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold rounded-xl border border-[#E8C16D]/60 bg-[#FFF9EC] dark:bg-[#1A160E] text-[#7A581F] dark:text-[#E8C16D] hover:bg-[#FBECC8] dark:hover:bg-[#262014] transition-all cursor-pointer shadow-2xs"
              >
                <Crop size={15} className="text-[#B88728] dark:text-[#E8C16D]" />
                <span>Adjust Image</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                  setPreviewImage(null);
                }}
                className="h-10 px-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold rounded-xl bg-[#E8C16D] text-slate-900 hover:bg-[#dfb458] transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Camera size={15} />
                <span>Upload More Images</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {adjustingImage && (
        <ProductImageAdjustModal
          isOpen={Boolean(adjustingImage)}
          onClose={() => setAdjustingImage(null)}
          imageSrc={adjustingImage.url}
          colorName={adjustingImage.color}
          masterSku={effectiveMasterSku}
          productName={product?.productName}
          category={product?.category}
          onConfirm={async (file: File) => {
            const color = adjustingImage.color;
            const replace = adjustingImage.replaceFileName;
            await handleUploadImage(file, color, replace);
            setAdjustingImage(null);
          }}
          isUploading={uploadingColor === adjustingImage.color}
        />
      )}

      <DeleteVariantModal
        open={deleteModalOpen}
        variant={variant ?? null}
        loading={deleteVariant.isPending}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Delete Image Confirmation Modal (F3) */}
      {deleteImageTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setDeleteImageTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F1626] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={18} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Image?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This will permanently remove <span className="font-mono font-semibold">{deleteImageTarget.fileName}</span> from storage.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteImageTarget(null)}
                className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = deleteImageTarget;
                  setDeleteImageTarget(null);
                  await handleDeleteAngle(target.fileName);
                }}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Delete Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal (BUG-04) */}
      {unsavedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setUnsavedModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0F1626] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Discard unsaved changes?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have unsaved edits on this variant. Leaving now will discard them.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUnsavedModalOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setUnsavedModalOpen(false);
                  navigateBack(true);
                }}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-[#E8C16D] hover:bg-[#dfb458] text-[#0A0E1A] cursor-pointer"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
