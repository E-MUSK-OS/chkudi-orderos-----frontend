"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Circle,
  Crop,
  ImageIcon,
  ImagePlus,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import DashboardLayout from "../../layout/DashboardLayout";
import { Switch } from "@/components/ui/switch";
import { API_BASE_URL } from "@/lib/config";
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";
import { materialService } from "./services/material.service";
import { useMaterial } from "./hooks/useMaterials";
import { useDropdownOptions } from "./hooks/useDropdownOptions";
import {
  useDeleteMaterialVariant,
  useMaterialVariant,
  useUpdateMaterialVariant,
} from "./hooks/useMaterialVariants";
import type { Material, MaterialAttribute } from "./types/material.types";
import type { MaterialVariant } from "./types/materialVariant.types";
import DeleteVariantModal from "./components/DeleteVariantModal";
import MaterialForm from "./components/MaterialForm";
import ColorMultiSelect from "@/components/Dashboard/Products/ManageProducts/components/ColorMultiSelect";
import ProductImageAdjustModal from "@/components/Dashboard/Products/ManageProducts/components/ProductImageAdjustModal";

interface Props {
  variantId?: string;
  returnPath?: string;
}

type VariantWithMaterial = MaterialVariant & { material?: Material };

const INPUT_CLASS =
  "w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white dark:border-white/[0.08] dark:bg-[#0B0F17] text-[#0A0E1A] dark:text-white outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] focus:ring-2 focus:ring-[#E8C16D]/20 dark:focus:ring-[#F5C451]/20 transition-all placeholder:text-slate-400 shadow-xs";

const LABEL_CLASS =
  "block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight";

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

const getAttrValue = (variant: MaterialVariant, attrNames: string[]): string => {
  const matched = variant.attributes?.find((a) => {
    const name = (a.materialAttribute?.attributeName || "").toLowerCase().trim();
    return attrNames.includes(name);
  });
  return matched?.attributeValue || "";
};

export default function EditMaterialVariant({
  variantId: propVariantId,
  returnPath = "/dashboard/settings/manage-material/material-profile",
}: Props) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const rawId =
    propVariantId ||
    (Array.isArray(params?.id) ? params.id[0] : (params?.id as string)) ||
    searchParams.get("id") ||
    "";

  const fromParam = searchParams.get("from") || "";
  const effectiveReturnPath =
    fromParam === "master-material-profile"
      ? "/dashboard/settings/manage-material/master-material-profile"
      : returnPath;

  const {
    data: variantResponse,
    isLoading: variantLoading,
    error: variantError,
    refetch: refetchVariant,
  } = useMaterialVariant(rawId);

  const variant = variantResponse?.data as VariantWithMaterial | undefined;
  const materialId = variant?.materialId || searchParams.get("materialId") || "";

  const { data: materialResponse, isLoading: materialLoading } = useMaterial(materialId);
  const material: Material | undefined = materialResponse?.data ?? variant?.material;

  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  const queryClient = useQueryClient();
  const updateVariant = useUpdateMaterialVariant();
  const deleteVariant = useDeleteMaterialVariant();

  const dynamicColors = useMemo(() => {
    let localSaved: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("orderos_custom_colors");
        localSaved = stored ? JSON.parse(stored) : [];
      } catch {}
    }

    const distMat = dropdownData?.distinctFromMaterials || dropdownData?.distinctFromProducts;
    const merged = buildMergedOptions(
      ["color", "colors"],
      [],
      dropdownData?.savedOptions,
      [...(distMat?.colors || []), ...localSaved]
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

  const serverColorHexMap = useMemo(() => {
    const map: Record<string, string> = {};
    (dropdownData?.savedOptions || [])
      .filter((o: any) => ["color", "colors"].includes(o.field?.toLowerCase()) && o.isActive !== false)
      .forEach((o: any) => {
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

  const attributes: MaterialAttribute[] = useMemo(
    () => material?.attributes || [],
    [material]
  );

  const resolvedColorAttrId = useMemo(
    () =>
      attributes.find((a) =>
        ["colour", "color"].includes((a.attributeName || "").toLowerCase().trim())
      )?.id,
    [attributes]
  );

  const resolvedSizeAttrId = useMemo(
    () =>
      attributes.find((a) =>
        ["size", "dimension"].includes((a.attributeName || "").toLowerCase().trim())
      )?.id,
    [attributes]
  );

  const extraAttributes = useMemo(
    () =>
      attributes.filter((a) => {
        const name = (a.attributeName || "").toLowerCase().trim();
        return !["colour", "color", "size", "dimension"].includes(name);
      }),
    [attributes]
  );

  const hasSizeAttribute =
    Boolean(resolvedSizeAttrId) ||
    Boolean(variant && getAttrValue(variant, ["size", "dimension"]));
  const effectiveMasterSku = (material?.masterSku || material?.sku || "").trim();

  // Form states
  const [editSku, setEditSku] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editAsin, setEditAsin] = useState("");
  const [editRackAddress, setEditRackAddress] = useState("");
  const [editStatus, setEditStatus] = useState(true);
  const [editExtraAttrs, setEditExtraAttrs] = useState<Record<string, string>>({});
  const [initializedId, setInitializedId] = useState<string | null>(null);

  // Image upload, adjust & preview states (matching EditProductVariant)
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [adjustingImage, setAdjustingImage] = useState<{
    url: string;
    color: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active tab state: default to Add Variants when editing a variant
  const [activeTab, setActiveTab] = useState<"general" | "kardex" | "variants">("variants");

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "";

  const { data: imagesResponse, refetch: refetchImages } = useQuery({
    queryKey: ["Material-images", effectiveMasterSku],
    queryFn: () => materialService.getProductImages(effectiveMasterSku, getToken()),
    enabled: !!effectiveMasterSku,
    staleTime: 1000 * 60 * 5,
  });

  // Populate fields once variant + attributes load
  useEffect(() => {
    if (!variant || initializedId === variant.id) return;

    const colorVal = getAttrValue(variant, ["colour", "color"]);
    const sizeVal = getAttrValue(variant, ["size", "dimension"]);

    setEditSku(variant.variantSku || "");
    setEditColor(colorVal);
    setEditSize(sizeVal);
    setEditAsin(variant.asin || "");
    setEditRackAddress(variant.rackAddress || "");
    setEditStatus(variant.isActive ?? true);

    const extraMap: Record<string, string> = {};
    extraAttributes.forEach((attr) => {
      const matched = variant.attributes?.find(
        (a) =>
          (attr.id && a.materialAttributeId === attr.id) ||
          (a.materialAttribute?.attributeName &&
            a.materialAttribute.attributeName.toLowerCase() ===
              attr.attributeName.toLowerCase())
      );
      extraMap[attr.id || attr.attributeName] =
        matched?.attributeValue || attr.attributeValue || "";
    });
    setEditExtraAttrs(extraMap);
    setInitializedId(variant.id);
  }, [variant, extraAttributes, initializedId]);

  const activeColorName = editColor || variant?.variantSku || "Standard";
  const displayedImgUrl = useMemo(() => {
    if (localImageUrl) return localImageUrl;
    if (imagesResponse?.data && activeColorName) {
      const match = Object.entries(imagesResponse.data).find(
        ([k]) => k.toLowerCase().trim() === activeColorName.toLowerCase().trim()
      );
      if (match?.[1]) return toFullImageUrl(match[1]);
    }
    return toFullImageUrl(variant?.imageUrl || variant?.imgfileurl);
  }, [localImageUrl, imagesResponse, activeColorName, variant]);

  const hasImage = Boolean(displayedImgUrl);

  const navigateBack = () => {
    if (typeof window !== "undefined" && materialId) {
      try {
        sessionStorage.setItem("orderos_return_expanded_material", materialId);
      } catch {}
    }
    router.push(effectiveReturnPath);
  };

  const generateAutoSku = (colorVal: string, sizeVal: string) => {
    const parts = [effectiveMasterSku, colorVal.trim(), sizeVal.trim()].filter(Boolean);
    return parts.join("-");
  };

  const handleUploadImage = async (file: File, colorName: string) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format. Only image files are allowed.");
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

    setIsUploadingImage(true);
    try {
      const res = await materialService.uploadProductImage(formData, getToken());
      const cacheBustedUrl = `${toFullImageUrl(res.data.imageUrl)}&t=${Date.now()}`;
      setLocalImageUrl(cacheBustedUrl);
      toast.success(`Image for ${colorName} uploaded successfully!`);
      await queryClient.invalidateQueries({
        queryKey: ["Material-images", effectiveMasterSku],
      });
      refetchImages();
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variant) return;
    if (!editSku.trim()) {
      toast.error("Variant SKU is required.");
      return;
    }

    const formattedAttrs: { materialAttributeId: string; attributeValue: string }[] = [];

    const colorAttrId =
      resolvedColorAttrId ||
      variant.attributes?.find((a) =>
        ["colour", "color"].includes((a.materialAttribute?.attributeName || "").toLowerCase().trim())
      )?.materialAttributeId;

    if (colorAttrId && editColor.trim()) {
      formattedAttrs.push({
        materialAttributeId: colorAttrId,
        attributeValue: editColor.trim(),
      });
    }

    const sizeAttrId =
      resolvedSizeAttrId ||
      variant.attributes?.find((a) =>
        ["size", "dimension"].includes((a.materialAttribute?.attributeName || "").toLowerCase().trim())
      )?.materialAttributeId;

    if (sizeAttrId && editSize.trim()) {
      formattedAttrs.push({
        materialAttributeId: sizeAttrId,
        attributeValue: editSize.trim(),
      });
    }

    extraAttributes.forEach((attr) => {
      const val = (editExtraAttrs[attr.id || attr.attributeName] || "").trim();
      if (attr.id && val) {
        formattedAttrs.push({
          materialAttributeId: attr.id,
          attributeValue: val,
        });
      }
    });

    try {
      await updateVariant.mutateAsync({
        id: variant.id,
        data: {
          variantSku: editSku.trim(),
          asin: editAsin.trim(),
          rackAddress: editRackAddress.trim(),
          isActive: editStatus,
          attributes: formattedAttrs,
        },
      });
      navigateBack();
    } catch {
      // Error toast is handled by useUpdateMaterialVariant
    }
  };

  const handleDeleteConfirm = async () => {
    if (!variant) return;
    try {
      await deleteVariant.mutateAsync(variant.id);
      setDeleteModalOpen(false);
      navigateBack();
    } catch {
      // Error toast is handled by useDeleteMaterialVariant
    }
  };

  const isLoading = variantLoading || (Boolean(materialId) && materialLoading);

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Material Variant">
        <div className="space-y-4 max-w-[1600px] mx-auto">
          <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-6 sm:p-8 animate-pulse space-y-6">
            <div className="h-7 w-56 bg-slate-200 dark:bg-white/[0.06] rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
              <div className="h-12 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
            </div>
            <div className="h-48 bg-slate-100 dark:bg-white/[0.04] rounded-3xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (variantError || !variant) {
    return (
      <DashboardLayout title="Edit Material Variant">
        <div className="rounded-3xl border border-red-200 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5 p-8 text-center space-y-3 max-w-[1600px] mx-auto">
          <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-base font-bold text-red-600 dark:text-red-400">
            Material Variant Not Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            The requested material variant could not be loaded or may have been deleted.
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
              onClick={() => navigateBack()}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-[#0A0E1A] text-[#E8C16D] hover:bg-slate-900 dark:bg-[#F5C451] dark:text-black cursor-pointer"
            >
              Back to Material Profile
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Material Variant">
      <div className="space-y-3 font-sans text-slate-900 dark:text-slate-100 py-0 max-w-[1600px] mx-auto">
        {/* Top Header Card */}
        <div className="w-full rounded-2xl sm:rounded-3xl border border-[#EAE4D8] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <button
              type="button"
              onClick={() => navigateBack()}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Back to Material Profile"
            >
              <ArrowLeft size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                  Edit Material Variant
                </h1>
                {(editSku || variant.variantSku) && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/40 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
                    {editSku || variant.variantSku}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {material?.materialName
                  ? `Update variant details for ${material.materialName}${effectiveMasterSku ? ` (${effectiveMasterSku})` : ""}${editColor ? ` — Color: ${editColor}` : ""}.`
                  : "Update material variant SKU, attributes, rack address, and status."}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full md:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => navigateBack()}
              disabled={updateVariant.isPending || deleteVariant.isPending}
              className="inline-flex flex-1 md:flex-initial min-h-[38px] sm:h-11 items-center justify-center px-4 sm:px-6 rounded-full text-xs sm:text-sm font-bold border border-[#E7E0D2] bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-200 dark:hover:bg-white/[0.04] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="edit-material-variant-form"
              disabled={updateVariant.isPending || deleteVariant.isPending}
              className="inline-flex flex-1 md:flex-initial min-h-[38px] sm:h-11 items-center justify-center gap-2 px-4 sm:px-6 rounded-full text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {updateVariant.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-current" />
                  <span>Updating...</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Update Variant</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs Navigation: General, Kardex, Add Variants */}
        <div className="w-full py-1">
          <div className="w-full rounded-2xl sm:rounded-full bg-white dark:bg-[#080B11] border border-[#E7E0D2] dark:border-white/[0.08] p-1.5 flex items-center justify-between shadow-xs gap-1 sm:gap-2 select-none overflow-x-auto no-scrollbar">
            {(
              [
                { id: "general", label: "General" },
                { id: "kardex", label: "Kardex" },
                { id: "variants", label: "Add Variants" },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 sm:px-6 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-[#0A0E1A] text-[#E8C16D] shadow-md border border-[#0A0E1A] dark:bg-[#E8C16D] dark:text-[#0A0E1A] dark:border-[#E8C16D] dark:shadow-[0_0_16px_rgba(232,193,109,0.4)]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.05] border border-transparent font-medium"
                  )}
                >
                  {isActive ? (
                    <CheckCircle2
                      size={16}
                      className="text-[#E8C16D] dark:text-[#0A0E1A] shrink-0"
                    />
                  ) : (
                    <Circle
                      size={16}
                      className="text-slate-400 dark:text-slate-500 shrink-0"
                    />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Read-Only General / Kardex Tabs */}
        {(activeTab === "general" || activeTab === "kardex") && material && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-xs">
            <MaterialForm
              mode="edit"
              material={material}
              onSuccess={() => {}}
              readOnly
              controlledTab={activeTab}
              hideTabsNav
            />
          </div>
        )}

        {/* Add Variants (Edit Variant) Tab */}
        <div
          className={cn(
            "rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-5 shadow-xs",
            activeTab !== "variants" && "hidden"
          )}
        >
          <form
            id="edit-material-variant-form"
            onSubmit={handleSubmit}
            className="space-y-3.5 text-slate-900 dark:text-white"
          >
            {/* 1. IMAGE UPLOAD & PREVIEW (Side by side, matching EditProductVariant) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
              {/* Left: Image Upload & Adjust */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLASS}>Variant Image</label>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Color:{" "}
                    <strong className="text-slate-700 dark:text-slate-200">
                      {activeColorName}
                    </strong>
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
                    if (isUploadingImage) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      const objectUrl = URL.createObjectURL(file);
                      setAdjustingImage({
                        url: objectUrl,
                        color: activeColorName,
                      });
                    }
                  }}
                  onClick={() => {
                    if (!isUploadingImage) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={cn(
                    "flex-1 min-h-[190px] sm:min-h-[220px] rounded-2xl sm:rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-5 text-center transition-all cursor-pointer",
                    dragOver
                      ? "border-[#E8C16D] bg-[#FFF9EC] dark:bg-[#F5C451]/10 ring-2 ring-[#E8C16D]/30"
                      : "border-slate-200 dark:border-white/[0.12] bg-slate-50/50 dark:bg-[#0B0F17]/70 hover:border-[#E8C16D] dark:hover:border-[#F5C451]/60 hover:bg-[#FEFAEE]/50 dark:hover:bg-white/[0.02]"
                  )}
                >
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-[#B88728] dark:text-[#F5C451]" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Uploading image...
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
                            ? "Drop image to replace"
                            : "Drop image or click to browse"}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          PNG, JPG, WEBP supported for {activeColorName}
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const objectUrl = URL.createObjectURL(file);
                        setAdjustingImage({
                          url: objectUrl,
                          color: activeColorName,
                        });
                      }
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Upload & Adjust Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex-1 h-10 sm:h-11 inline-flex items-center justify-center gap-1.5 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] text-slate-700 dark:text-slate-300 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40 dark:hover:bg-white/[0.03] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={15} className="text-[#B88728] dark:text-[#F5C451]" />
                    <span>Upload Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (displayedImgUrl) {
                        setAdjustingImage({
                          url: displayedImgUrl,
                          color: activeColorName,
                        });
                      }
                    }}
                    disabled={!hasImage || !displayedImgUrl || isUploadingImage}
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

              {/* Right: Current Image Preview */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLASS}>Current Preview</label>
                  {hasImage && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                      {activeColorName}
                    </span>
                  )}
                </div>

                <div className="relative flex-1 min-h-[235px] sm:min-h-[265px] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/40 dark:bg-[#0B0F17]/60 flex items-center justify-center p-4 overflow-hidden">
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Loader2 className="h-7 w-7 animate-spin text-[#E8C16D]" />
                      <span className="text-xs">Updating preview...</span>
                    </div>
                  ) : hasImage && displayedImgUrl ? (
                    <img
                      src={displayedImgUrl}
                      alt={activeColorName}
                      onClick={() => setPreviewOpen(true)}
                      className="max-h-[220px] sm:max-h-[250px] w-auto rounded-2xl object-contain shadow-xs cursor-pointer hover:scale-[1.02] transition-transform"
                      title="Click to view full image"
                    />
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
                        Upload an image on the left to preview
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. COLOR & SIZE (Color uses dropdown matching EditProductVariant) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="space-y-1.5">
                <ColorMultiSelect
                  label="Color"
                  singleSelect
                  value={editColor ? [editColor] : []}
                  onChange={(cols) => {
                    const nextColor = cols[0] || "";
                    setEditColor(nextColor);
                  }}
                  additionalColors={dynamicColors}
                  disabledColors={disabledColors}
                  colorHexMap={serverColorHexMap}
                  useExternalColorsOnly={Boolean(dropdownData)}
                />
              </div>

              {hasSizeAttribute && (
                <div className="space-y-1.5">
                  <label className={LABEL_CLASS}>Size</label>
                  <input
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    placeholder="e.g. M, L, 32"
                    className={cn(INPUT_CLASS, "font-mono")}
                  />
                </div>
              )}
            </div>

            {/* 3. PRIMARY VARIANT FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              {/* Variant SKU */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>
                  Variant SKU <span className="text-rose-500">*</span>
                </label>
                <input
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                  placeholder="Enter Variant SKU..."
                  className={cn(INPUT_CLASS, "font-mono")}
                  required
                />
              </div>

              {/* Rack Address */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Rack Address</label>
                <input
                  value={editRackAddress}
                  onChange={(e) => setEditRackAddress(e.target.value)}
                  placeholder="e.g. A-12"
                  className={INPUT_CLASS}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className={LABEL_CLASS}>Status</label>
                <div className="h-11 sm:h-12 px-3.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {editStatus ? "Active" : "Inactive"}
                  </span>
                  <Switch checked={editStatus} onCheckedChange={setEditStatus} />
                </div>
              </div>
            </div>

            {/* 4. EXTRA ATTRIBUTES */}
            {extraAttributes.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Additional Attributes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extraAttributes.map((attr) => {
                    const key = attr.id || attr.attributeName;
                    return (
                      <div key={key} className="space-y-1.5">
                        <label className={LABEL_CLASS}>{attr.attributeName}</label>
                        <input
                          value={editExtraAttrs[key] ?? ""}
                          onChange={(e) =>
                            setEditExtraAttrs((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          placeholder={`Enter ${attr.attributeName}...`}
                          className={INPUT_CLASS}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-6 pt-5 border-t border-[#E7E0D2] dark:border-white/[0.08] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                disabled={updateVariant.isPending || deleteVariant.isPending}
                className="w-full sm:w-auto min-h-[38px] sm:h-11 px-4 sm:px-5 rounded-full text-xs sm:text-sm font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={16} />
                <span>Delete Variant</span>
              </button>

              <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigateBack()}
                  disabled={updateVariant.isPending || deleteVariant.isPending}
                  className="flex-1 sm:flex-none min-h-[38px] sm:h-11 px-4 sm:px-6 rounded-full text-xs sm:text-sm font-bold border border-[#E7E0D2] bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-200 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98] text-center"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updateVariant.isPending || deleteVariant.isPending}
                  className="flex-1 sm:flex-none min-h-[38px] sm:h-11 px-4 sm:px-7 rounded-full text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updateVariant.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-current" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      <span>Update Variant</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Image Adjust / Crop Modal */}
      {adjustingImage && (
        <ProductImageAdjustModal
          isOpen={true}
          onClose={() => {
            if (adjustingImage.url.startsWith("blob:")) {
              URL.revokeObjectURL(adjustingImage.url);
            }
            setAdjustingImage(null);
          }}
          imageSrc={adjustingImage.url}
          colorName={adjustingImage.color}
          masterSku={effectiveMasterSku}
          productName={material?.materialName}
          category={material?.category}
          isUploading={isUploadingImage}
          onConfirm={(file) => {
            const targetColor = adjustingImage.color;
            if (adjustingImage.url.startsWith("blob:")) {
              URL.revokeObjectURL(adjustingImage.url);
            }
            setAdjustingImage(null);
            handleUploadImage(file, targetColor);
          }}
        />
      )}

      {/* Full Image Lightbox Preview */}
      {previewOpen && displayedImgUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full rounded-3xl bg-white dark:bg-[#0F1626] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08]">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {activeColorName} — {editSku || variant.variantSku}
              </span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.08] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img
                src={displayedImgUrl}
                alt={activeColorName}
                className="max-h-[70vh] w-auto object-contain rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}

      <DeleteVariantModal
        open={deleteModalOpen}
        variant={variant}
        loading={deleteVariant.isPending}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </DashboardLayout>
  );
}
