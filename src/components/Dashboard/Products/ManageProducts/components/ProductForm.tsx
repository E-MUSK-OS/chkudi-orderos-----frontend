"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import Input from "@/components/ui/Input";
import ReactSelect, { type SelectOption } from "@/components/ui/ReactSelect";

import { Package, Receipt } from "lucide-react";

import SectionCard from "./SectionCard";

import type { Product } from "../types/product.types";

import {
  productSchema,
  type ProductFormValues,
} from "../validations/product.validation";
import { Switch } from "@/components/ui/switch";
import { useCreateProduct, useUpdateProduct } from "../hooks/useProducts";
import ProductAttributes from "./ProductAttributes";

interface Props {
  mode: "create" | "edit";
  product?: Product;
  onSuccess: () => void;
  onLoadingChange?: (loading: boolean) => void;
}

const gstOptions: SelectOption[] = [
  { label: "0%", value: "0" },
  { label: "5%", value: "5" },
  { label: "18%", value: "18" },
  { label: "40%", value: "40" },
];

const generateBarcodeOptions: SelectOption[] = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

const defaultValues: ProductFormValues = {
  productName: "",
  masterSku: "",
  brand: "",
  category: "",
  subCategory: "",
  description: "",
  asin: "",
  rackAddress: "",
  generateBarcode: "No",
  mrp: undefined as unknown as number,
  hsnCode: "",
  gstRate: undefined as unknown as number,
  isActive: true,
  attributes: [],
};

export default function ProductForm({
  mode,
  product,
  onSuccess,
  onLoadingChange,
}: Props) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as never,
    defaultValues,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  const createProductMutation = useCreateProduct();

  const updateProductMutation = useUpdateProduct();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes",
  });

  useEffect(() => {
    if (mode === "edit" && product) {
      reset({
        productName: product.productName,
        masterSku: product.masterSku,
        brand: product.brand,
        category: product.category,
        subCategory: product.subCategory,
        description: product.description ?? "",
        asin: product.asin ?? "",
        rackAddress: product.rackAddress ?? "",
        generateBarcode: product.generateBarcode ?? "No",
        mrp: (product.mrp ?? undefined) as unknown as number,
        hsnCode: product.hsnCode ?? "",
        gstRate: (product.gstRate ?? undefined) as unknown as number,
        isActive: product.isActive,

        attributes:
          product.attributes?.map((attribute) => ({
            id: attribute.id,
            attributeName: attribute.attributeName,
          })) ?? [],
      });
    } else {
      reset(defaultValues);
    }
  }, [mode, product, reset]);

  const onSubmit = async (values: ProductFormValues) => {
    console.log("FORM VALUES");
    console.log(values);
    try {
      if (mode === "create") {
        await createProductMutation.mutateAsync(values);
      } else if (product) {
        await updateProductMutation.mutateAsync({
          id: product.id,
          data: values,
        });
      }

      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    onLoadingChange?.(
      createProductMutation.isPending || updateProductMutation.isPending,
    );
  }, [
    createProductMutation.isPending,
    updateProductMutation.isPending,
    onLoadingChange,
  ]);

  return (
    <form
      id="product-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 p-6"
    >
      {/* ================= Product Information ================= */}

      <SectionCard
        icon={<Package size={20} />}
        title="Product Information"
        description="Basic product information and identification."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            name="productName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Product Name"
                error={errors.productName?.message}
              />
            )}
          />

          <Controller
            name="masterSku"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Master SKU"
                error={errors.masterSku?.message}
              />
            )}
          />


          <Controller
            name="mrp"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                step="0.01"
                min="0"
                onKeyDown={(e) => {
                  if (["-", "+", "e", "E", "/", "*", ","].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  const pasteText = e.clipboardData.getData("text");
                  if (/[/\-*+eE,]/.test(pasteText)) {
                    e.preventDefault();
                  }
                }}
                value={field.value ?? ""}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^0-9.]/g, "");
                  field.onChange(
                    sanitized === "" ? undefined : parseFloat(sanitized),
                  );
                }}
                label="MRP (₹)"
                error={errors.mrp?.message}
              />
            )}
          />

          <div className="space-y-2">
            <Controller
              name="generateBarcode"
              control={control}
              render={({ field }) => {
                const hasValue =
                  field.value !== undefined &&
                  field.value !== null &&
                  field.value !== "";
                return (
                  <div className="relative group">
                    <ReactSelect
                      height={56}
                      borderColor="#e2e8f0"
                      placeholder={hasValue ? "Select Yes / No" : " "}
                      options={generateBarcodeOptions}
                      value={
                        generateBarcodeOptions.find(
                          (option) =>
                            option.value.toLowerCase() ===
                            (field.value || "No").toLowerCase(),
                        ) ?? generateBarcodeOptions[1]
                      }
                      onChange={(option) => {
                        field.onChange(option ? option.value : "No");
                      }}
                    />
                    <label
                      className={cn(
                        "pointer-events-none absolute left-4 bg-white px-1 transition-all duration-200 z-10",
                        hasValue
                          ? "-top-2 text-[11px] text-slate-500 font-medium"
                          : "top-1/2 -translate-y-1/2 text-[15px] text-slate-400",
                      )}
                    >
                      Generate Barcode
                    </label>
                  </div>
                );
              }}
            />
            {errors.generateBarcode && (
              <p className="mt-1 text-sm text-red-500">
                {errors.generateBarcode.message}
              </p>
            )}
          </div>
        </div>

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              label="Description"
              error={errors.description?.message}
            />
          )}
        />
      </SectionCard>
      {/* ================= Classification ================= */}

      <SectionCard
        icon={<Package size={20} />}
        title="Classification"
        description="Assign brand and category information."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Brand */}

          <Controller
            name="brand"
            control={control}
            render={({ field }) => (
              <Input {...field} label="Brand" error={errors.brand?.message} />
            )}
          />

          {/* Category */}

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Category"
                error={errors.category?.message}
              />
            )}
          />

          {/* Sub Category */}

          <Controller
            name="subCategory"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Sub Category"
                error={errors.subCategory?.message}
              />
            )}
          />
        </div>
      </SectionCard>

      <ProductAttributes
        control={control}
        errors={errors}
        fields={fields}
        append={append}
        remove={remove}
      />

      {/* ================= Product Tax Info ================= */}

      <SectionCard
        icon={<Receipt size={20} />}
        title="Product Tax Info"
        description="Tax details including HSN Code and GST percentage."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            name="hsnCode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                label="HSN Code"
                error={errors.hsnCode?.message}
              />
            )}
          />

          <div className="space-y-2">
            <Controller
              name="gstRate"
              control={control}
              render={({ field }) => {
                const hasValue = field.value !== undefined && field.value !== null;
                return (
                  <div className="relative group">
                    <ReactSelect
                      height={56}
                      borderColor="#e2e8f0"
                      placeholder={hasValue ? "Select GST %" : " "}
                      options={gstOptions}
                      value={
                        gstOptions.find(
                          (option) => Number(option.value) === field.value,
                        ) ?? null
                      }
                      onChange={(option) => {
                        field.onChange(
                          option ? Number(option.value) : undefined,
                        );
                      }}
                    />
                    <label
                      className={cn(
                        "pointer-events-none absolute left-4 bg-white px-1 transition-all duration-200 z-10",
                        hasValue
                          ? "-top-2 text-[11px] text-slate-500 font-medium"
                          : "top-1/2 -translate-y-1/2 text-[15px] text-slate-400"
                      )}
                    >
                      GST %
                    </label>
                  </div>
                );
              }}
            />
            {errors.gstRate && (
              <p className="mt-1 text-sm text-red-500">
                {errors.gstRate.message}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ================= Product Status ================= */}

      <SectionCard
        icon={<Package size={20} />}
        title="Product Status"
        description="Control whether this product is active."
      >
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="flex h-14 items-center justify-between rounded-md border border-slate-200 px-4">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Active Product
                </p>

                <p className="text-xs text-slate-500">
                  Enable or disable this product.
                </p>
              </div>

              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </SectionCard>
    </form>
  );
}
