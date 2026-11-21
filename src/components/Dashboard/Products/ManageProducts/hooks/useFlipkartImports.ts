import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { flipkartImportService } from "../services/flipkartImport.service";

const QUERY_KEY = ["flipkart-imports"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get All Flipkart Imports
 */
export function useFlipkartImports(search?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, search || ""],
    queryFn: () => flipkartImportService.getAll(search, getToken()),
  });
}

/**
 * Import Flipkart From Excel
 */
export function useImportFlipkartExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => flipkartImportService.importExcel(file, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Flipkart Excel file imported successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message ||
        error?.response?.data?.message ||
        "Failed to import Flipkart Excel file"
      );
    },
  });
}

/**
 * Create Flipkart Import Item
 */
export function useCreateFlipkartImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { fsn: string; sku?: string; rackAddress?: string }) =>
      flipkartImportService.create(data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Flipkart record created successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to create Flipkart record"
      );
    },
  });
}

/**
 * Delete Flipkart Import Item
 */
export function useDeleteFlipkartImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => flipkartImportService.delete(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Flipkart record deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to delete Flipkart record"
      );
    },
  });
}

/**
 * Update Flipkart Import Item
 */
export function useUpdateFlipkartImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { fsn?: string; sku?: string; rackAddress?: string };
    }) => flipkartImportService.update(id, data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Flipkart record updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to update Flipkart record"
      );
    },
  });
}

/**
 * Clear All Flipkart Imports
 */
export function useClearFlipkartImports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => flipkartImportService.clearAll(getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "All Flipkart records cleared successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message || error?.response?.data?.message || "Failed to clear Flipkart records"
      );
    },
  });
}
