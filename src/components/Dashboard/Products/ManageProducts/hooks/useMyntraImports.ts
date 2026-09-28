import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMyntraImports,
  uploadMyntraImportExcel,
  deleteMyntraImport,
  clearAllMyntraImports,
  createMyntraImport,
  updateMyntraImport,
} from "../services/myntraImport.service";

const QUERY_KEY = ["myntra-imports"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get Myntra Imports with search
 */
export function useMyntraImports(search?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, search || ""],
    queryFn: () => getMyntraImports({ search }, getToken()),
  });
}

/**
 * Import Myntra from Excel
 */
export function useImportMyntraExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadMyntraImportExcel(file, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Myntra Excel mapping imported successfully!");
    },

    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to import Myntra Excel file"
      );
    },
  });
}

/**
 * Delete single Myntra Import Item
 */
export function useDeleteMyntraImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMyntraImport(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Myntra mapping deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to delete Myntra mapping"
      );
    },
  });
}

/**
 * Clear All Myntra Imports
 */
export function useClearMyntraImports() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearAllMyntraImports(getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "All Myntra mappings cleared successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to clear Myntra mappings"
      );
    },
  });
}

/**
 * Create single Myntra Import Item
 */
export function useCreateMyntraImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      myntraSku: string;
      sellerSku?: string;
      asin?: string;
      generatedBarcode?: string;
      rackAddress?: string;
    }) => createMyntraImport(data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Myntra record created successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to create Myntra record"
      );
    },
  });
}

/**
 * Update single Myntra Import Item
 */
export function useUpdateMyntraImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        myntraSku?: string;
        sellerSku?: string;
        asin?: string;
        generatedBarcode?: string;
        rackAddress?: string;
      };
    }) => updateMyntraImport(id, data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(response?.message || "Myntra record updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.message ||
          error?.response?.data?.message ||
          "Failed to update Myntra record"
      );
    },
  });
}

