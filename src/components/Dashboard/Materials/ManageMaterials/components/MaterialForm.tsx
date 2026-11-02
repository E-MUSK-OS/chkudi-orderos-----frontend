"use client";

import { useEffect, useState, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Package, SlidersHorizontal, Layers, CheckCircle2 } from "lucide-react";
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
  manufacturingGroupOptions,
  unitOptions,
  gstRateOptions,
  brandOptions,
  costApplyingModeOptions,
  purchaseTypeOptions,
  issueModeOptions,
  consumptionModeOptions,
} from "../constants/material.constants";
import { useCreateMaterial, useUpdateMaterial } from "../hooks/useMaterials";
import { useDropdownOptions } from "../hooks/useDropdownOptions";
import { buildMergedOptions } from "@/utils/dropdownOptions.utils";

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

  // Fetch dynamic dropdown options from DB (synced with Setting Masters)
  const { data: dropdownResponse } = useDropdownOptions();
  const dropdownData = dropdownResponse?.data;

  const dynamicCategoryOptions = useMemo(() => {
    return buildMergedOptions(
      "category",
      categoryOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.categories
    );
  }, [dropdownData]);

  const dynamicManufacturingGroupOptions = useMemo(() => {
    return buildMergedOptions(
      "manufacturinggroup",
      manufacturingGroupOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.manufacturingGroups
    );
  }, [dropdownData]);

  const dynamicUnitOptions = useMemo(() => {
    return buildMergedOptions(
      "unit",
      unitOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.units
    );
  }, [dropdownData]);

  const dynamicBrandOptions = useMemo(() => {
    return buildMergedOptions(
      "brand",
      brandOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.brands
    );
  }, [dropdownData]);

  const dynamicCostApplyingModeOptions = useMemo(() => {
    return buildMergedOptions(
      "costapplyingmode",
      costApplyingModeOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.costApplyingModes
    );
  }, [dropdownData]);

  const dynamicPurchaseTypeOptions = useMemo(() => {
    return buildMergedOptions(
      "purchasetype",
      purchaseTypeOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.purchaseTypes
    );
  }, [dropdownData]);

  const dynamicIssueModeOptions = useMemo(() => {
    return buildMergedOptions(
      "issuemode",
      issueModeOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.issueModes
    );
  }, [dropdownData]);

  const dynamicConsumptionModeOptions = useMemo(() => {
    return buildMergedOptions(
      "consumptionmode",
      consumptionModeOptions,
      dropdownData?.savedOptions,
      dropdownData?.distinctFromProducts?.consumptionModes
    );
  }, [dropdownData]);

  const dynamicGstRateOptions = useMemo(() => {
    return buildMergedOptions(
      ["gstrate", "gst"],
      gstRateOptions.map((g) => ({ label: g.label, value: String(g.value) })),
      dropdownData?.savedOptions,
      (dropdownData?.distinctFromProducts as any)?.gstRates
    );
  }, [dropdownData]);

  // Pre-fill form when editing
  useEffect(() => {
    if (mode === "edit" && material) {
      reset({
        sku: material.sku || material.masterSku || "",
        masterSku: material.masterSku || "",
        materialName: material.materialName || "",
        category: material.category || "",
        manufacturingGroup: material.manufacturingGroup || "",
        unit: material.unit || "Meters",
        colors: Array.isArray(material.colors) ? material.colors : [],
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
      if (mode === "create") {
        await createMaterialMutation.mutateAsync({
          materialName: values.materialName.trim(),
          masterSku: values.masterSku.trim(),
          sku: values.sku.trim(),
          category: values.category.trim(),
          manufacturingGroup: values.manufacturingGroup.trim(),
          unit: values.unit.trim(),
          colors: values.colors,
          width: Number(values.width) || 0,
          widthRangeFrom: Number(values.widthRangeFrom) || 0,
          widthRangeTo: Number(values.widthRangeTo) || 0,
          gsm: Number(values.gsm) || 0,
          gsmRangeFrom: Number(values.gsmRangeFrom) || 0,
          gsmRangeTo: Number(values.gsmRangeTo) || 0,
          gstRate: Number(values.gstRate) || 5,
          hsnCode: values.hsnCode.trim(),
          brand: values.brand.trim() || "No Brand",
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
            manufacturingGroup: values.manufacturingGroup.trim(),
            unit: values.unit.trim(),
            colors: values.colors,
            width: Number(values.width) || 0,
            widthRangeFrom: Number(values.widthRangeFrom) || 0,
            widthRangeTo: Number(values.widthRangeTo) || 0,
            gsm: Number(values.gsm) || 0,
            gsmRangeFrom: Number(values.gsmRangeFrom) || 0,
            gsmRangeTo: Number(values.gsmRangeTo) || 0,
            gstRate: Number(values.gstRate) || 5,
            hsnCode: values.hsnCode.trim(),
            brand: values.brand.trim() || "No Brand",
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

          {/* Row 2: Category * | Manufacturing Group * | Unit * */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <DropdownWithOther
                  label="Category"
                  fieldKey="category"
                  value={field.value}
                  onChange={field.onChange}
                  options={dynamicCategoryOptions}
                  placeholder="Select Category..."
                  required
                  error={errors.category?.message}
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
                  options={dynamicManufacturingGroupOptions}
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
                  options={dynamicUnitOptions}
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
                  options={dynamicGstRateOptions}
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

          {/* Row 5: Brand Name * */}
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
                  options={dynamicBrandOptions}
                  placeholder="Select Brand..."
                  required
                  error={errors.brand?.message}
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
                  options={dynamicCostApplyingModeOptions}
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
                    options={dynamicPurchaseTypeOptions}
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
                  options={dynamicIssueModeOptions}
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
                  options={dynamicConsumptionModeOptions}
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
