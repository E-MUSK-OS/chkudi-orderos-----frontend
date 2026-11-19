import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { flipcartImportService } from "../services/flipcartImport.service";

const QUERY_KEY = ["flipcart-imports"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get All Flipcart Imports
 */
export function useFlipcartImports(search?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, search || ""],
    queryFn: () => flipcartImportService.getAll(search, getToken()),
  });
}

/**
 * Import Flipcart From Excel
 */
export function useImportFlipcartExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => flipcartImportService.importExcel(file, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Flipcart Excel file imported successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to import Flipcart Excel file"
      );
    },
  });
}

/**
 * Create Flipcart Import Item
 */
export function useCreateFlipcartImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { fsn: string; sku?: string; rackAddress?: string }) =>
      flipcartImportService.create(data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Flipcart record created successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to create Flipcart record"
      );
    },
  });
}

/**
 * Delete Flipcart Import Item
 */
export function useDeleteFlipcartImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => flipcartImportService.delete(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Flipcart record deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to delete Flipcart record"
      );
    },
  });
}

/**
 * Update Flipcart Import Item
 */
export function useUpdateFlipcartImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { fsn?: string; sku?: string; rackAddress?: string };
    }) => flipcartImportService.update(id, data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Flipcart record updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to update Flipcart record"
      );
    },
  });
}

/**
 * Clear All Flipcart Imports
 */
export function useClearFlipcartImports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => flipcartImportService.clearAll(getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "All Flipcart records cleared successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to clear Flipcart records"
      );
    },
  });
}
