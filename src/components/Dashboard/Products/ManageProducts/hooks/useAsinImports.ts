import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { asinImportService } from "../services/asinImport.service";

const QUERY_KEY = ["asin-imports"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get All ASIN Imports
 */
export function useAsinImports(search?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, search || ""],
    queryFn: () => asinImportService.getAll(search, getToken()),
  });
}

/**
 * Import ASIN From Excel
 */
export function useImportAsinExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => asinImportService.importExcel(file, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "ASIN Excel file imported successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to import ASIN Excel file",
      );
    },
  });
}

/**
 * Delete ASIN Import Item
 */
export function useDeleteAsinImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => asinImportService.delete(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "ASIN record deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to delete ASIN record",
      );
    },
  });
}

/**
 * Update ASIN Import Item
 */
export function useUpdateAsinImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { asin?: string; sku?: string; generateBarcode?: string; rackAddress?: string };
    }) => asinImportService.update(id, data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "ASIN record updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to update ASIN record",
      );
    },
  });
}

/**
 * Clear All ASIN Imports
 */
export function useClearAsinImports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => asinImportService.clearAll(getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "All ASIN records cleared successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to clear ASIN records",
      );
    },
  });
}

