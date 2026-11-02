"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Package,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  Tags,
  Plus,
  Trash2,
  Sparkles,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

import type { Material } from "../types/material.types";
import {
  materialSchema,
  type MaterialFormValues,
} from "../validations/material.validation";
import {
  materialDefaultValues,
  categoryOptions,
  subCategoryOptions,
  manufacturingGroupOptions,
  unitOptions,
  gstRateOptions,
  brandOptions,
  forUseOptions,
  costApplyingModeOptions,
  purchaseTypeOptions,
  issueModeOptions,
  consumptionModeOptions,
  defaultMaterialAttributes,
} from "../constants/material.constants";
import { useCreateMaterial, useUpdateMaterial } from "../hooks/useMaterials";

import ProductTabsNav, { type ProductActiveTab } from "./ProductTabsNav";
import SectionCard from "./SectionCard";
import DropdownWithOther, { type DropdownOption } from "./DropdownWithOther";
import ColorMultiSelect from "./ColorMultiSelect";

interface Props {
  mode: "create" | "edit";
  material?: Material;
  onSuccess: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onDeleteClick?: () => void;
}

export default function MaterialForm({
  mode,
  material,
  onSuccess,
  onLoadingChange,
  onDeleteClick,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProductActiveTab>("general");

  const queryClient = useQueryClient();
  const createMaterialMutation = useCreateMaterial();
  const updateMaterialMutation = useUpdateMaterial();

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema) as never,
    defaultValues: materialDefaultValues,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes",
  });

  const watchedCategory = watch("category");
  const watchedMasterSku = watch("masterSku") || watch("sku") || "";
  const watchedAttributes = watch("attributes");

  // Sync loading state to parent
  useEffect(() => {
    onLoadingChange?.(
      isSubmitting ||
        createMaterialMutation.isPending ||
        updateMaterialMutation.isPending
    );
  }, [
    isSubmitting,
    createMaterialMutation.isPending,
    updateMaterialMutation.isPending,
    onLoadingChange,
  ]);

  // Pre-fill form when editing
  useEffect(() => {
    if (mode === "edit" && material) {
      const allVariantAttrs = (material.variants || []).flatMap(
        (v: any) => v.attributes || []
      );

      const existingAttrs: Array<{ id?: string; attributeName: string; attributeValue: string }> =
        (material.attributes || [])
          .filter((a: any) => {
            const lower = (a.attributeName || "").toLowerCase().trim();
            return !["colour", "color"].includes(lower);
          })
          .map((a: any) => {
            const matchedValues = allVariantAttrs
              .filter((va: any) => {
                if (va.materialAttributeId && a.id && va.materialAttributeId === a.id) return true;
                const vaName = (va.materialAttribute?.attributeName || "").toLowerCase().trim();
                const aName = (a.attributeName || "").toLowerCase().trim();
                return vaName && aName && vaName === aName;
              })
              .map((va: any) => (va.attributeValue || "").trim())
              .filter(Boolean);

            const uniqueValues = Array.from(new Set(matchedValues));
            const valString = uniqueValues.join(", ");

            return {
              id: a.id,
              attributeName: a.attributeName || "",
              attributeValue: valString || a.attributeValue || "",
            };
          });

      const seenAttrNames = new Set(
        existingAttrs.map((ca: any) => (ca.attributeName || "").toLowerCase().trim())
      );
      allVariantAttrs.forEach((va: any) => {
        const name = (va.materialAttribute?.attributeName || "").trim();
        const lower = name.toLowerCase();
        if (name && !["colour", "color"].includes(lower) && !seenAttrNames.has(lower)) {
          seenAttrNames.add(lower);
          const val = (va.attributeValue || "").trim();
          existingAttrs.push({
            id: va.materialAttributeId || undefined,
            attributeName: name,
            attributeValue: val,
          });
        }
      });

      if (
        material.sizeList &&
        !seenAttrNames.has("size") &&
        !seenAttrNames.has("dimension")
      ) {
        existingAttrs.unshift({
          attributeName: "Size",
          attributeValue: material.sizeList,
        });
      }

      reset({
        sku: material.sku || material.masterSku || "",
        masterSku: material.masterSku || "",
        materialName: material.materialName || "",
        category: material.category || "",
        subCategory: material.subCategory || "No Sub Category",
        manufacturingGroup: material.manufacturingGroup || "",
        unit: material.unit || "Meters",
        colors: Array.isArray(material.colors) ? material.colors : [],
        sizeList: material.sizeList || "",
        attributes: existingAttrs,
        width: typeof material.width === "number" ? material.width : 0,
        widthRangeFrom:
          typeof material.widthRangeFrom === "number"
            ? material.widthRangeFrom
            : 0,
        widthRangeTo:
          typeof material.widthRangeTo === "number"
            ? material.widthRangeTo
            : 0,
        gsm: typeof material.gsm === "number" ? material.gsm : 0,
        gsmRangeFrom:
          typeof material.gsmRangeFrom === "number"
            ? material.gsmRangeFrom
            : 0,
        gsmRangeTo:
          typeof material.gsmRangeTo === "number" ? material.gsmRangeTo : 0,
        gstRate: typeof material.gstRate === "number" ? material.gstRate : 5,
        hsnCode: material.hsnCode || "",
        brand: material.brand || "No Brand",
        forUse: material.forUse || "No For Use",
        less: typeof material.less === "number" ? material.less : 0,
        description: material.description || "",

        // Kardex Details
        costApplyingMode: material.costApplyingMode || "",
        materialCost:
          typeof material.materialCost === "number" ? material.materialCost : 0,
        mrp: String(material.mrp ?? "0"),
        salesRate:
          typeof material.salesRate === "number" ? material.salesRate : 0,
        reorderLevelStock:
          typeof material.reorderLevelStock === "number"
            ? material.reorderLevelStock
            : 0,
        purchaseType: material.purchaseType || "",
        isStockDetailsCompulsory: Boolean(material.isStockDetailsCompulsory),
        issueMode: material.issueMode || "",
        consumptionMode: material.consumptionMode || "",
        isIssuable: Boolean(material.isIssuable),
        isSellable: Boolean(material.isSellable),

        isActive: material.isActive ?? true,
      });
    } else if (mode === "create") {
      reset(materialDefaultValues);
    }
  }, [mode, material, reset]);

  const onSubmit = async (values: MaterialFormValues) => {
    try {
      const attributesPayload: Array<{ id?: string; attributeName: string; attributeValue: string }> = [];

      // Add custom dynamic attributes from values.attributes
      if (Array.isArray(values.attributes)) {
        values.attributes.forEach((attr) => {
          if (attr.attributeName?.trim()) {
            attributesPayload.push({
              id: attr.id,
              attributeName: attr.attributeName.trim(),
              attributeValue: attr.attributeValue?.trim() || "",
            });
          }
        });
      }

      // Add Color attribute if colors selected and not already in attributes
      if (values.colors && values.colors.length > 0) {
        const hasColor = attributesPayload.some(
          (a) => ["color", "colour"].includes(a.attributeName.toLowerCase())
        );
        if (!hasColor) {
          attributesPayload.push({
            attributeName: "Color",
            attributeValue: values.colors.join(", "),
          });
        }
      }

      const sizeAttr = attributesPayload.find((a) =>
        ["size", "dimension"].includes(a.attributeName.toLowerCase())
      );
      const computedSizeList = sizeAttr?.attributeValue || values.sizeList || "";

      if (mode === "create") {
        await createMaterialMutation.mutateAsync({
          materialName: values.materialName.trim(),
          masterSku: values.masterSku.trim(),
          sku: values.sku.trim(),
          category: values.category.trim(),
          subCategory: values.subCategory?.trim() || "No Sub Category",
          manufacturingGroup: values.manufacturingGroup.trim(),
          unit: values.unit.trim(),
          colors: values.colors,
          sizeList: computedSizeList,
          attributes: attributesPayload,
          width: Number(values.width) || 0,
          widthRangeFrom: Number(values.widthRangeFrom) || 0,
          widthRangeTo: Number(values.widthRangeTo) || 0,
          gsm: Number(values.gsm) || 0,
          gsmRangeFrom: Number(values.gsmRangeFrom) || 0,
          gsmRangeTo: Number(values.gsmRangeTo) || 0,
          gstRate: Number(values.gstRate) || 5,
          hsnCode: values.hsnCode.trim(),
          brand: values.brand.trim() || "No Brand",
          forUse: values.forUse?.trim() || "No For Use",
          less: Number(values.less) || 0,
          description: values.description?.trim() || "",

          costApplyingMode: values.costApplyingMode.trim(),
          materialCost: Number(values.materialCost) || 0,
          mrp: String(values.mrp).trim() || "0",
          salesRate: Number(values.salesRate) || 0,
          reorderLevelStock: Number(values.reorderLevelStock) || 0,
          purchaseType: values.purchaseType?.trim() || "",
          isStockDetailsCompulsory: values.isStockDetailsCompulsory,
          issueMode: values.issueMode.trim(),
          consumptionMode: values.consumptionMode.trim(),
          isIssuable: values.isIssuable,
          isSellable: values.isSellable,

          isActive: values.isActive ?? true,
        });
      } else if (mode === "edit" && material) {
        await updateMaterialMutation.mutateAsync({
          id: material.id,
          data: {
            materialName: values.materialName.trim(),
            masterSku: values.masterSku.trim(),
            sku: values.sku.trim(),
            category: values.category.trim(),
            subCategory: values.subCategory?.trim() || "No Sub Category",
            manufacturingGroup: values.manufacturingGroup.trim(),
            unit: values.unit.trim(),
            colors: values.colors,
            sizeList: computedSizeList,
            attributes: attributesPayload,
            width: Number(values.width) || 0,
            widthRangeFrom: Number(values.widthRangeFrom) || 0,
            widthRangeTo: Number(values.widthRangeTo) || 0,
            gsm: Number(values.gsm) || 0,
            gsmRangeFrom: Number(values.gsmRangeFrom) || 0,
            gsmRangeTo: Number(values.gsmRangeTo) || 0,
            gstRate: Number(values.gstRate) || 5,
            hsnCode: values.hsnCode.trim(),
            brand: values.brand.trim() || "No Brand",
            forUse: values.forUse?.trim() || "No For Use",
            less: Number(values.less) || 0,
            description: values.description?.trim() || "",

            costApplyingMode: values.costApplyingMode.trim(),
            materialCost: Number(values.materialCost) || 0,
            mrp: String(values.mrp).trim() || "0",
            salesRate: Number(values.salesRate) || 0,
            reorderLevelStock: Number(values.reorderLevelStock) || 0,
            purchaseType: values.purchaseType?.trim() || "",
            isStockDetailsCompulsory: values.isStockDetailsCompulsory,
            issueMode: values.issueMode.trim(),
            consumptionMode: values.consumptionMode.trim(),
            isIssuable: values.isIssuable,
            isSellable: values.isSellable,

            isActive: values.isActive ?? true,
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["materials"] });
      onSuccess();
    } catch (err: any) {
      console.error("Form submit error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save material. Please check the fields and try again.";
      toast.error(msg);
    }
  };

  const inputClass =
    "w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-[#0A0E1A] placeholder:text-slate-400 outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] dark:focus:ring-[#F5C451]/20 transition-all shadow-xs";

  return (
    <form
      id="material-form"
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-6"
    >
      {/* Top Tab Switcher */}
      <ProductTabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ============================================================ */}
      {/* TAB 1: GENERAL DETAILS                                       */}
      {/* ============================================================ */}
      {activeTab === "general" && (
        <SectionCard
          icon={<Package className="h-5 w-5" />}
          title="General Details"
          description="Specify the primary material identification, classification, and tax details."
        >
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
                      if (mode === "create" && !watch("masterSku")) {
                        setValue("masterSku", val, { shouldValidate: true });
                      }
                    }}
                    placeholder="Enter SKU..."
                    className={cn(inputClass, errors.sku && "border-rose-500")}
                  />
                  {errors.sku && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {errors.sku.message}
                    </p>
                  )}
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
                    placeholder="e.g. FAB-COTTON-01"
                    className={cn(
                      inputClass,
                      errors.masterSku && "border-rose-500"
                    )}
                  />
                  {errors.masterSku && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {errors.masterSku.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="materialName"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...field}
                    placeholder="e.g. 100% Cotton Poplin"
                    className={cn(
                      inputClass,
                      errors.materialName && "border-rose-500"
                    )}
                  />
                  {errors.materialName && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {errors.materialName.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Row 2: Category * | Sub Category | Manufacturing Group * | Unit * */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Category"
                  fieldKey="category"
                  value={field.value}
                  onChange={field.onChange}
                  options={categoryOptions.map((c) => ({
                    label: c,
                    value: c,
                  }))}
                  placeholder="Select Category..."
                  required
                  error={errors.category?.message}
                />
              )}
            />

            <Controller
              name="subCategory"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Sub Category"
                  fieldKey="subCategory"
                  value={field.value || "No Sub Category"}
                  onChange={field.onChange}
                  options={subCategoryOptions.map((s) => ({
                    label: s,
                    value: s,
                  }))}
                  placeholder="Select Sub Category..."
                  error={errors.subCategory?.message}
                />
              )}
            />

            <Controller
              name="manufacturingGroup"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Manufacturing Group"
                  fieldKey="manufacturingGroup"
                  value={field.value}
                  onChange={field.onChange}
                  options={manufacturingGroupOptions.map((m) => ({
                    label: m,
                    value: m,
                  }))}
                  placeholder="Select Manufacturing Group..."
                  required
                  error={errors.manufacturingGroup?.message}
                />
              )}
            />

            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Unit"
                  fieldKey="unit"
                  value={field.value}
                  onChange={field.onChange}
                  options={unitOptions.map((u) => ({
                    label: u,
                    value: u,
                  }))}
                  placeholder="Select Unit..."
                  required
                  error={errors.unit?.message}
                />
              )}
            />
          </div>

          {/* Row 3: Colors | Width & Width Range | GSM & GSM Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Colors Multi-Select */}
            <Controller
              name="colors"
              control={control}
              render={({ field }) => (
                <ColorMultiSelect
                  label="Colors"
                  value={field.value || []}
                  onChange={field.onChange}
                  error={errors.colors?.message}
                />
              )}
            />

            {/* Width & Width Range */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                <span>Width</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Width Range
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="width"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className={cn(inputClass, "text-center font-mono flex-1")}
                    />
                  )}
                />
                <Controller
                  name="widthRangeFrom"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className={cn(inputClass, "text-center font-mono flex-1")}
                    />
                  )}
                />
                <span className="text-slate-400 font-bold">-</span>
                <Controller
                  name="widthRangeTo"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className={cn(inputClass, "text-center font-mono flex-1")}
                    />
                  )}
                />
              </div>
            </div>

            {/* GSM & GSM Range */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                <span>GSM</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  GSM Range
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="gsm"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className={cn(inputClass, "text-center font-mono flex-1")}
                    />
                  )}
                />
                <Controller
                  name="gsmRangeFrom"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className={cn(inputClass, "text-center font-mono flex-1")}
                    />
                  )}
                />
                <span className="text-slate-400 font-bold">-</span>
                <Controller
                  name="gsmRangeTo"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className={cn(inputClass, "text-center font-mono flex-1")}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MATERIAL ATTRIBUTES SECTION (Dynamic according to Category)  */}
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
                      Material Attributes
                    </h4>
                    {watchedCategory && watchedCategory !== "No Category" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-[#F5C451]/10 dark:text-[#F5C451] dark:border-[#F5C451]/20">
                        {watchedCategory}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Attribute options tailored for this category to keep complete material records.
                  </p>
                </div>
              </div>

              {/* Add Attribute Button */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
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

            {/* Added Custom Attributes (Field & Value option with delete button) */}
            {fields.map((fieldItem, index) => {
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
                          className={inputClass}
                        />
                      )}
                    />
                    {errors.attributes?.[index]?.attributeName && (
                      <p className="text-[11px] text-rose-500 font-medium">
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
                          placeholder="Enter value(s), e.g. Cotton, Silk, 128GB..."
                          className={inputClass}
                        />
                      )}
                    />
                    {errors.attributes?.[index]?.attributeValue && (
                      <p className="text-[11px] text-rose-500 font-medium">
                        {errors.attributes[index]?.attributeValue?.message}
                      </p>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div className="flex items-center justify-end sm:justify-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      title="Remove attribute"
                      className="h-11 sm:h-12 w-full sm:w-11 flex items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F1626] text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/60 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick-Add Attribute Options for Category */}
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#0B0F17]/50 border border-slate-200/60 dark:border-white/[0.05]">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#B88728] dark:text-[#F5C451]" />
                Add Category Attributes:
              </span>
              {defaultMaterialAttributes.map((attrName) => {
                const isAdded = fields.some(
                  (f) =>
                    f.attributeName?.trim().toLowerCase() ===
                    attrName.toLowerCase()
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
                    title={
                      isAdded
                        ? `"${attrName}" already added`
                        : `Add "${attrName}"`
                    }
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
          </div>

          {/* Row 4: Less (%). | GST (%) | HSN Code * */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="less"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    Less (%).
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...field}
                    value={field.value ?? 0}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className={cn(inputClass, "font-mono")}
                  />
                  {errors.less && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {errors.less.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="gstRate"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="GST (%)"
                  fieldKey="gstRate"
                  value={String(field.value ?? 5)}
                  onChange={(v) => field.onChange(Number(v))}
                  options={gstRateOptions.map((g) => ({
                    label: g.label,
                    value: String(g.value),
                  }))}
                  placeholder="Select GST..."
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
                    placeholder="e.g. 5208"
                    className={cn(
                      inputClass,
                      errors.hsnCode && "border-rose-500"
                    )}
                  />
                  {errors.hsnCode && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {errors.hsnCode.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Row 5: Brand Name * | For Use */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Brand Name"
                  fieldKey="brand"
                  value={field.value || "No Brand"}
                  onChange={field.onChange}
                  options={brandOptions.map((b) => ({
                    label: b,
                    value: b,
                  }))}
                  placeholder="Select Brand..."
                  required
                  error={errors.brand?.message}
                />
              )}
            />

            <Controller
              name="forUse"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="For Use"
                  fieldKey="forUse"
                  value={field.value || "No For Use"}
                  onChange={field.onChange}
                  options={forUseOptions.map((f) => ({
                    label: f,
                    value: f,
                  }))}
                  placeholder="Select For Use..."
                  error={errors.forUse?.message}
                />
              )}
            />
          </div>

          {/* Row 6: Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                  Description
                </label>
                <textarea
                  {...field}
                  rows={4}
                  placeholder="Describe material key points..."
                  className="w-full p-3.5 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-[#0A0E1A] placeholder:text-slate-400 outline-none hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 dark:border-white/[0.08] dark:bg-[#0B0F17] dark:text-white dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451] dark:focus:ring-[#F5C451]/20 transition-all resize-y shadow-xs"
                />
              </div>
            )}
          />
        </SectionCard>
      )}

      {/* ============================================================ */}
      {/* TAB 2: KARDEX DETAILS                                        */}
      {/* ============================================================ */}
      {activeTab === "kardex" && (
        <SectionCard
          icon={<SlidersHorizontal className="h-5 w-5" />}
          title="Kardex Details"
          description="Configure cost applying modes, valuation, stock thresholds, and issue/consumption modes."
        >
          {/* Row 1: Cost Applying Mode * | Material Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Controller
              name="costApplyingMode"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Cost Applying Mode"
                  fieldKey="costApplyingMode"
                  value={field.value}
                  onChange={field.onChange}
                  options={costApplyingModeOptions.map((c) => ({
                    label: c,
                    value: c,
                  }))}
                  placeholder="Select Cost Applying Mode..."
                  required
                  error={errors.costApplyingMode?.message}
                />
              )}
            />

            <Controller
              name="materialCost"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    Material Cost
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className={cn(inputClass, "pl-8 font-mono")}
                    />
                  </div>
                </div>
              )}
            />
          </div>

          {/* Row 2: MRP | Sales Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Controller
              name="mrp"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    MRP
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={cn(inputClass, "pl-8 font-mono")}
                    />
                  </div>
                </div>
              )}
            />

            <Controller
              name="salesRate"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                    Sales Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className={cn(inputClass, "pl-8 font-mono")}
                    />
                  </div>
                </div>
              )}
            />
          </div>

          {/* Row 3: Re-Order Level Stock | Purchase Type & Details Compulsory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                    step="any"
                    {...field}
                    value={field.value ?? 0}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                    className={cn(inputClass, "font-mono")}
                  />
                </div>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <Controller
                name="purchaseType"
                control={control}
                render={({ field }) => (
                  <DropdownWithOther
                    label="Purchase Type"
                    fieldKey="purchaseType"
                    value={field.value || ""}
                    onChange={field.onChange}
                    options={purchaseTypeOptions.map((p) => ({
                      label: p,
                      value: p,
                    }))}
                    placeholder="Select..."
                  />
                )}
              />

              {/* Details Compulsory Card with Toggle */}
              <div className="h-11 sm:h-12 px-3.5 flex items-center justify-between rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-white/[0.08] dark:bg-[#0B0F17] shadow-xs">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    Details Compulsory
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Stock details compulsory
                  </p>
                </div>
                <Controller
                  name="isStockDetailsCompulsory"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Issue Mode * | Consumption Mode * | Is Issuable? | Is Sellable? */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <Controller
              name="issueMode"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Issue Mode"
                  fieldKey="issueMode"
                  value={field.value}
                  onChange={field.onChange}
                  options={issueModeOptions.map((i) => ({
                    label: i,
                    value: i,
                  }))}
                  placeholder="Select..."
                  required
                  error={errors.issueMode?.message}
                />
              )}
            />

            <Controller
              name="consumptionMode"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Consumption Mode"
                  fieldKey="consumptionMode"
                  value={field.value}
                  onChange={field.onChange}
                  options={consumptionModeOptions.map((c) => ({
                    label: c,
                    value: c,
                  }))}
                  placeholder="Select..."
                  required
                  error={errors.consumptionMode?.message}
                />
              )}
            />

            <div className="h-11 sm:h-12 px-3.5 flex items-center justify-between rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-white/[0.08] dark:bg-[#0B0F17] shadow-xs">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Is Issuable?
              </span>
              <Controller
                name="isIssuable"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="h-11 sm:h-12 px-3.5 flex items-center justify-between rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-white/[0.08] dark:bg-[#0B0F17] shadow-xs">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Is Sellable?
              </span>
              <Controller
                name="isSellable"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        </SectionCard>
      )}
    </form>
  );
}
