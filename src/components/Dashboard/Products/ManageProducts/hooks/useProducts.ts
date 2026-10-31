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
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Product created successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to create product",
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

    onSuccess: (response, variables) => {
      // 1. Immediately update cache for the product list so the table updates INSTANTLY
      queryClient.setQueryData(QUERY_KEY, (oldData: any) => {
        if (!oldData) return oldData;
        const mergedProduct = {
          ...(response?.data || {}),
          ...variables.data,
          id: variables.id,
        };
        if (Array.isArray(oldData)) {
          return oldData.map((p: any) => (p.id === variables.id ? { ...p, ...mergedProduct } : p));
        }
        if (Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.map((p: any) =>
              p.id === variables.id ? { ...p, ...mergedProduct } : p
            ),
          };
        }
        return oldData;
      });

      // 2. Immediately update cache for the single product
      queryClient.setQueryData([...QUERY_KEY, variables.id], (oldSingle: any) => {
        const mergedProduct = {
          ...(response?.data || {}),
          ...variables.data,
          id: variables.id,
        };
        if (!oldSingle) return { success: true, data: mergedProduct };
        return {
          ...oldSingle,
          data: { ...(oldSingle.data || {}), ...mergedProduct },
        };
      });
      // 3. Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["product-variants", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Product updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to update product",
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
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Product deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to delete product",
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
        error?.message ||
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

/**
 * Import Products From Excel
 */
export function useImportProductsExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => productService.importExcel(file, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      const resData = (response as any)?.data || response;
      const notFoundCount =
        resData?.notFoundCount ?? (Array.isArray(resData?.errors) ? resData.errors.length : 0);
      const updatedCount = resData?.updatedCount ?? resData?.importedCount ?? 0;
      const msg = (response as any)?.message || resData?.message;

      if (updatedCount > 0 && notFoundCount > 0) {
        toast.warning(msg || `Updated ${updatedCount} variant(s). ${notFoundCount} variant(s) were not found in database.`, {
          duration: 8000,
        });
      } else if (updatedCount > 0) {
        toast.success(msg || `Successfully updated ${updatedCount} variant(s)!`);
      } else if (notFoundCount > 0) {
        toast.error(msg || `0 variants updated. ${notFoundCount} variant(s) were not found in the database.`, {
          duration: 8000,
        });
      } else {
        toast.info(msg || "No records to update.");
      }
    },

    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to import Excel file"
      );
    },
  });
}