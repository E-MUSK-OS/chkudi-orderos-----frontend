"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { materialService } from "../services/material.service";
import { API_BASE_URL } from "@/lib/config";
import Button from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import type { Material, MaterialAttribute } from "../types/material.types";
import type { MaterialVariant } from "../types/materialVariant.types";
import {
  useCreateMaterialVariant,
  useDeleteMaterialVariant,
  useMaterialVariants,
  useUpdateMaterialVariant,
} from "../hooks/useMaterialVariants";
import { defaultColorPresets } from "../constants/material.constants";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Camera,
} from "lucide-react";
import DeleteVariantModal from "./DeleteVariantModal";
import { toast } from "sonner";

interface Props {
  materialId: string;
  attributes: MaterialAttribute[];
  masterSku?: string;
  material?: Material;
}

interface ColorGroup {
  colorKey: string;
  colorName: string;
  colorAttrId?: string;
  variants: MaterialVariant[];
}

const getColorHex = (name: string): string => {
  if (!name) return "#64748B";
  const found = defaultColorPresets.find(
    (p) => p.name.toLowerCase() === name.toLowerCase().trim()
  );
  if (found) return found.hex;
  if (/^#([0-9A-F]{3}){1,2}$/i.test(name.trim())) return name.trim();
  return "#64748B";
};

export default function MaterialVariantInline({
  materialId,
  attributes,
  masterSku,
  material,
}: Props) {
  const { data, isLoading } = useMaterialVariants(materialId);
  const createVariant = useCreateMaterialVariant();
  const updateVariant = useUpdateMaterialVariant();
  const deleteVariant = useDeleteMaterialVariant();

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<MaterialVariant | null>(
    null
  );

  const effectiveMasterSku = (masterSku || material?.masterSku || "").trim();

  // Helper to ensure clean absolute image URLs without duplicate /api/v1 prefixes
  const toFullImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const cleanBase = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    let cleanPath = url.startsWith("/") ? url : `/${url}`;
    if (!cleanPath.startsWith("/api/v1")) {
      cleanPath = `/api/v1${cleanPath}`;
    }
    return `${cleanBase}${cleanPath}`;
  };

  // Color images state & upload
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const [uploadingColor, setUploadingColor] = useState<string | null>(null);
  const [dragOverColor, setDragOverColor] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; color: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getToken = () => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") ?? "";
  };

  // Fetch images for this Material's masterSku from backend NAS
  const { data: imagesResponse, refetch: refetchImages } = useQuery({
    queryKey: ["Material-images", effectiveMasterSku],
    queryFn: () => materialService.getProductImages(effectiveMasterSku, getToken()),
    enabled: !!effectiveMasterSku,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (imagesResponse?.data) {
      const formatted: Record<string, string> = {};
      for (const [color, pathUrl] of Object.entries(imagesResponse.data)) {
        const full = toFullImageUrl(pathUrl as string);
        if (full) formatted[color] = full;
      }
      setLocalImages((prev) => ({ ...formatted, ...prev }));
    }
  }, [imagesResponse]);

  const handleUploadImage = async (file: File, colorName: string) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format. Only image files (JPEG, PNG, WEBP, etc.) are allowed.");
      return;
    }

    if (!effectiveMasterSku) {
      toast.error("Master SKU is required before uploading Material images.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("masterSku", effectiveMasterSku);
    formData.append("color", colorName);

    setUploadingColor(colorName);
    try {
      const res = await materialService.uploadProductImage(formData, getToken());
      toast.success(`Image for ${colorName} uploaded successfully!`);
      const rawUrl = res.data.imageUrl;
      const cacheBustedUrl = `${toFullImageUrl(rawUrl)}&t=${Date.now()}`;
      setLocalImages((prev) => ({
        ...prev,
        [colorName]: cacheBustedUrl,
      }));
      refetchImages();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setUploadingColor(null);
    }
  };

  // Single variant editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSku, setEditSku] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editAsin, setEditAsin] = useState("");
  const [editRackAddress, setEditRackAddress] = useState("");
  const [editStatus, setEditStatus] = useState(true);
  const [editOtherAttrs, setEditOtherAttrs] = useState<Record<string, string>>(
    {}
  );

  // Adding new color row state
  const [isAdding, setIsAdding] = useState(false);
  const [newColor, setNewColor] = useState("");
  const [newSizesInput, setNewSizesInput] = useState("");
  const [customBaseSku, setCustomBaseSku] = useState("");
  const [newAsin, setNewAsin] = useState("");
  const [newRackAddress, setNewRackAddress] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Quick add size inside existing color row state
  const [quickAddColorKey, setQuickAddColorKey] = useState<string | null>(null);
  const [quickAddSizesInput, setQuickAddSizesInput] = useState("");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Extract helper for attribute values
  const getSizeValue = (variant: MaterialVariant): string => {
    const sizeAttr = variant.attributes?.find((a) =>
      ["size"].includes(
        (a.materialAttribute?.attributeName || "").toLowerCase().trim()
      )
    );
    return (sizeAttr?.attributeValue || "").trim();
  };

  const getColorValue = (variant: MaterialVariant): string => {
    const colAttr = variant.attributes?.find((a) =>
      ["colour", "color"].includes(
        (a.materialAttribute?.attributeName || "").toLowerCase().trim()
      )
    );
    return (colAttr?.attributeValue || "").trim();
  };

  // Resolve existing Gender value for the Material
  const existingGender = useMemo(() => {
    // 1. Check all existing variants in data?.data
    for (const v of data?.data || []) {
      const matched = v.attributes?.find(
        (a) =>
          (a.materialAttribute?.attributeName || "").toLowerCase().trim() ===
          "gender"
      );
      if (matched?.attributeValue?.trim()) {
        return matched.attributeValue.trim();
      }
    }

    // 2. Check material.gender
    if (material?.gender && material.gender.trim()) {
      return material.gender.trim();
    }

    // 3. Check attributes prop
    const attrGender = attributes.find(
      (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
    );
    if (attrGender?.attributeValue && attrGender.attributeValue.trim()) {
      return attrGender.attributeValue.trim();
    }

    // 4. Check material.attributes
    const prodAttrGender = material?.attributes?.find(
      (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
    );
    if (prodAttrGender?.attributeValue && prodAttrGender.attributeValue.trim()) {
      return prodAttrGender.attributeValue.trim();
    }

    return "";
  }, [data, material, attributes]);

  // Resolve materialAttributeId for Gender
  const resolvedGenderAttrId = useMemo(() => {
    // 1. Check attributes prop
    const attrGender = attributes.find(
      (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
    );
    if (attrGender?.id) return attrGender.id;

    // 2. Check material.attributes
    const prodAttrGender = material?.attributes?.find(
      (a) => (a.attributeName || "").toLowerCase().trim() === "gender"
    );
    if (prodAttrGender?.id) return prodAttrGender.id;

    // 3. Check all existing variants in data?.data
    for (const v of data?.data || []) {
      for (const a of v.attributes || []) {
        if (
          (a.materialAttribute?.attributeName || "").toLowerCase().trim() ===
          "gender"
        ) {
          return a.materialAttributeId || a.materialAttribute?.id;
        }
      }
    }

    return undefined;
  }, [attributes, material, data]);

  // Extra attributes (other than Colour and Size)
  const extraAttributes = useMemo(() => {
    const list = attributes.filter(
      (a) =>
        !["colour", "color", "size"].includes(
          (a.attributeName || "").toLowerCase().trim()
        )
    );

    // Ensure Gender is included if we have existingGender or resolvedGenderAttrId
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
  }, [attributes, existingGender, resolvedGenderAttrId]);

  // Attribute IDs
  const colorAttrProp = attributes.find((a) =>
    ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim())
  );
  const sizeAttrProp = attributes.find((a) =>
    ["size"].includes((a.attributeName || "").toLowerCase().trim())
  );

  const resolvedColorAttrId = useMemo(() => {
    if (colorAttrProp?.id) return colorAttrProp.id;
    for (const v of data?.data || []) {
      for (const a of v.attributes || []) {
        if (
          ["colour", "color"].includes(
            (a.materialAttribute?.attributeName || "").toLowerCase().trim()
          )
        ) {
          return a.materialAttributeId || a.materialAttribute?.id;
        }
      }
    }
    return undefined;
  }, [colorAttrProp, data]);

  const resolvedSizeAttrId = useMemo(() => {
    if (sizeAttrProp?.id) return sizeAttrProp.id;
    for (const v of data?.data || []) {
      for (const a of v.attributes || []) {
        if (
          ["size"].includes(
            (a.materialAttribute?.attributeName || "").toLowerCase().trim()
          )
        ) {
          return a.materialAttributeId || a.materialAttribute?.id;
        }
      }
    }
    return undefined;
  }, [sizeAttrProp, data]);

  // Check if this Material actually has a Size attribute
  const hasSizeAttribute = useMemo(() => {
    const inAttrs = attributes.some((a) =>
      ["size"].includes((a.attributeName || "").toLowerCase().trim())
    );
    if (inAttrs) return true;

    const inProdAttrs = (material?.attributes || []).some((a: any) =>
      ["size"].includes((a.attributeName || "").toLowerCase().trim())
    );
    if (inProdAttrs) return true;

    if (material?.sizeList && material.sizeList.trim().length > 0) return true;

    const inVariants = (data?.data || []).some((v) =>
      (v.attributes || []).some(
        (a) =>
          (a.materialAttribute?.attributeName || "").toLowerCase().trim() === "size" &&
          Boolean(a.attributeValue && a.attributeValue.trim())
      )
    );
    if (inVariants) return true;

    return false;
  }, [attributes, material, data]);

  // Group variants by Color
  const colorGroups = useMemo<ColorGroup[]>(() => {
    const list = data?.data || [];
    if (!list.length) return [];

    const groupsMap = new Map<string, ColorGroup>();

    list.forEach((v) => {
      const colVal = getColorValue(v);
      const colorName = colVal || "Standard";
      const colorKey = colorName.toLowerCase();

      if (!groupsMap.has(colorKey)) {
        const colAttr = v.attributes?.find((a) =>
          ["colour", "color"].includes(
            (a.materialAttribute?.attributeName || "").toLowerCase().trim()
          )
        );
        groupsMap.set(colorKey, {
          colorKey,
          colorName,
          colorAttrId:
            colAttr?.materialAttributeId || colAttr?.materialAttribute?.id,
          variants: [],
        });
      }

      groupsMap.get(colorKey)!.variants.push(v);
    });

    return Array.from(groupsMap.values());
  }, [data]);

  // Generate SKU for a color & size combination
  const generateVariantSku = (
    colorName: string,
    sizeVal: string,
    baseSkuOverride?: string
  ): string => {
    const base = (baseSkuOverride || customBaseSku || masterSku || "").trim();
    const c = (colorName || "").trim();
    const s = (sizeVal || "").trim();

    const allKnownColors = new Set<string>();
    if (Array.isArray(material?.colors)) {
      material.colors.forEach((col: string) =>
        allKnownColors.add(col.toLowerCase().trim())
      );
    }
    colorGroups.forEach((g) =>
      allKnownColors.add(g.colorName.toLowerCase().trim())
    );
    if (c && c.toLowerCase() !== "standard") {
      allKnownColors.add(c.toLowerCase());
    }

    const hasMultipleColors = allKnownColors.size > 1;

    if (hasMultipleColors && c && c.toLowerCase() !== "standard" && s) {
      return base ? `${base}-${c}-${s}` : `${c}-${s}`;
    }

    if (base && s) {
      return `${base}-${s}`;
    }

    if (base && c && c.toLowerCase() !== "standard") {
      return `${base}-${c}`;
    }

    return base || s || "SKU";
  };

  // Parsed sizes for adding new color row
  const parsedNewSizes = useMemo(() => {
    return newSizesInput
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }, [newSizesInput]);

  // Parsed sizes for quick add inside existing color row
  const parsedQuickSizes = useMemo(() => {
    return quickAddSizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [quickAddSizesInput]);

  // Start editing a single variant
  const handleStartEdit = (variant: MaterialVariant) => {
    setEditingId(variant.id);
    setEditSku(variant.variantSku);
    setEditSize(getSizeValue(variant));
    setEditAsin(variant.asin || "");
    setEditRackAddress(variant.rackAddress || "");
    setEditStatus(variant.isActive);

    const otherVals: Record<string, string> = {};
    extraAttributes.forEach((attr) => {
      const matched = variant.attributes?.find(
        (a) =>
          (attr.id && a.materialAttributeId === attr.id) ||
          (a.materialAttribute?.attributeName &&
            a.materialAttribute.attributeName.toLowerCase() ===
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
  const handleSaveEdit = async (variantId: string) => {
    const currentVariant = data?.data?.find((v) => v.id === variantId);
    if (!currentVariant) return;

    const formattedAttrs: {
      materialAttributeId: string;
      attributeValue: string;
    }[] = [];

    // Color
    const existingCol = getColorValue(currentVariant);
    if (resolvedColorAttrId && existingCol) {
      formattedAttrs.push({
        materialAttributeId: resolvedColorAttrId,
        attributeValue: existingCol,
      });
    }

    // Size
    if (resolvedSizeAttrId && editSize.trim()) {
      formattedAttrs.push({
        materialAttributeId: resolvedSizeAttrId,
        attributeValue: editSize.trim(),
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
          materialAttributeId: aId,
          attributeValue: val,
        });
        if (isGender) savedGender = true;
      }
    });

    if (!savedGender && resolvedGenderAttrId && existingGender) {
      formattedAttrs.push({
        materialAttributeId: resolvedGenderAttrId,
        attributeValue: existingGender,
      });
    }

    await updateVariant.mutateAsync({
      id: variantId,
      data: {
        materialId,
        variantSku: editSku.trim(),
        asin: editAsin.trim() || undefined,
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

    await deleteVariant.mutateAsync(selectedVariant.id);

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
      toast.error("Please enter a colour or variant name");
      return;
    }

    const targetSizes = hasSizeAttribute ? parsedNewSizes : [""];

    setIsSavingBatch(true);
    try {
      const promises = targetSizes.map((sz: string) => {
        const formattedAttrs: {
          materialAttributeId: string;
          attributeValue: string;
        }[] = [];

        if (resolvedColorAttrId && colVal) {
          formattedAttrs.push({
            materialAttributeId: resolvedColorAttrId,
            attributeValue: colVal,
          });
        }

        if (resolvedSizeAttrId) {
          formattedAttrs.push({
            materialAttributeId: resolvedSizeAttrId,
            attributeValue: sz,
          });
        }

        // Include any extra attributes from Material default, explicitly ensuring Gender
        let addedGender = false;
        extraAttributes.forEach((attr) => {
          const isGender =
            (attr.attributeName || "").toLowerCase().trim() === "gender";
          let val = (attr.attributeValue || "").trim();
          if (isGender && !val) {
            val = existingGender;
          }
          if (attr.id && val) {
            formattedAttrs.push({
              materialAttributeId: attr.id,
              attributeValue: val,
            });
            if (isGender) addedGender = true;
          }
        });

        if (!addedGender && resolvedGenderAttrId && existingGender) {
          formattedAttrs.push({
            materialAttributeId: resolvedGenderAttrId,
            attributeValue: existingGender,
          });
        }

        const targetSku = generateVariantSku(colVal, sz, customBaseSku);

        return createVariant.mutateAsync({
          materialId,
          variantSku: targetSku,
          asin: newAsin.trim() || undefined,
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
      setCustomBaseSku("");
      setNewAsin("");
      setNewRackAddress("");
      setNewIsActive(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create variants");
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

      // Collect base other attributes from existing variant (like Gender, material, etc.)
      const baseOtherAttrs: {
        materialAttributeId: string;
        attributeValue: string;
      }[] = [];

      if (sample && sample.attributes) {
        sample.attributes.forEach((va) => {
          const name = (va.materialAttribute?.attributeName || "")
            .toLowerCase()
            .trim();
          if (!["colour", "color", "size"].includes(name)) {
            const attrId = va.materialAttributeId || va.materialAttribute?.id;
            const val = va.attributeValue?.trim();
            if (attrId && val) {
              baseOtherAttrs.push({
                materialAttributeId: attrId,
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
              (va.materialAttributeId === oa.materialAttributeId ||
                va.materialAttribute?.id === oa.materialAttributeId) &&
              (va.materialAttribute?.attributeName || "")
                .toLowerCase()
                .trim() === "gender"
          ) ||
          attributes.find(
            (a) =>
              a.id === oa.materialAttributeId &&
              (a.attributeName || "").toLowerCase().trim() === "gender"
          );
        return Boolean(found);
      });

      if (!hasGenderInBase && resolvedGenderAttrId && existingGender) {
        baseOtherAttrs.push({
          materialAttributeId: resolvedGenderAttrId,
          attributeValue: existingGender,
        });
      }

      const promises = parsedQuickSizes.map((sz) => {
        const formattedAttrs: {
          materialAttributeId: string;
          attributeValue: string;
        }[] = [...baseOtherAttrs];

        if (colAttrId && colVal) {
          formattedAttrs.push({
            materialAttributeId: colAttrId,
            attributeValue: colVal,
          });
        }

        if (resolvedSizeAttrId) {
          formattedAttrs.push({
            materialAttributeId: resolvedSizeAttrId,
            attributeValue: sz,
          });
        }

        const targetSku = generateVariantSku(colVal, sz);

        return createVariant.mutateAsync({
          materialId,
          variantSku: targetSku,
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
    } catch (err: any) {
      toast.error(err?.message || "Failed to add sizes");
    } finally {
      setIsQuickAdding(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#E7E0D2] bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#0F1626]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left font-sans">
          <thead className="border-b border-[#E7E0D2] bg-[#0A0E1A] text-xs font-semibold tracking-wider text-[#E8C16D] dark:border-white/[0.08] dark:bg-[#080B11]">
            <tr>
              {/* Img column */}
              <th className="px-3.5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap w-[70px]">
                Img
              </th>

              {/* Colour column */}
              <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap min-w-[130px]">
                Colour
              </th>

              {/* Size column */}
              {hasSizeAttribute && (
                <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap min-w-[110px]">
                  Size
                </th>
              )}

              {/* Variant SKU column */}
              <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap min-w-[180px]">
                Variant SKU
              </th>

              {/* Extra Attributes (e.g. Gender, Material) */}
              {extraAttributes.map((attr) => (
                <th
                  key={attr.id || attr.attributeName}
                  className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap"
                >
                  {attr.attributeName}
                </th>
              ))}

              {/* ASIN */}
              <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap min-w-[130px]">
                ASIN
              </th>

              {/* Rack Address */}
              <th className="px-3.5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap min-w-[130px]">
                Rack Address
              </th>

              {/* Status */}
              <th className="px-3.5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap min-w-[90px]">
                Status
              </th>

              {/* Action */}
              <th className="px-3.5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#E8C16D] whitespace-nowrap min-w-[100px]">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans dark:divide-white/[0.06] dark:bg-[#0F1626]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={extraAttributes.length + (hasSizeAttribute ? 8 : 7)}
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
                  colSpan={extraAttributes.length + (hasSizeAttribute ? 8 : 7)}
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
                    <td className="px-3.5 py-3.5 align-top w-[70px]">
                      {(() => {
                        const dbImageUrl = group.variants.find((v) => v.imageUrl)?.imageUrl;
                        const formattedDbUrl = toFullImageUrl(dbImageUrl);
                        const currentImgUrl =
                          toFullImageUrl(localImages[group.colorName]) ||
                          formattedDbUrl ||
                          (effectiveMasterSku
                            ? toFullImageUrl(
                                `/products/image?masterSku=${encodeURIComponent(
                                  effectiveMasterSku
                                )}&color=${encodeURIComponent(group.colorName)}`
                              )
                            : undefined);
                        const isUploadingThis = uploadingColor === group.colorName;
                        const hasImage = Boolean(localImages[group.colorName] || formattedDbUrl);

                        return (
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
                                handleUploadImage(droppedFiles[0], group.colorName);
                              }
                            }}
                            className={`relative group flex h-12 w-12 items-center justify-center rounded-lg border transition-all ${
                              dragOverColor === group.colorName
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
                                  title="Drag image here or click to replace"
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
                                title="Drag & drop image here or click to upload"
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
                                  handleUploadImage(e.target.files[0], group.colorName);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </div>
                        );
                      })()}
                    </td>

                    {/* 1. Colour Column */}
                    <td className="px-3.5 py-3.5 align-top">
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-white/20 shadow-2xs shrink-0"
                            style={{
                              backgroundColor: getColorHex(group.colorName),
                            }}
                          />
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                            {group.colorName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
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
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#B88728] dark:text-[#F5C451] hover:underline cursor-pointer"
                              title="Add more sizes to this color"
                            >
                              <Plus size={11} className="stroke-[3]" />
                              <span>Add Size</span>
                            </button>
                          )}
                        </div>

                        {/* Quick Add Sizes Inline Popup for this Color */}
                        {isQuickAddOpen && (
                          <div className="mt-2 w-full max-w-[210px] p-2 rounded-xl bg-amber-50/80 dark:bg-[#F5C451]/10 border border-amber-200/70 dark:border-[#F5C451]/20 space-y-1.5">
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
                      <td className="px-3.5 py-3.5 align-top">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;
                          const szVal = getSizeValue(variant) || "--";

                          return (
                            <div
                              key={variant.id}
                              className="min-h-[42px] py-1 flex items-center"
                            >
                              {isEditing ? (
                                <input
                                  value={editSize}
                                  onChange={(e) => {
                                    const nextSz = e.target.value;
                                    setEditSize(nextSz);
                                    const col = getColorValue(variant);
                                    setEditSku(
                                      generateVariantSku(col, nextSz)
                                    );
                                  }}
                                  className="h-8 w-20 px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
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
                    <td className="px-3.5 py-3.5 align-top">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              className="min-h-[42px] py-1 flex items-center font-mono font-semibold text-slate-900 dark:text-white text-xs sm:text-sm"
                            >
                              {isEditing ? (
                                <input
                                  value={editSku}
                                  onChange={(e) => setEditSku(e.target.value)}
                                  className="h-8 w-full max-w-[260px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
                                />
                              ) : (
                                <span className="truncate" title={variant.variantSku}>
                                  {variant.variantSku}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* Extra Attributes Columns (including Gender) */}
                    {extraAttributes.map((attr) => (
                      <td
                        key={attr.id || attr.attributeName}
                        className="px-3.5 py-3.5 align-top"
                      >
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {group.variants.map((variant) => {
                            const isEditing = editingId === variant.id;
                            const matched = variant.attributes?.find(
                              (a) =>
                                (attr.id && a.materialAttributeId === attr.id) ||
                                (a.materialAttribute?.attributeName &&
                                  a.materialAttribute.attributeName.toLowerCase() ===
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
                                className="min-h-[42px] py-1 flex items-center text-slate-700 dark:text-slate-300 text-xs"
                              >
                                {isEditing ? (
                                  <input
                                    value={
                                      editOtherAttrs[attr.id || ""] ||
                                      editOtherAttrs[attr.attributeName] ||
                                      (isGender ? existingGender : "") ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setEditOtherAttrs((prev) => ({
                                        ...prev,
                                        [attr.id || ""]: e.target.value,
                                        [attr.attributeName]: e.target.value,
                                      }))
                                    }
                                    placeholder={attr.attributeName}
                                    className="h-8 w-full min-w-[90px] max-w-[140px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
                                  />
                                ) : (
                                  <span
                                    className={
                                      isGender && val !== "--"
                                        ? "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20 font-sans"
                                        : ""
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
                    ))}

                    {/* 4. ASIN Column */}
                    <td className="px-3.5 py-3.5 align-top">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              className="min-h-[42px] py-1 flex items-center font-mono text-slate-700 dark:text-slate-300 text-xs"
                            >
                              {isEditing ? (
                                <input
                                  value={editAsin}
                                  onChange={(e) => setEditAsin(e.target.value)}
                                  placeholder="ASIN"
                                  className="h-8 w-full min-w-[90px] max-w-[140px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
                                />
                              ) : (
                                <span>{variant.asin || "--"}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* 5. Rack Address Column */}
                    <td className="px-3.5 py-3.5 align-top">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              className="min-h-[42px] py-1 flex items-center font-medium text-slate-700 dark:text-slate-300 text-xs"
                            >
                              {isEditing ? (
                                <input
                                  value={editRackAddress}
                                  onChange={(e) =>
                                    setEditRackAddress(e.target.value)
                                  }
                                  placeholder="Rack Address"
                                  className="h-8 w-full min-w-[90px] max-w-[140px] px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
                                />
                              ) : (
                                <span>{variant.rackAddress || "--"}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    {/* 6. Status Column */}
                    <td className="px-3.5 py-3.5 align-top text-center">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              className="min-h-[42px] py-1 flex items-center justify-center"
                            >
                              {isEditing ? (
                                <Switch
                                  checked={editStatus}
                                  onCheckedChange={setEditStatus}
                                />
                              ) : (
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                    variant.isActive
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
                    <td className="px-3.5 py-3.5 align-top text-center">
                      <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {group.variants.map((variant) => {
                          const isEditing = editingId === variant.id;

                          return (
                            <div
                              key={variant.id}
                              className="min-h-[42px] py-1 flex items-center justify-center gap-1.5"
                            >
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveEdit(variant.id)}
                                    disabled={updateVariant.isPending}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setEditingId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(variant)}
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
            <tr className="bg-slate-50/70 dark:bg-white/[0.02] border-t-2 border-[#E8C16D]/30">
              {/* Empty Img placeholder cell */}
              <td className="px-3.5 py-3 align-top text-center text-slate-400 dark:text-slate-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-white/10 mx-auto text-slate-300 dark:text-slate-600">
                  <ImagePlus size={14} />
                </div>
              </td>

              {/* Colour input */}
              <td className="px-3.5 py-3 align-top">
                {isAdding ? (
                  <div className="space-y-1">
                    <input
                      autoFocus
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Colour (e.g. Black)"
                      className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
                    />
                    {Array.isArray(material?.colors) && material.colors && material.colors.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {material.colors.map((c: string) => (
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
                ) : (
                  <span
                    onClick={() => setIsAdding(true)}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 italic text-xs"
                  >
                    + Add Color
                  </span>
                )}
              </td>

              {/* Size input (Comma-separated sizes) */}
              {hasSizeAttribute && (
                <td className="px-3.5 py-3 align-top">
                  {isAdding ? (
                    <div className="space-y-1">
                      <input
                        value={newSizesInput}
                        onChange={(e) => setNewSizesInput(e.target.value)}
                        placeholder="e.g. M, L, XL, 32"
                        className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
                      />
                      {material?.sizeList && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {material.sizeList
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
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition ${
                                    isIncluded
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
                  ) : (
                    <span
                      onClick={() => setIsAdding(true)}
                      className="cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 italic text-xs"
                    >
                      --
                    </span>
                  )}
                </td>
              )}

              {/* Variant SKU - Live preview */}
              <td className="px-3.5 py-3 align-top">
                {isAdding ? (
                  <div className="space-y-1">
                    {hasSizeAttribute ? (
                      parsedNewSizes.length === 0 ? (
                        <span className="text-slate-400 italic text-xs">
                          Enter sizes to preview SKUs
                        </span>
                      ) : (
                        <div className="flex flex-col space-y-1">
                          {parsedNewSizes.map((sz) => {
                            const previewSku = generateVariantSku(
                              newColor,
                              sz,
                              customBaseSku
                            );
                            return (
                              <div
                                key={sz}
                                className="h-7 flex items-center gap-2 font-mono text-xs"
                              >
                                <span className="inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 font-bold rounded bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/20">
                                  {sz}
                                </span>
                                <span className="text-slate-400">â†’</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {previewSku}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <div className="h-7 flex items-center font-mono text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {generateVariantSku(newColor, "", customBaseSku)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span
                    onClick={() => setIsAdding(true)}
                    className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300 font-mono text-xs"
                  >
                    {masterSku || "--"}
                  </span>
                )}
              </td>

              {/* Extra Attributes (including Gender) */}
              {extraAttributes.map((attr) => {
                const isGender =
                  (attr.attributeName || "").toLowerCase().trim() === "gender";
                const displayVal =
                  (isGender ? existingGender : "") ||
                  attr.attributeValue ||
                  "--";

                return (
                  <td
                    key={attr.id || attr.attributeName}
                    className="px-3.5 py-3 align-top text-xs"
                  >
                    {isGender && displayVal !== "--" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20">
                        {displayVal}
                      </span>
                    ) : (
                      <span className="text-slate-400">{displayVal}</span>
                    )}
                  </td>
                );
              })}

              {/* ASIN */}
              <td className="px-3.5 py-3 align-top">
                {isAdding ? (
                  <input
                    value={newAsin}
                    onChange={(e) => setNewAsin(e.target.value)}
                    placeholder="ASIN (optional)"
                    className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
                  />
                ) : (
                  <span
                    onClick={() => setIsAdding(true)}
                    className="cursor-pointer text-slate-400 text-xs"
                  >
                    --
                  </span>
                )}
              </td>

              {/* Rack Address */}
              <td className="px-3.5 py-3 align-top">
                {isAdding ? (
                  <input
                    value={newRackAddress}
                    onChange={(e) => setNewRackAddress(e.target.value)}
                    placeholder="Rack Address"
                    className="h-8 w-full px-2.5 rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-[#0B0F17] text-xs text-slate-900 dark:text-white outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D]/30 shadow-2xs"
                  />
                ) : (
                  <span
                    onClick={() => setIsAdding(true)}
                    className="cursor-pointer text-slate-400 text-xs"
                  >
                    --
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="px-3.5 py-3 align-top text-center">
                {isAdding ? (
                  <div className="flex items-center justify-center pt-1">
                    <Switch
                      checked={newIsActive}
                      onCheckedChange={setNewIsActive}
                    />
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">--</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-3.5 py-3 align-top text-center">
                <div className="flex items-center justify-center gap-2">
                  {isAdding ? (
                    <>
                      <Button
                        size="sm"
                        fullWidth={false}
                        onClick={handleBatchSave}
                        disabled={
                          isSavingBatch || parsedNewSizes.length === 0
                        }
                      >
                        {isSavingBatch
                          ? "Saving..."
                          : `Save ${parsedNewSizes.length > 0 ? `(${parsedNewSizes.length})` : ""}`}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth={false}
                        onClick={() => {
                          setIsAdding(false);
                          setNewColor("");
                          setNewSizesInput("");
                          setCustomBaseSku("");
                          setNewAsin("");
                          setNewRackAddress("");
                          setNewIsActive(true);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAdding(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#E8C16D]/10 px-3 py-1.5 text-xs font-bold text-[#0A0E1A] dark:text-[#F5C451] hover:bg-[#FFF3D6] dark:hover:bg-[#E8C16D]/20 ring-1 ring-[#E8C16D]/30 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Add Variant</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
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


