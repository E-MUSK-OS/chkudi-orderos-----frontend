"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Input from "@/components/ui/Input";
import ReactSelect from "@/components/ui/ReactSelect";

import { Package } from "lucide-react";

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

const defaultValues: ProductFormValues = {
  productName: "",
  masterSku: "",
  brand: "",
  category: "",
  subCategory: "",
  description: "",
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

          <div>
            <label className="mb-2 block text-sm font-medium">Brand *</label>

            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <Input {...field} label="Brand" error={errors.brand?.message} />
              )}
            />

            {errors.brand && (
              <p className="mt-1 text-sm text-red-500">
                {errors.brand.message}
              </p>
            )}
          </div>

          {/* Category */}

          <div>
            <label className="mb-2 block text-sm font-medium">Category *</label>

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

            {errors.category && (
              <p className="mt-1 text-sm text-red-500">
                {errors.category.message}
              </p>
            )}
          </div>

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
