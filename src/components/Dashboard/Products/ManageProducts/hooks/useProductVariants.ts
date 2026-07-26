"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { productVariantService } from "../services/productVariant.service";

import type {
  CreateProductVariantPayload,
  UpdateProductVariantPayload,
} from "../types/productVariant.types";

const QUERY_KEY = ["product-variants"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get All Product Variants
 */
export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, productId],

    queryFn: () =>
      productVariantService.getByProductId(
        productId,
        getToken(),
      ),

    enabled: !!productId,
  });
}

/**
 * Get Product Variant By Id
 */
export function useProductVariant(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],

    queryFn: () =>
      productVariantService.getById(id, getToken()),

    enabled: !!id,
  });
}

/**
 * Create Product Variant
 */
export function useCreateProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: CreateProductVariantPayload,
    ) =>
      productVariantService.create(
        data,
        getToken(),
      ),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, variables.productId],
      });

      toast.success(
        response?.message ??
          "Product variant created successfully",
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          "Failed to create product variant",
      );
    },
  });
}

/**
 * Update Product Variant
 */
export function useUpdateProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductVariantPayload;
    }) =>
      productVariantService.update(
        id,
        data,
        getToken(),
      ),

    onSuccess: (response, variables) => {
      if (variables.data.productId) {
        queryClient.invalidateQueries({
          queryKey: [
            ...QUERY_KEY,
            variables.data.productId,
          ],
        });
      }

      toast.success(
        response?.message ??
          "Product variant updated successfully",
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          "Failed to update product variant",
      );
    },
  });
}

/**
 * Delete Product Variant
 */
export function useDeleteProductVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      productId,
    }: {
      id: string;
      productId: string;
    }) =>
      productVariantService.delete(
        id,
        getToken(),
      ),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...QUERY_KEY,
          variables.productId,
        ],
      });

      toast.success(
        response?.message ??
          "Product variant deleted successfully",
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          "Failed to delete product variant",
      );
    },
  });
}

/**
 * Update Product Variant Status
 */
export function useUpdateProductVariantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      productId,
      isActive,
    }: {
      id: string;
      productId: string;
      isActive: boolean;
    }) =>
      productVariantService.updateStatus(
        id,
        { isActive },
        getToken(),
      ),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          ...QUERY_KEY,
          variables.productId,
        ],
      });

      toast.success(
        response?.message ??
          "Product variant status updated successfully",
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          "Failed to update product variant status",
      );
    },
  });
}