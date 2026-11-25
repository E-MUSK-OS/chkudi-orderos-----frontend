"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productService } from "../services/product.service";
import Button from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import type { Product, ProductAttribute } from "../types/product.types";
import type { ProductVariant } from "../types/productVariant.types";
import {
  useCreateProductVariant,
  useDeleteProductVariant,
  useProductVariants,
  useUpdateProductVariant,
} from "../hooks/useProductVariants";
import { getSizeRank } from "../constants/product.constants";
import { usePagePermissions } from "@/utils/pagePermissions";
import {
  buildExtraAttributes,
  buildGenderPricingMap,
  checkHasSizeAttribute,
  findDuplicateVariant,
  generateVariantSku as buildVariantSku,
  getActiveMarketplacesInfo,
  getCleanVariantSku as buildCleanVariantSku,
  getColorHex,
  getColorValue as extractColorValue,
  getDefinedSizes,
  getGenderValue as extractGenderValue,
  getSizeValue as extractSizeValue,
  resolveAttributeId,
  resolveAvailableGenders,
  resolveExistingGender,
  toFullImageUrl,
} from "../utils/productVariant.utils";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  ImagePlus,
  Camera,
  Crop,
} from "lucide-react";
import DeleteVariantModal from "./DeleteVariantModal";
import ProductImageAdjustModal from "./ProductImageAdjustModal";
import { toast } from "sonner";

interface Props {
  productId: string;
  attributes: ProductAttribute[];
  masterSku?: string;
  product?: Product;
  marketplace?: string | string[];
  parentScrollRef?: React.RefObject<HTMLDivElement | null>;
}

interface ColorGroup {
  colorKey: string;
  colorName: string;
  colorAttrId?: string;
  variants: ProductVariant[];
}

export default function ProductVariantInline({
  productId,
  attributes,
  masterSku,
  product,
  marketplace,
  parentScrollRef,
}: Props) {
  const router = useRouter();
  const { canUpdate } = usePagePermissions("settings/manage-product");
  const { data, isLoading } = useProductVariants(productId);
  const createVariant = useCreateProductVariant();
  const updateVariant = useUpdateProductVariant();
  const deleteVariant = useDeleteProductVariant();

  const innerScrollRef = useRef<HTMLDivElement | null>(null);

  // Synchronize horizontal scrolling 1:1 between outer table and inner variant table
  useEffect(() => {
    const inner = innerScrollRef.current;
    const outer = parentScrollRef?.current;
    if (!inner || !outer) return;

    let isSyncing = false;

    // Initially match outer scroll position
    inner.scrollLeft = outer.scrollLeft;

    const handleInnerScroll = () => {
      if (isSyncing) return;
      isSyncing = true;
      outer.scrollLeft = inner.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    const handleOuterScroll = () => {
      if (isSyncing) return;
      isSyncing = true;
      inner.scrollLeft = outer.scrollLeft;
      requestAnimationFrame(() => {
        isSyncing = false;
      });
    };

    inner.addEventListener("scroll", handleInnerScroll, { passive: true });
    outer.addEventListener("scroll", handleOuterScroll, { passive: true });

    return () => {
      inner.removeEventListener("scroll", handleInnerScroll);
      outer.removeEventListener("scroll", handleOuterScroll);
    };
  }, [parentScrollRef]);

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  const effectiveMasterSku = (masterSku || product?.masterSku || "").trim();

  // Normalize active marketplace selection
  const { showAsin, showMyntraSku, showFsnCode } = useMemo(
    () => getActiveMarketplacesInfo(marketplace, product),
    [marketplace, product]
  );

  // Color images state & upload
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [adjustingImage, setAdjustingImage] = useState<{
    url: string;
    color: string;
  } | null>(null);
  const [dragOverColor, setDragOverColor] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; color: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") ?? "";
  };

  // Fetch images for this product's masterSku from backend NAS
  const { data: imagesResponse, refetch: refetchImages } = useQuery({
    queryKey: ["product-images", effectiveMasterSku],
    queryFn: () => productService.getProductImages(effectiveMasterSku, getToken()),
    enabled: !!effectiveMasterSku,
    staleTime: 1000 * 60 * 5,
  });

  const serverImages = useMemo(() => {
    if (!imagesResponse?.data) return {};
    const formatted: Record<string, string> = {};
    for (const [color, pathUrl] of Object.entries(imagesResponse.data)) {
      const full = toFullImageUrl(pathUrl as string);
      if (full) formatted[color] = full;
    }
    return formatted;
  }, [imagesResponse]);

  const effectiveImages = useMemo(() => ({
    ...serverImages,
    ...uploadedImages,
  }), [serverImages, uploadedImages]);

  const handleUploadImage = async (file: File, colorName: string) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format. Only image files (JPEG, PNG, WEBP, etc.) are allowed.");
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
      refetchImages();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      toast.error(msg);
    } finally {
      setUploadingColor(null);
    }
  };

  // Single variant editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const inlineFieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const [editSku, setEditSku] = useState("");
  const [editCost, setEditCost] = useState<number | string>("");
  const [editMrp, setEditMrp] = useState<number | string>("");
  const [editSize, setEditSize] = useState("");
  const [editAsin, setEditAsin] = useState("");
  const [editMyntraSku, setEditMyntraSku] = useState("");
  const [editFsnCode, setEditFsnCode] = useState("");
  const [editRackAddress, setEditRackAddress] = useState("");
  const [editStatus, setEditStatus] = useState(true);
  const [editOtherAttrs, setEditOtherAttrs] = useState<Record<string, string>>(
    {}
  );

  // Focus the double-clicked field once inline editing activates
  useEffect(() => {
    if (!editingId || !focusedField) return;
    const fieldKey = focusedField;
    requestAnimationFrame(() => {
      const target = inlineFieldRefs.current[`${editingId}:${fieldKey}`];
      if (target) {
        if (fieldKey === "status") {
          target.querySelector<HTMLElement>('[data-slot="switch"]')?.focus();
        } else {
          target.focus();
        }
      }
      setFocusedField(null);
    });
  }, [editingId, focusedField]);

  // Adding new color row state
  const [isAdding, setIsAdding] = useState(false);
  const [newColor, setNewColor] = useState("");
  const [newSizesInput, setNewSizesInput] = useState("");
  const [newCost, setNewCost] = useState<number | string>("");
  const [newMrp, setNewMrp] = useState<number | string>("");
  const [newGender, setNewGender] = useState("");
  const [customBaseSku, setCustomBaseSku] = useState("");
  const [newAsin, setNewAsin] = useState("");
  const [newMyntraSku, setNewMyntraSku] = useState("");
  const [newFsnCode, setNewFsnCode] = useState("");
  const [newRackAddress, setNewRackAddress] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Quick add size inside existing color row state
  const [quickAddColorKey, setQuickAddColorKey] = useState<string | null>(null);
  const [quickAddSizesInput, setQuickAddSizesInput] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Extract helpers bound to product context
  const getSizeValue = (variant: ProductVariant): string =>
    extractSizeValue(variant, product);

  const getColorValue = (variant: ProductVariant): string =>
    extractColorValue(variant, product);

  // Resolve existing Gender value for the product
  const existingGender = useMemo(
    () => resolveExistingGender(data?.data || [], product, attributes),
    [data, product, attributes]
  );

  const getGenderValue = (variant: ProductVariant): string =>
    extractGenderValue(variant, existingGender);

  // List of all distinct genders available for this product
  const availableGenders = useMemo(
    () => resolveAvailableGenders(data?.data || [], product, existingGender),
    [product, data, existingGender]
  );

  // Map of gender to known Cost and MRP from existing variants
  const genderPricingMap = useMemo(
    () => buildGenderPricingMap(data?.data || []),
    [data]
  );

  const handleNewGenderChange = (selectedGen: string) => {
    setNewGender(selectedGen);
    // Real-time update Cost & MRP according to the selected gender!
    if (genderPricingMap[selectedGen]) {
      const pricing = genderPricingMap[selectedGen];
      if (pricing.cost > 0) {
        setNewCost(pricing.cost);
      }
      if (pricing.mrp > 0) {
        setNewMrp(pricing.mrp);
      }
    }
  };

  // Resolve productAttributeId for Gender
  const resolvedGenderAttrId = useMemo(
    () => resolveAttributeId(["gender"], attributes, product, data?.data || []),
    [attributes, product, data]
  );

  // Extra attributes (other than Colour and Size)
  const extraAttributes = useMemo(
    () => buildExtraAttributes(attributes, existingGender, resolvedGenderAttrId),
    [attributes, existingGender, resolvedGenderAttrId]
  );

  const resolvedColorAttrId = useMemo(
    () =>
      resolveAttributeId(
        ["colour", "color"],
        attributes,
        product,
        data?.data || []
      ),
    [attributes, product, data]
  );

  const resolvedSizeAttrId = useMemo(
    () => resolveAttributeId(["size"], attributes, product, data?.data || []),
    [attributes, product, data]
  );

  // Check if this product actually has a Size attribute
  const hasSizeAttribute = useMemo(
    () => checkHasSizeAttribute(attributes, product, data?.data || []),
    [attributes, product, data]
  );

  // Canonical size sequence extracted from product.sizeList and attributes
  const definedSizes = useMemo(
    () => getDefinedSizes(product, attributes, data?.data || []),
    [product, attributes, data]
  );

  // Group variants by Color with consistent size ordering across all colors
  const colorGroups = useMemo<ColorGroup[]>(() => {
    const list = data?.data || [];
    if (!list.length) return [];

    const groupsMap = new Map<string, ColorGroup>();

    list.forEach((v) => {
      const colVal = extractColorValue(v, product);
      const colorName = colVal || "Standard";
      const colorKey = colorName.toLowerCase();

      if (!groupsMap.has(colorKey)) {
        const colAttr = v.attributes?.find((a) =>
          ["colour", "color"].includes(
            (a.productAttribute?.attributeName || "").toLowerCase().trim()
          )
        );
        groupsMap.set(colorKey, {
          colorKey,
          colorName,
          colorAttrId:
            colAttr?.productAttributeId || colAttr?.productAttribute?.id,
          variants: [],
        });
      }

      groupsMap.get(colorKey)!.variants.push(v);
    });

    // 1. Sort variants within every color group strictly by the defined size sequence
    groupsMap.forEach((group) => {
      group.variants.sort((a, b) => {
        const szA = extractSizeValue(a, product).trim();
        const szB = extractSizeValue(b, product).trim();
        const rankA = getSizeRank(szA, definedSizes);
        const rankB = getSizeRank(szB, definedSizes);
        if (rankA !== rankB) return rankA - rankB;
        return (a.variantSku || "").localeCompare(b.variantSku || "");
      });
    });

    const groups = Array.from(groupsMap.values());

    // 2. Sort color groups according to product.colors sequence
    const definedColors: string[] = [];
    if (Array.isArray(product?.colors)) {
      product.colors.forEach((c) => {
        if (typeof c === "string" && c.trim()) {
          definedColors.push(c.trim().toLowerCase());
        }
      });
    }

    groups.sort((a, b) => {
      if (a.colorKey === "standard") return 1;
      if (b.colorKey === "standard") return -1;
      const idxA = definedColors.indexOf(a.colorKey);
      const idxB = definedColors.indexOf(b.colorKey);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.colorName.localeCompare(b.colorName);
    });

    return groups;
  }, [data, definedSizes, product]);

  // Generate SKU for a color & size combination
  const generateVariantSku = (
    colorName: string,
    sizeVal: string,
    baseSkuOverride?: string
  ): string =>
    buildVariantSku(
      colorName,
      sizeVal,
      baseSkuOverride || customBaseSku || masterSku || ""
    );

  // Compute clean original SKU without any internal duplicate counters (-1, -2, etc.)
  const getCleanVariantSku = (
    variant: ProductVariant,
    groupColorName?: string
  ): string =>
    buildCleanVariantSku(
      variant,
      groupColorName,
      customBaseSku || masterSku || "",
      product
    );

  // Parsed sizes for adding new color row
  const parsedNewSizes = useMemo(() => {
    return newSizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [newSizesInput]);

  // Parsed sizes for quick add inside existing color row
  const parsedQuickSizes = useMemo(() => {
    return quickAddSizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [quickAddSizesInput]);

  // Open dedicated edit-product page for a variant
  const handleOpenEditPage = (variant: ProductVariant) => {
    if (!canUpdate) {
      toast.error(
        "Access denied. You do not have permission to update data in this module."
      );
      return;
    }
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("orderos_return_expanded_product", productId);
      } catch {
        // ignore storage errors
      }
    }
    router.push(
      `/dashboard/settings/manage-product/product-profile/edit-product-varient/${variant.id}`
    );
  };

  // Start inline editing a single variant (via double-click on any row field)
  const handleStartEdit = (
    variant: ProductVariant,
    groupColorName?: string,
    fieldToFocus?: string
  ) => {
    if (!canUpdate) {
      toast.error(
        "Access denied. You do not have permission to update data in this module."
      );
      return;
    }
    setEditingId(variant.id);
    if (fieldToFocus) {
      setFocusedField(fieldToFocus);
    }
    setEditSku(getCleanVariantSku(variant, groupColorName));
    setEditCost(
      variant.cost !== undefined && variant.cost !== null ? variant.cost : ""
    );
    setEditMrp(
      variant.mrp !== undefined && variant.mrp !== null ? variant.mrp : ""
    );
    setEditSize(getSizeValue(variant));
    setEditAsin(variant.asin || "");
    setEditMyntraSku(variant.myntraSku || "");
    setEditFsnCode(variant.fsnCode || "");
    setEditRackAddress(variant.rackAddress || "");
    setEditStatus(variant.isActive);

    const otherVals: Record<string, string> = {};
    extraAttributes.forEach((attr) => {
      const matched = variant.attributes?.find(
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
    setEditOtherAttrs(otherVals);
  };

  // Save single variant edit
  const handleSaveEdit = async (
    variantId: string,
    groupColorName?: string,
    groupColorAttrId?: string
  ) => {
    const currentVariant = data?.data?.find((v) => v.id === variantId);
    if (!currentVariant) return;

    const formattedAttrs: {
      productAttributeId: string;
      attributeValue: string;
    }[] = [];

    // 1. Color: use groupColorName, existingCol, or parse from SKU
    const existingCol =
      (groupColorName && groupColorName !== "Standard" ? groupColorName : "") ||
      getColorValue(currentVariant);

    const effectiveColorAttrId = groupColorAttrId || resolvedColorAttrId;

    if (effectiveColorAttrId && existingCol) {
      formattedAttrs.push({
        productAttributeId: effectiveColorAttrId,
        attributeValue: existingCol,
      });
    }

    // 2. Size: use editSize, existing size, or parse from SKU
    const effectiveSizeVal = editSize.trim() || getSizeValue(currentVariant);
    const effectiveSizeAttrId = resolvedSizeAttrId;

    if (effectiveSizeAttrId && effectiveSizeVal) {
      formattedAttrs.push({
        productAttributeId: effectiveSizeAttrId,
        attributeValue: effectiveSizeVal,
      });
    }

    // Extra attributes (including Gender)
    let savedGender = false;
    extraAttributes.forEach((attr) => {
      const aId = attr.id;
      const isGender =
        (attr.attributeName || "").toLowerCase().trim() === "gender";
      let val = (
        editOtherAttrs[aId || ""] ||
        editOtherAttrs[attr.attributeName] ||
        ""
      ).trim();
      if (isGender && !val) {
        val = existingGender;
      }
      if (aId && val) {
        formattedAttrs.push({
          productAttributeId: aId,
          attributeValue: val,
        });
        if (isGender) savedGender = true;
      }
    });

    if (!savedGender && resolvedGenderAttrId && existingGender) {
      formattedAttrs.push({
        productAttributeId: resolvedGenderAttrId,
        attributeValue: existingGender,
      });
    }

    // Validate duplicate: Color, Size AND Gender cannot all be identical to an existing variant
    const effectiveColor =
      (groupColorName && groupColorName !== "Standard" ? groupColorName : "") ||
      getColorValue(currentVariant);
    const effectiveSize = effectiveSizeVal.trim();
    const isGenderAttr = extraAttributes.find(
      (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
    );
    const effectiveGender =
      (isGenderAttr
        ? editOtherAttrs[isGenderAttr.id || ""] ||
          editOtherAttrs[isGenderAttr.attributeName] ||
          ""
        : ""
      ).trim() || existingGender;

    const duplicate = findDuplicateVariant(
      data?.data || [],
      variantId,
      effectiveColor,
      effectiveSize,
      effectiveGender,
      existingGender,
      product
    );

    if (duplicate) {
      toast.error(
        `Duplicate record: Variant with Color "${effectiveColor}", Size "${effectiveSize}" and Gender "${effectiveGender || "N/A"}" already exists.`
      );
      return;
    }

    const cleanCurrent = getCleanVariantSku(currentVariant, groupColorName);
    const isCleanSkuUnchanged =
      editSku.trim().toLowerCase() === cleanCurrent.toLowerCase();
    const effectiveSkuToSend = isCleanSkuUnchanged
      ? currentVariant.variantSku
      : editSku.trim();

    await updateVariant.mutateAsync({
      id: variantId,
      data: {
        productId,
        variantSku: effectiveSkuToSend,
        cost: editCost !== "" ? Number(editCost) : 0,
        mrp: editMrp !== "" ? Number(editMrp) : 0,
        asin: editAsin.trim() || undefined,
        myntraSku: editMyntraSku.trim() || undefined,
        fsnCode: editFsnCode.trim() || undefined,
        rackAddress: editRackAddress.trim() || undefined,
        isActive: editStatus,
        attributes: formattedAttrs,
      },
    });

    setEditingId(null);
  };

  // Delete variant
  const handleDeleteConfirm = async () => {
    if (!selectedVariant) return;

    await deleteVariant.mutateAsync({
      id: selectedVariant.id,
      productId,
    });

    setDeleteOpen(false);
    setSelectedVariant(null);
  };

  // Batch create variants for a new color with multiple sizes
  const handleBatchSave = async () => {
    if (hasSizeAttribute && parsedNewSizes.length === 0) {
      toast.error("Please enter at least one size (e.g. M, L, XL, 32)");
      return;
    }

    const colVal = newColor.trim();
    if (!colVal && !hasSizeAttribute) {
      toast.error("Please enter a color or variant name");
      return;
    }

    const targetSizes = hasSizeAttribute ? parsedNewSizes : [""];
    const targetGender = newGender.trim() || availableGenders[0] || existingGender;

    // Validate duplicate: Color, Size AND Gender cannot all be identical to an existing variant
    const duplicateSizes: string[] = [];
    const validSizes: string[] = [];

    for (const sz of targetSizes) {
      const isDup = (data?.data || []).some((v) => {
        const vCol = (getColorValue(v) || "standard").trim().toLowerCase();
        const vSz = getSizeValue(v).trim().toLowerCase();
        const vGen = (getGenderValue(v) || "").trim().toLowerCase();

        const tCol = (colVal || "standard").trim().toLowerCase();
        const tSz = sz.trim().toLowerCase();
        const tGen = (targetGender || "").trim().toLowerCase();

        return vCol === tCol && vSz === tSz && vGen === tGen;
      });

      if (isDup) {
        duplicateSizes.push(sz);
      } else {
        validSizes.push(sz);
      }
    }

    if (duplicateSizes.length > 0 && validSizes.length === 0) {
      toast.error(
        `Duplicate record: Variant with Color "${colVal}", Size "${duplicateSizes.join(", ")}" and Gender "${targetGender || 'N/A'}" already exists.`
      );
      return;
    }

    if (duplicateSizes.length > 0) {
      toast.warning(
        `Skipped duplicate size(s) for "${colVal}" (${targetGender}): ${duplicateSizes.join(", ")} already exists.`
      );
    }

    setIsSavingBatch(true);
    try {
      const promises = validSizes.map((sz) => {
        const formattedAttrs: {
          productAttributeId: string;
          attributeValue: string;
        }[] = [];

        if (resolvedColorAttrId && colVal) {
          formattedAttrs.push({
            productAttributeId: resolvedColorAttrId,
            attributeValue: colVal,
          });
        }

        if (resolvedSizeAttrId) {
          formattedAttrs.push({
            productAttributeId: resolvedSizeAttrId,
            attributeValue: sz,
          });
        }

        // Include any extra attributes from product default, explicitly ensuring Gender
        let addedGender = false;
        const targetGender = newGender.trim() || availableGenders[0] || existingGender;
        extraAttributes.forEach((attr) => {
          const isGender =
            (attr.attributeName || "").toLowerCase().trim() === "gender";
          let val = (attr.attributeValue || "").trim();
          if (isGender) {
            val = targetGender;
          }
          if (attr.id && val) {
            formattedAttrs.push({
              productAttributeId: attr.id,
              attributeValue: val,
            });
            if (isGender) addedGender = true;
          }
        });

        if (!addedGender && resolvedGenderAttrId && targetGender) {
          formattedAttrs.push({
            productAttributeId: resolvedGenderAttrId,
            attributeValue: targetGender,
          });
        }

        const targetSku = generateVariantSku(colVal, sz, customBaseSku);

        return createVariant.mutateAsync({
          productId,
          variantSku: targetSku,
          cost: newCost !== "" ? Number(newCost) : 0,
          mrp: newMrp !== "" ? Number(newMrp) : 0,
          asin: newAsin.trim() || undefined,
          myntraSku: newMyntraSku.trim() || undefined,
          fsnCode: newFsnCode.trim() || undefined,
          rackAddress: newRackAddress.trim() || undefined,
          isActive: newIsActive,
          attributes: formattedAttrs,
        });
      });

      const results = await Promise.allSettled(promises);
      const successCount = results.filter((r) => r.status === "fulfilled").length;

      if (successCount > 0) {
        toast.success(
          `Created ${successCount} variant${successCount > 1 ? "s" : ""} successfully`
        );
      }

      setIsAdding(false);
      setNewColor("");
      setNewSizesInput("");
      setNewCost("");
      setNewMrp("");
      setCustomBaseSku("");
      setNewAsin("");
      setNewMyntraSku("");
      setNewFsnCode("");
      setNewRackAddress("");
      setNewIsActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create variants";
      toast.error(msg);
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Quick add sizes to an existing color row
  const handleQuickAddSizes = async (group: ColorGroup) => {
    if (parsedQuickSizes.length === 0) {
      toast.error("Please enter at least one size");
      return;
    }

    setIsQuickAdding(true);
    try {
      const colVal = group.colorName === "Standard" ? "" : group.colorName;
      const colAttrId = group.colorAttrId || resolvedColorAttrId;
      const sample = group.variants[0] || data?.data?.[0];

      // Collect base other attributes from existing variant (like Gender, Material, etc.)
      const baseOtherAttrs: {
        productAttributeId: string;
        attributeValue: string;
      }[] = [];

      if (sample && sample.attributes) {
        sample.attributes.forEach((va) => {
          const name = (va.productAttribute?.attributeName || "")
            .toLowerCase()
            .trim();
          if (!["colour", "color", "size"].includes(name)) {
            const attrId = va.productAttributeId || va.productAttribute?.id;
            const val = va.attributeValue?.trim();
            if (attrId && val) {
              baseOtherAttrs.push({
                productAttributeId: attrId,
                attributeValue: val,
              });
            }
          }
        });
      }

      // Ensure Gender is explicitly included if not already in baseOtherAttrs
      const hasGenderInBase = baseOtherAttrs.some((oa) => {
        const found =
          (sample?.attributes || []).find(
            (va) =>
              (va.productAttributeId === oa.productAttributeId ||
                va.productAttribute?.id === oa.productAttributeId) &&
              (va.productAttribute?.attributeName || "")
                .toLowerCase()
                .trim() === "gender"
          ) ||
          attributes.find(
            (a) =>
              a.id === oa.productAttributeId &&
              (a.attributeName || "").toLowerCase().trim() === "gender"
          );
        return Boolean(found);
      });

      if (!hasGenderInBase && resolvedGenderAttrId && existingGender) {
        baseOtherAttrs.push({
          productAttributeId: resolvedGenderAttrId,
          attributeValue: existingGender,
        });
      }

      const targetCol = colVal || group.colorName;
      const targetGender = existingGender;

      const duplicateSizes: string[] = [];
      const validSizes: string[] = [];

      for (const sz of parsedQuickSizes) {
        const isDup = (data?.data || []).some((v) => {
          const vCol = (getColorValue(v) || "standard").trim().toLowerCase();
          const vSz = getSizeValue(v).trim().toLowerCase();
          const vGen = (getGenderValue(v) || "").trim().toLowerCase();

          const tCol = (targetCol || "standard").trim().toLowerCase();
          const tSz = sz.trim().toLowerCase();
          const tGen = (targetGender || "").trim().toLowerCase();

          return vCol === tCol && vSz === tSz && vGen === tGen;
        });

        if (isDup) {
          duplicateSizes.push(sz);
        } else {
          validSizes.push(sz);
        }
      }

      if (duplicateSizes.length > 0 && validSizes.length === 0) {
        toast.error(
          `Duplicate record: Variant with Color "${targetCol}", Size "${duplicateSizes.join(", ")}" and Gender "${targetGender || 'N/A'}" already exists.`
        );
        return;
      }

      if (duplicateSizes.length > 0) {
        toast.warning(
          `Skipped duplicate size(s) for "${targetCol}": ${duplicateSizes.join(", ")} already exists.`
        );
      }

      const promises = validSizes.map((sz) => {
        const formattedAttrs: {
          productAttributeId: string;
          attributeValue: string;
        }[] = [...baseOtherAttrs];

        if (colAttrId && colVal) {
          formattedAttrs.push({
            productAttributeId: colAttrId,
            attributeValue: colVal,
          });
        }

        if (resolvedSizeAttrId) {
          formattedAttrs.push({
            productAttributeId: resolvedSizeAttrId,
            attributeValue: sz,
          });
        }

        const targetSku = generateVariantSku(colVal, sz);

        return createVariant.mutateAsync({
          productId,
          variantSku: targetSku,
          cost: sample?.cost || 0,
          mrp: sample?.mrp || 0,
          asin: sample?.asin || undefined,
          rackAddress: sample?.rackAddress || undefined,
          isActive: true,
          attributes: formattedAttrs,
        });
      });

      await Promise.allSettled(promises);
      toast.success(
        `Added ${parsedQuickSizes.length} size${parsedQuickSizes.length > 1 ? "s" : ""} to ${group.colorName}`
      );

      setQuickAddColorKey(null);
      setQuickAddSizesInput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add sizes";
      toast.error(msg);
    } finally {
      setIsQuickAdding(false);
    }
  };

  const tableColSpan = (hasSizeAttribute ? 9 : 8) + extraAttributes.length + (showAsin ? 1 : 0) + (showMyntraSku ? 1 : 0) + (showFsnCode ? 1 : 0);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-[#E7E0D2] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div
        ref={innerScrollRef}
        className="w-full max-w-full min-w-0 overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar touch-pan-x touch-pan-y"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[1250px] border-collapse text-left font-sans">
          <thead className="sticky top-0 z-10 border-b border-[#F5E6BE] bg-[#FEFAEE] text-xs font-bold tracking-wider text-[#6A4D1D] dark:border-white/[0.08] dark:bg-[#080B11] dark:text-[#E8C16D] shadow-2xs">
            <tr>
              {/* Img column */}
              <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[72px] min-w-[72px]">
                Img
              </th>

              {/* Colour column */}
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[110px] min-w-[110px]">
                Color
              </th>

              {/* Size column */}
              {hasSizeAttribute && (
                <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[75px] min-w-[75px]">
                  Size
                </th>
              )}

              {/* Variant SKU column */}
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[210px] min-w-[200px]">
                Variant SKU
              </th>

              {/* Cost column */}
              <th className="px-2.5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[100px] min-w-[95px]">
                Cost
              </th>

              {/* MRP column */}
              <th className="px-2.5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[100px] min-w-[95px]">
                MRP
              </th>

              {/* Extra Attributes (e.g. Gender, Material) */}
              {extraAttributes.map((attr) => (
                <th
                  key={attr.id || attr.attributeName}
                  className="px-2.5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[95px] min-w-[90px]"
                >
                  {attr.attributeName}
                </th>
              ))}

              {/* Dynamic Marketplace Identifiers */}
              {showAsin && (
                <th className="px-2.5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[110px] min-w-[105px]">
                  ASIN
                </th>
              )}

              {showMyntraSku && (
                <th className="px-2.5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[110px] min-w-[105px]">
                  Myntra SKU
                </th>
              )}

              {showFsnCode && (
                <th className="px-2.5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[110px] min-w-[105px]">
                  FSN Code
                </th>
              )}

              {/* Rack Address */}
              <th className="px-2.5 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[110px] min-w-[105px]">
                Rack Address
              </th>

              {/* Status */}
              <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[85px] min-w-[80px]">
                Status
              </th>

              {/* Action */}
              <th className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#6A4D1D] dark:text-[#E8C16D] whitespace-nowrap w-[150px] min-w-[145px]">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans dark:divide-white/[0.06] dark:bg-[#0F1626]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={tableColSpan}
                  className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                    <span>Loading variants...</span>
                  </div>
                </td>
              </tr>
            ) : colorGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColSpan}
                  className="py-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400"
                >
                  No variants found. Add colors and sizes below.
                </td>
              </tr>
            ) : (
              colorGroups.map((group) => {
                const isQuickAddOpen = quickAddColorKey === group.colorKey;

                return (
                  <tr
                    key={group.colorKey}
                    className="transition-colors hover:bg-slate-50/60 dark:hover:bg-white/[0.03]"
                  >
                    {/* 0. Img Column */}
                    <td className="px-2 py-3.5 align-top w-[72px] min-w-[72px] text-center">
                      {(() => {
                        const dbImageUrl = group.variants.find((v) => v.imageUrl)?.imageUrl;
                        const formattedDbUrl = toFullImageUrl(dbImageUrl);
                        const currentImgUrl =
                          toFullImageUrl(effectiveImages[group.colorName]) ||
                          formattedDbUrl ||
                          (effectiveMasterSku
                            ? toFullImageUrl(
                              `/products/image?masterSku=${encodeURIComponent(
                                effectiveMasterSku
                              )}&color=${encodeURIComponent(group.colorName)}`
                            )
                            : undefined);
                        const isUploadingThis = uploadingColor === group.colorName;
                        const hasImage = Boolean(effectiveImages[group.colorName] || formattedDbUrl);

                        return (
                          <div className="flex flex-col items-center">
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverColor(group.colorName);
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                setDragOverColor(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragOverColor(null);
                                const droppedFiles = e.dataTransfer.files;
                                if (droppedFiles && droppedFiles.length > 0) {
                                  const file = droppedFiles[0];
                                  const objectUrl = URL.createObjectURL(file);
                                  setAdjustingImage({ url: objectUrl, color: group.colorName });
                                }
                              }}
                              className={`relative group flex h-12 w-12 items-center justify-center rounded-lg border transition-all ${dragOverColor === group.colorName
                                  ? "border-[#E8C16D] bg-[#E8C16D]/20 ring-2 ring-[#E8C16D]"
                                  : hasImage
                                    ? "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04]"
                                    : "border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 hover:border-[#E8C16D] dark:bg-white/[0.02]"
                                }`}
                            >
                              {isUploadingThis ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent" />
                              ) : hasImage ? (
                                <>
                                  <img
                                    src={currentImgUrl}
                                    alt={group.colorName}
                                    className="h-full w-full rounded-lg object-cover cursor-pointer"
                                    onClick={() =>
                                      currentImgUrl &&
                                      setPreviewImage({
                                        url: currentImgUrl,
                                        color: group.colorName,
                                      })
                                    }
                                  />
                                  <div
                                    onClick={() =>
                                      fileInputRefs.current[group.colorName]?.click()
                                    }
                                    className="absolute inset-0 hidden group-hover:flex items-center justify-center rounded-lg bg-black/60 text-white cursor-pointer transition-opacity"
                                    title="Click to replace image"
                                  >
                                    <Camera size={16} className="text-[#E8C16D]" />
                                  </div>
                                </>
                              ) : (
                                <div
                                  onClick={() =>
                                    fileInputRefs.current[group.colorName]?.click()
                                  }
                                  className="flex flex-col items-center justify-center text-slate-400 hover:text-[#E8C16D] cursor-pointer"
                                  title="Click to upload image"
                                >
                                  <ImagePlus size={18} />
                                </div>
                              )}

                              <input
                                type="file"
                                accept="image/*"
                                ref={(el) => {
                                  fileInputRefs.current[group.colorName] = el;
                                }}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    const file = e.target.files[0];
                                    const objectUrl = URL.createObjectURL(file);
                                    setAdjustingImage({ url: objectUrl, color: group.colorName });
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </div>

                            {/* Adjust button just below the image */}
                            {hasImage && currentImgUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setAdjustingImage({
                                    url: currentImgUrl,
                                    color: group.colorName,
                                  })
                                }
                                disabled={isUploadingThis}
                                className="mt-1.5 inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border border-[#E8C16D]/60 bg-[#FEFAEE] dark:bg-[#1A160E] text-[#6A4D1D] dark:text-[#E8C16D] hover:bg-[#F5E6BE] dark:hover:bg-[#262014] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                                title="Adjust, crop, move or zoom image"
                              >
                                <Crop size={11} className="text-[#B88728] dark:text-[#E8C16D]" />
                                <span>Adjust</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* 1. Colour Column */}
                    <td className="px-3 py-3.5 align-top w-[110px] min-w-[110px] text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-slate-300 dark:border-white/20 shadow-2xs shrink-0"
                            style={{
                              backgroundColor: getColorHex(group.colorName),
                            }}
                          />
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate max-w-[85px]" title={group.colorName}>
                            {group.colorName}
                          </span>
                        </div>

                        {/* Sizes count & Add Size in one line */}
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center justify-center rounded-md bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {group.variants.length}{" "}
                            {hasSizeAttribute
                              ? (group.variants.length === 1 ? "size" : "sizes")
                              : (group.variants.length === 1 ? "variant" : "variants")}
                          </span>

                          {hasSizeAttribute && (
                            <button
                              type="button"
                              onClick={() =>
                                setQuickAddColorKey(
                                  isQuickAddOpen ? null : group.colorKey
                                )
                              }
                              className="inline-flex items-center justify-center gap-0.5 text-[11px] font-bold text-[#B88728] dark:text-[#F5C451] hover:underline cursor-pointer whitespace-nowrap pt-0.5"
                              title="Add more sizes to this color"
                            >
                              <Plus size={11} className="stroke-[3]" />
                              <span>Add Size</span>
                            </button>
                          )}
                        </div>

                        {/* Quick Add Sizes Inline Popup for this Color */}
                        {isQuickAddOpen && (
                          <div className="mt-2 w-full max-w-[210px] p-2 rounded-xl bg-amber-50/80 dark:bg-[#F5C451]/10 border border-amber-200/70 dark:border-[#F5C451]/20 space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              Sizes (comma separated):
                            </label>
                            <input
                              value={quickAddSizesInput}
                              onChange={(e) =>
                                setQuickAddSizesInput(e.target.value)
                              }
                              placeholder="e.g. XL, 32"
                              className="w-full px-2 py-1 text-xs rounded border border-amber-300 dark:border-[#F5C451]/30 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#E8C16D]"
                            />

                            {parsedQuickSizes.length > 0 && (
                              <div className="space-y-0.5 pt-1 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                                {parsedQuickSizes.map((sz) => (
                                  <div
                                    key={sz}
                                    className="flex items-center justify-between"
                                  >
                                    <span className="font-bold text-amber-700 dark:text-[#F5C451]">
                                      {sz}
                                    </span>
                                    <span>
                                      {generateVariantSku(
                                        group.colorName === "Standard"
                                          ? ""
                                          : group.colorName,
                                        sz
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {existingGender && (
                              <p className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold">
                                Gender: {existingGender}
                              </p>
                            )}

                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickAddColorKey(null);
                                  setQuickAddSizesInput("");
                                }}
                                className="px-2 py-0.5 text-[11px] rounded text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <Button
                                size="sm"
                                disabled={
                                  isQuickAdding || parsedQuickSizes.length === 0
                                }
                                onClick={() => handleQuickAddSizes(group)}
                              >
                                {isQuickAdding ? "Adding..." : "Add"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 2. Size Column - Vertically Stacked Line by Line */}
                    {hasSizeAttribute && (
                      <td className="px-2 py-3.5 align-top w-[75px] min-w-[75px] text-center">
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {group.variants.map((variant) => {
                            const isEditing = editingId === variant.id;
                            const szVal = getSizeValue(variant) || "--";

                            return (
                              <div
                                key={variant.id}
                                onDoubleClick={() => {
                                  if (!isEditing) {
                                    handleStartEdit(variant, group.colorName, "size");
                                  }
                                }}
                                title={!isEditing ? "Double-click to edit" : undefined}
                                className={`min-h-[42px] py-1 flex items-center justify-center ${
                                  !isEditing
                                    ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                    : ""
                                }`}
                              >
                                {isEditing ? (
                                  <input
                                    ref={(el) => {
                                      inlineFieldRefs.current[`${variant.id}:size`] = el;
                                    }}
                                    value={editSize}
                                    onChange={(e) => {
                                      const nextSz = e.target.value;
                                      setEditSize(nextSz);
                                      const col = getColorValue(variant);
                                      setEditSku(
                                        generateVariantSku(col, nextSz)
                                      );
                                    }}
                                    className="h-8 w-20 px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                    placeholder="Size"
                                  />
                                ) : (
                                  <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 text-xs font-bold rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/20 font-mono shadow-2xs">
                                    {szVal}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    )}

                    {/* 3. Variant SKU Column - Line by Line paired with each size */}
                    <td className="px-3 py-3.5 align-top w-[210px] min-w-[200px] text-center">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              onDoubleClick={() => {
                                if (!isEditing) {
                                  handleStartEdit(variant, group.colorName, "sku");
                                }
                              }}
                              title={
                                !isEditing
                                  ? `${getCleanVariantSku(variant, group.colorName)} (Double-click to edit)`
                                  : undefined
                              }
                              className={`min-h-[42px] py-1 flex items-center justify-center font-mono font-semibold text-slate-900 dark:text-white text-xs sm:text-sm text-center ${
                                !isEditing
                                  ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                  : ""
                              }`}
                            >
                              {isEditing ? (
                                <input
                                  ref={(el) => {
                                    inlineFieldRefs.current[`${variant.id}:sku`] = el;
                                  }}
                                  value={editSku}
                                  onChange={(e) => setEditSku(e.target.value)}
                                  className="h-8 w-full max-w-[260px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                />
                              ) : (
                                <span
                                  className="truncate text-center"
                                  title={getCleanVariantSku(variant, group.colorName)}
                                >
                                  {getCleanVariantSku(variant, group.colorName)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Cost Column */}
                    <td className="px-2.5 py-3.5 align-top w-[100px] min-w-[95px] text-center">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              onDoubleClick={() => {
                                if (!isEditing) {
                                  handleStartEdit(variant, group.colorName, "cost");
                                }
                              }}
                              title={!isEditing ? "Double-click to edit" : undefined}
                              className={`min-h-[42px] py-1 flex items-center justify-center font-medium text-slate-900 dark:text-white text-xs sm:text-sm text-center ${
                                !isEditing
                                  ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                  : ""
                              }`}
                            >
                              {isEditing ? (
                                <div className="relative flex items-center justify-center">
                                  <span className="absolute left-2 text-xs text-slate-400">₹</span>
                                  <input
                                    ref={(el) => {
                                      inlineFieldRefs.current[`${variant.id}:cost`] = el;
                                    }}
                                    type="number"
                                    step="0.01"
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
                                    className="h-8 w-24 pl-5 pr-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                    placeholder="0.00"
                                  />
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-center">
                                  {variant.cost !== undefined && variant.cost !== null && Number(variant.cost) > 0 ? `₹${variant.cost}` : product?.productCost !== undefined && product?.productCost !== null && Number(product.productCost) > 0 ? `₹${product.productCost}` : "₹0"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* MRP Column */}
                    <td className="px-2.5 py-3.5 align-top w-[100px] min-w-[95px] text-center">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              onDoubleClick={() => {
                                if (!isEditing) {
                                  handleStartEdit(variant, group.colorName, "mrp");
                                }
                              }}
                              title={!isEditing ? "Double-click to edit" : undefined}
                              className={`min-h-[42px] py-1 flex items-center justify-center font-medium text-slate-900 dark:text-white text-xs sm:text-sm text-center ${
                                !isEditing
                                  ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                  : ""
                              }`}
                            >
                              {isEditing ? (
                                <div className="relative flex items-center justify-center">
                                  <span className="absolute left-2 text-xs text-slate-400">₹</span>
                                  <input
                                    ref={(el) => {
                                      inlineFieldRefs.current[`${variant.id}:mrp`] = el;
                                    }}
                                    type="number"
                                    step="0.01"
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
                                    className="h-8 w-24 pl-5 pr-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                    placeholder="0.00"
                                  />
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-center">
                                  {variant.mrp !== undefined && variant.mrp !== null && Number(variant.mrp) > 0 ? `₹${variant.mrp}` : product?.mrp !== undefined && product?.mrp !== null && Number(product.mrp) > 0 ? `₹${product.mrp}` : "₹0"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Extra Attributes Columns (including Gender) */}
                    {extraAttributes.map((attr) => {
                      const attrFieldKey = `extra:${attr.id || attr.attributeName}`;
                      return (
                      <td
                        key={attr.id || attr.attributeName}
                        className="px-2.5 py-3.5 align-top w-[95px] min-w-[90px] text-center"
                      >
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {group.variants.map((variant) => {
                            const isEditing = editingId === variant.id;
                            const matched = variant.attributes?.find(
                              (a) =>
                                (attr.id && a.productAttributeId === attr.id) ||
                                (a.productAttribute?.attributeName &&
                                  a.productAttribute.attributeName.toLowerCase() ===
                                  attr.attributeName.toLowerCase())
                            );
                            const isGender =
                              (attr.attributeName || "")
                                .toLowerCase()
                                .trim() === "gender";
                            const val =
                              matched?.attributeValue ||
                              (isGender ? existingGender : "") ||
                              attr.attributeValue ||
                              "--";

                            return (
                              <div
                                key={variant.id}
                                onDoubleClick={() => {
                                  if (!isEditing) {
                                    handleStartEdit(variant, group.colorName, attrFieldKey);
                                  }
                                }}
                                title={!isEditing ? "Double-click to edit" : undefined}
                                className={`min-h-[42px] py-1 flex items-center justify-center text-slate-700 dark:text-slate-300 text-xs text-center ${
                                  !isEditing
                                    ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                    : ""
                                }`}
                              >
                                {isEditing ? (
                                  <input
                                    ref={(el) => {
                                      inlineFieldRefs.current[`${variant.id}:${attrFieldKey}`] = el;
                                    }}
                                    value={
                                      editOtherAttrs[attr.id || ""] !== undefined
                                        ? editOtherAttrs[attr.id || ""]
                                        : editOtherAttrs[attr.attributeName] !== undefined
                                        ? editOtherAttrs[attr.attributeName]
                                        : (isGender ? existingGender : "") ||
                                          ""
                                    }
                                    onChange={(e) => {
                                      const nextVal = e.target.value;
                                      setEditOtherAttrs((prev) => ({
                                        ...prev,
                                        [attr.id || ""]: nextVal,
                                        [attr.attributeName]: nextVal,
                                      }));
                                      if (isGender && genderPricingMap[nextVal]) {
                                        const pricing = genderPricingMap[nextVal];
                                        if (pricing.cost > 0) setEditCost(pricing.cost);
                                        if (pricing.mrp > 0) setEditMrp(pricing.mrp);
                                      }
                                    }}
                                    placeholder={attr.attributeName}
                                    className="h-8 w-full min-w-[90px] max-w-[140px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                  />
                                ) : (
                                  <span
                                    className={
                                      isGender && val !== "--"
                                        ? "inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20 font-sans text-center"
                                        : "text-center"
                                    }
                                  >
                                    {val}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      );
                    })}

                    {/* Dynamic Marketplace Columns */}
                    {showAsin && (
                      <td className="px-2.5 py-3.5 align-top w-[110px] min-w-[105px] text-center">
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {group.variants.map((variant) => {
                            const isEditing = editingId === variant.id;

                            return (
                              <div
                                key={variant.id}
                                onDoubleClick={() => {
                                  if (!isEditing) {
                                    handleStartEdit(variant, group.colorName, "asin");
                                  }
                                }}
                                title={!isEditing ? "Double-click to edit" : undefined}
                                className={`min-h-[42px] py-1 flex items-center justify-center font-mono text-slate-700 dark:text-slate-300 text-xs text-center ${
                                  !isEditing
                                    ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                    : ""
                                }`}
                              >
                                {isEditing ? (
                                  <input
                                    ref={(el) => {
                                      inlineFieldRefs.current[`${variant.id}:asin`] = el;
                                    }}
                                    value={editAsin}
                                    onChange={(e) => setEditAsin(e.target.value)}
                                    placeholder="ASIN"
                                    className="h-8 w-full min-w-[90px] max-w-[140px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                  />
                                ) : (
                                  <span className="text-center">{variant.asin || "--"}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    )}

                    {showMyntraSku && (
                      <td className="px-2.5 py-3.5 align-top w-[110px] min-w-[105px] text-center">
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {group.variants.map((variant) => {
                            const isEditing = editingId === variant.id;

                            return (
                              <div
                                key={variant.id}
                                onDoubleClick={() => {
                                  if (!isEditing) {
                                    handleStartEdit(variant, group.colorName, "myntraSku");
                                  }
                                }}
                                title={!isEditing ? "Double-click to edit" : undefined}
                                className={`min-h-[42px] py-1 flex items-center justify-center font-mono text-slate-700 dark:text-slate-300 text-xs text-center ${
                                  !isEditing
                                    ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                    : ""
                                }`}
                              >
                                {isEditing ? (
                                  <input
                                    ref={(el) => {
                                      inlineFieldRefs.current[`${variant.id}:myntraSku`] = el;
                                    }}
                                    value={editMyntraSku}
                                    onChange={(e) => setEditMyntraSku(e.target.value)}
                                    placeholder="Myntra SKU"
                                    className="h-8 w-full min-w-[90px] max-w-[140px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                  />
                                ) : (
                                  <span className="text-center">{variant.myntraSku || "--"}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    )}

                    {showFsnCode && (
                      <td className="px-2.5 py-3.5 align-top w-[110px] min-w-[105px] text-center">
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {group.variants.map((variant) => {
                            const isEditing = editingId === variant.id;

                            return (
                              <div
                                key={variant.id}
                                onDoubleClick={() => {
                                  if (!isEditing) {
                                    handleStartEdit(variant, group.colorName, "fsnCode");
                                  }
                                }}
                                title={!isEditing ? "Double-click to edit" : undefined}
                                className={`min-h-[42px] py-1 flex items-center justify-center font-mono text-slate-700 dark:text-slate-300 text-xs text-center ${
                                  !isEditing
                                    ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                    : ""
                                }`}
                              >
                                {isEditing ? (
                                  <input
                                    ref={(el) => {
                                      inlineFieldRefs.current[`${variant.id}:fsnCode`] = el;
                                    }}
                                    value={editFsnCode}
                                    onChange={(e) => setEditFsnCode(e.target.value)}
                                    placeholder="FSN Code"
                                    className="h-8 w-full min-w-[90px] max-w-[140px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                  />
                                ) : (
                                  <span className="text-center">{variant.fsnCode || "--"}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    )}

                    {/* 5. Rack Address Column */}
                    <td className="px-2.5 py-3.5 align-top w-[110px] min-w-[105px] text-center">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              onDoubleClick={() => {
                                if (!isEditing) {
                                  handleStartEdit(variant, group.colorName, "rackAddress");
                                }
                              }}
                              title={!isEditing ? "Double-click to edit" : undefined}
                              className={`min-h-[42px] py-1 flex items-center justify-center font-medium text-slate-700 dark:text-slate-300 text-xs text-center ${
                                !isEditing
                                  ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                  : ""
                              }`}
                            >
                              {isEditing ? (
                                <input
                                  ref={(el) => {
                                    inlineFieldRefs.current[`${variant.id}:rackAddress`] = el;
                                  }}
                                  value={editRackAddress}
                                  onChange={(e) =>
                                    setEditRackAddress(e.target.value)
                                  }
                                  placeholder="Rack Address"
                                  className="h-8 w-full min-w-[90px] max-w-[140px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                                />
                              ) : (
                                <span className="text-center">{variant.rackAddress || "--"}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* 6. Status Column */}
                    <td className="px-2 py-3.5 align-top text-center w-[85px] min-w-[80px]">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              ref={(el) => {
                                inlineFieldRefs.current[`${variant.id}:status`] = el;
                              }}
                              onDoubleClick={() => {
                                if (!isEditing) {
                                  handleStartEdit(variant, group.colorName, "status");
                                }
                              }}
                              title={!isEditing ? "Double-click to edit" : undefined}
                              className={`min-h-[42px] py-1 flex items-center justify-center ${
                                !isEditing
                                  ? "cursor-pointer hover:bg-amber-50/40 dark:hover:bg-white/[0.03] rounded-md transition-colors"
                                  : ""
                              }`}
                            >
                              {isEditing ? (
                                <Switch
                                  checked={editStatus}
                                  onCheckedChange={setEditStatus}
                                />
                              ) : (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${variant.isActive
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                                      : "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
                                    }`}
                                >
                                  {variant.isActive ? "Active" : "Inactive"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* 7. Action Column */}
                    <td className="px-2 py-3.5 align-top text-center w-[150px] min-w-[145px]">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              className="min-h-[42px] py-1 flex items-center justify-center gap-1.5"
                            >
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                  <Button
                                    size="sm"
                                    fullWidth={false}
                                    className="!h-8 !w-[64px] !min-w-[64px] !px-0 text-xs font-bold rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                                    onClick={() =>
                                      handleSaveEdit(
                                        variant.id,
                                        group.colorName,
                                        group.colorAttrId
                                      )
                                    }
                                    disabled={updateVariant.isPending}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    fullWidth={false}
                                    className="!h-8 !w-[64px] !min-w-[64px] !px-0 text-xs font-bold rounded-lg flex items-center justify-center shrink-0 cursor-pointer border border-slate-300 dark:border-white/20 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.1]"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPage(variant)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] hover:bg-[#FFF9EC] hover:text-[#B88728] dark:hover:bg-[#E8C16D]/10 dark:hover:text-[#F5C451] transition-all shadow-2xs active:scale-95 cursor-pointer"
                                    title="Edit variant"
                                  >
                                    <Pencil size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedVariant(variant);
                                      setDeleteOpen(true);
                                    }}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all shadow-2xs active:scale-95 cursor-pointer"
                                    title="Delete variant"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}

            {/* ADD VARIANT ROW / BATCH FORM */}
            {!isAdding ? (
              <tr className="bg-slate-50/70 dark:bg-white/[0.02] border-t-2 border-[#E8C16D]/30">
                <td colSpan={tableColSpan} className="py-2.5 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(true);
                      if (availableGenders.length > 0 && !newGender) {
                        const defaultGen = availableGenders[0];
                        setNewGender(defaultGen);
                        if (genderPricingMap[defaultGen]) {
                          if (genderPricingMap[defaultGen].cost > 0) {
                            setNewCost(genderPricingMap[defaultGen].cost);
                          }
                          if (genderPricingMap[defaultGen].mrp > 0) {
                            setNewMrp(genderPricingMap[defaultGen].mrp);
                          }
                        }
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#E8C16D]/10 px-4 py-1.5 text-xs font-bold text-[#0A0E1A] dark:text-[#F5C451] hover:bg-[#FFF3D6] dark:hover:bg-[#E8C16D]/20 ring-1 ring-[#E8C16D]/30 transition-all shadow-2xs active:scale-[0.98] cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Add Variant</span>
                  </button>
                </td>
              </tr>
            ) : (
              <tr className="bg-slate-50/70 dark:bg-white/[0.02] border-t-2 border-[#E8C16D]/30">
                {/* Empty Img placeholder cell */}
                <td className="px-2 py-3 align-top text-center w-[72px] min-w-[72px] text-slate-400 dark:text-slate-600">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-white/10 mx-auto text-slate-300 dark:text-slate-600">
                    <ImagePlus size={14} />
                  </div>
                </td>

                {/* Colour input */}
                <td className="px-3 py-3 align-top w-[110px] min-w-[110px] text-center">
                  <div className="space-y-1">
                    <input
                      autoFocus
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Colour (e.g. Black)"
                      className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                    />
                    {Array.isArray(product?.colors) &&
                      product.colors.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 pt-1">
                          {product.colors.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewColor(c)}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-[#E8C16D]/20 cursor-pointer"
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </td>

                {/* Size input (Comma-separated sizes) */}
                {hasSizeAttribute && (
                  <td className="px-2 py-3 align-top text-center w-[75px] min-w-[75px]">
                    <div className="space-y-1">
                      <input
                        value={newSizesInput}
                        onChange={(e) => setNewSizesInput(e.target.value)}
                        placeholder="e.g. M, L, XL, 32"
                        className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                      />
                      {product?.sizeList && (
                        <div className="flex flex-wrap justify-center gap-1 pt-1">
                          {product.sizeList
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((sz) => {
                              const isIncluded = parsedNewSizes.includes(sz);
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => {
                                    if (isIncluded) {
                                      setNewSizesInput(
                                        parsedNewSizes
                                          .filter((s) => s !== sz)
                                          .join(", ")
                                      );
                                    } else {
                                      setNewSizesInput(
                                        [...parsedNewSizes, sz].join(", ")
                                      );
                                    }
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${isIncluded
                                      ? "bg-[#E8C16D] text-[#0A0E1A]"
                                      : "bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-[#E8C16D]/20"
                                    }`}
                                >
                                  {sz}
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </td>
                )}

                {/* Variant SKU - Live preview */}
                <td className="px-3 py-3 align-top w-[210px] min-w-[200px] text-center">
                  <div className="space-y-1">
                    {hasSizeAttribute ? (
                      parsedNewSizes.length === 0 ? (
                        <span className="text-slate-400 italic text-xs block text-center">
                          Enter sizes to preview SKUs
                        </span>
                      ) : (
                        <div className="flex flex-col space-y-1 items-center">
                          {parsedNewSizes.map((sz) => {
                            const previewSku = generateVariantSku(
                              newColor,
                              sz,
                              customBaseSku
                            );
                            return (
                              <div
                                key={sz}
                                className="h-7 flex items-center justify-center gap-2 font-mono text-xs text-center"
                              >
                                <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 font-bold rounded bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/20">
                                  {sz}
                                </span>
                                <span className="text-slate-400">→</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {previewSku}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className="h-7 flex items-center justify-center font-mono text-xs text-center">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {generateVariantSku(newColor, "", customBaseSku)}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Cost input */}
                <td className="px-2.5 py-3 align-top w-[100px] min-w-[95px] text-center">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute left-2 text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newCost}
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00" ||
                          Number(e.target.value) === 0
                        ) {
                          setNewCost("");
                        }
                      }}
                      onClick={(e) => {
                        if (
                          e.currentTarget.value === "0" ||
                          e.currentTarget.value === "0.00" ||
                          Number(e.currentTarget.value) === 0
                        ) {
                          setNewCost("");
                        }
                      }}
                      onChange={(e) => setNewCost(e.target.value)}
                      placeholder="0.00"
                      className="h-8 w-24 pl-5 pr-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                    />
                  </div>
                </td>

                {/* MRP input */}
                <td className="px-2.5 py-3 align-top w-[100px] min-w-[95px] text-center">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute left-2 text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newMrp}
                      onFocus={(e) => {
                        if (
                          e.target.value === "0" ||
                          e.target.value === "0.00" ||
                          Number(e.target.value) === 0
                        ) {
                          setNewMrp("");
                        }
                      }}
                      onClick={(e) => {
                        if (
                          e.currentTarget.value === "0" ||
                          e.currentTarget.value === "0.00" ||
                          Number(e.currentTarget.value) === 0
                        ) {
                          setNewMrp("");
                        }
                      }}
                      onChange={(e) => setNewMrp(e.target.value)}
                      placeholder="0.00"
                      className="h-8 w-24 pl-5 pr-2 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                    />
                  </div>
                </td>

                {/* Extra Attributes (including Gender) */}
                {extraAttributes.map((attr) => {
                  const isGender =
                    (attr.attributeName || "").toLowerCase().trim() === "gender";
                  const displayVal =
                    (isGender ? (newGender || existingGender) : "") ||
                    attr.attributeValue ||
                    "--";

                  return (
                    <td
                      key={attr.id || attr.attributeName}
                      className="px-2.5 py-3 align-top text-center text-xs w-[110px] min-w-[100px]"
                    >
                      {isGender ? (
                        <input
                          value={newGender !== "" ? newGender : existingGender}
                          onChange={(e) => handleNewGenderChange(e.target.value)}
                          placeholder="Gender"
                          className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                        />
                      ) : (
                        <span className="text-slate-400">{displayVal}</span>
                      )}
                    </td>
                  );
                })}

                {/* Dynamic Marketplace Columns */}
                {showAsin && (
                  <td className="px-2.5 py-3 align-top text-center w-[110px] min-w-[105px]">
                    <input
                      value={newAsin}
                      onChange={(e) => setNewAsin(e.target.value)}
                      placeholder="ASIN (optional)"
                      className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                    />
                  </td>
                )}

                {showMyntraSku && (
                  <td className="px-2.5 py-3 align-top text-center w-[110px] min-w-[105px]">
                    <input
                      value={newMyntraSku}
                      onChange={(e) => setNewMyntraSku(e.target.value)}
                      placeholder="Myntra SKU (optional)"
                      className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                    />
                  </td>
                )}

                {showFsnCode && (
                  <td className="px-2.5 py-3 align-top text-center w-[110px] min-w-[105px]">
                    <input
                      value={newFsnCode}
                      onChange={(e) => setNewFsnCode(e.target.value)}
                      placeholder="FSN Code (optional)"
                      className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                    />
                  </td>
                )}

                {/* Rack Address */}
                <td className="px-2.5 py-3 align-top text-center w-[110px] min-w-[105px]">
                  <input
                    value={newRackAddress}
                    onChange={(e) => setNewRackAddress(e.target.value)}
                    placeholder="Rack Address"
                    className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs text-center"
                  />
                </td>

                {/* Status */}
                <td className="px-2 py-3 align-top text-center w-[85px] min-w-[80px]">
                  <div className="flex items-center justify-center pt-1">
                    <Switch
                      checked={newIsActive}
                      onCheckedChange={setNewIsActive}
                    />
                  </div>
                </td>

                {/* Actions */}
                <td className="px-2 py-3 align-top text-center w-[150px] min-w-[145px]">
                  <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <Button
                      size="sm"
                      fullWidth={false}
                      className="!h-8 !w-[64px] !min-w-[64px] !px-0 text-xs font-bold rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                      onClick={handleBatchSave}
                      disabled={
                        isSavingBatch || parsedNewSizes.length === 0
                      }
                    >
                      {isSavingBatch ? "..." : "Save"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth={false}
                      className="!h-8 !w-[64px] !min-w-[64px] !px-0 text-xs font-bold rounded-lg flex items-center justify-center shrink-0 cursor-pointer border border-slate-300 dark:border-white/20 bg-white dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.1]"
                      onClick={() => {
                        setIsAdding(false);
                        setNewColor("");
                        setNewSizesInput("");
                        setNewGender("");
                        setCustomBaseSku("");
                        setNewAsin("");
                        setNewMyntraSku("");
                        setNewFsnCode("");
                        setNewRackAddress("");
                        setNewIsActive(true);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full rounded-2xl bg-white p-4 shadow-2xl dark:bg-[#0F1626] border border-slate-200 dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                {previewImage.color} {effectiveMasterSku ? `- ${effectiveMasterSku}` : ""}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="py-4 flex justify-center items-center">
              <img
                src={previewImage.url}
                alt={previewImage.color}
                className="max-h-[70vh] rounded-xl object-contain shadow-md"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  fileInputRefs.current[previewImage.color]?.click();
                  setPreviewImage(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#E8C16D] text-slate-900 hover:bg-[#d4ad57] cursor-pointer"
              >
                Replace Image
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
            await handleUploadImage(file, color);
            setAdjustingImage(null);
          }}
          isUploading={uploadingColor === adjustingImage.color}
        />
      )}

      <DeleteVariantModal
        open={deleteOpen}
        variant={selectedVariant}
        loading={deleteVariant.isPending}
        onClose={() => {
          setDeleteOpen(false);
          setSelectedVariant(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
