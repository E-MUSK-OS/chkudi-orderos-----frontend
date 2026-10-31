import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { materialService } from "../services/material.service";

import type {
  CreateMaterialPayload,
  UpdateMaterialPayload,
  UpdateMaterialStatusPayload,
} from "../types/material.types";

const QUERY_KEY = ["materials"];

const STATS_QUERY_KEY = ["material-stats"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get All Materials
 */
export function useMaterials() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => materialService.getAll(getToken()),
  });
}

/**
 * Get Material By Id
 */
export function useMaterial(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => materialService.getById(id, getToken()),
    enabled: !!id,
  });
}

/**
 * Create Material
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaterialPayload) =>
      materialService.create(data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["material-variants"] });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Material created successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to create material",
      );
    },
  });
}

/**
 * Update Material
 */
export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaterialPayload;
    }) => materialService.update(id, data, getToken()),

    onSuccess: (response, variables) => {
      queryClient.setQueryData(QUERY_KEY, (oldData: any) => {
        if (!oldData) return oldData;
        const mergedMaterial = {
          ...(response?.data || {}),
          ...variables.data,
          id: variables.id,
        };
        if (Array.isArray(oldData)) {
          return oldData.map((m: any) => (m.id === variables.id ? { ...m, ...mergedMaterial } : m));
        }
        if (Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.map((m: any) =>
              m.id === variables.id ? { ...m, ...mergedMaterial } : m
            ),
          };
        }
        return oldData;
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["material-variants"] });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Material updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to update material",
      );
    },
  });
}

/**
 * Delete Material
 */
export function useDeleteMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => materialService.delete(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["material-variants"] });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Material deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to delete material",
      );
    },
  });
}

/**
 * Update Material Status
 */
export function useUpdateMaterialStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaterialStatusPayload;
    }) => materialService.updateStatus(id, data, getToken()),

    onSuccess: (response, variables) => {
      queryClient.setQueryData(QUERY_KEY, (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.map((m: any) =>
            m.id === variables.id ? { ...m, isActive: variables.data.isActive } : m
          );
        }
        if (Array.isArray(oldData.data)) {
          return {
            ...oldData,
            data: oldData.data.map((m: any) =>
              m.id === variables.id ? { ...m, isActive: variables.data.isActive } : m
            ),
          };
        }
        return oldData;
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["material-variants"] });

      toast.success(response?.message || "Material status updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update material status",
      );
    },
  });
}

/**
 * Get Material Stats
 */
export function useMaterialStats() {
  return useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: () => materialService.getStats(getToken()),
  });
}

/**
 * Import Materials From Excel
 */
export function useImportMaterialsExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => materialService.importExcel(file, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STATS_QUERY_KEY });
      toast.success(response?.message || "Materials imported successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to import materials",
      );
    },
  });
}

