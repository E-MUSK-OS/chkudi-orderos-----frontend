import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { productService } from "../services/product.service";

import type {
  CreateProductPayload,
  UpdateProductPayload,
  UpdateProductStatusPayload,
} from "../types/product.types";

const QUERY_KEY = ["products"];

const STATS_QUERY_KEY = ["product-stats"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get All Products
 */
export function useProducts() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => productService.getAll(getToken()),
  });
}

/**
 * Get Product By Id
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => productService.getById(id, getToken()),
    enabled: !!id,
  });
}

/**
 * Create Product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductPayload) =>
      productService.create(data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });

      toast.success(response?.message || "Product created successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create product",
      );
    },
  });
}

/**
 * Update Product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductPayload;
    }) => productService.update(id, data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });

      toast.success(response?.message || "Product updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update product",
      );
    },
  });
}

/**
 * Delete Product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      productService.delete(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });

      toast.success(response?.message || "Product deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete product",
      );
    },
  });
}

/**
 * Update Product Status
 */
export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductStatusPayload;
    }) => productService.updateStatus(id, data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });

      toast.success(
        response?.message || "Product status updated successfully",
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update product status",
      );
    },
  });
}

/**
 * Product Stats
 */
export function useProductStats() {
  return useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: () => productService.getStats(getToken()),
  });
}