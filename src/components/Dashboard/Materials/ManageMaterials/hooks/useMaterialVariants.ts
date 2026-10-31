import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { materialVariantService } from "../services/materialVariant.service";

import type {
  CreateMaterialVariantPayload,
  UpdateMaterialVariantPayload,
} from "../types/materialVariant.types";

const QUERY_KEY = ["material-variants"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get All Material Variants By Material Id
 */
export function useMaterialVariants(materialId?: string) {
  return useQuery({
    queryKey: materialId ? [...QUERY_KEY, "material", materialId] : QUERY_KEY,
    queryFn: () =>
      materialId
        ? materialVariantService.getByMaterialId(materialId, getToken())
        : materialVariantService.getAll(getToken()),
    enabled: materialId !== undefined ? !!materialId : true,
  });
}

/**
 * Get Material Variant By Id
 */
export function useMaterialVariant(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => materialVariantService.getById(id, getToken()),
    enabled: !!id,
  });
}

/**
 * Create Material Variant
 */
export function useCreateMaterialVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaterialVariantPayload) =>
      materialVariantService.create(data, getToken()),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, "material", variables.materialId],
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Material variant created successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create material variant",
      );
    },
  });
}

/**
 * Update Material Variant
 */
export function useUpdateMaterialVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaterialVariantPayload;
    }) => materialVariantService.update(id, data, getToken()),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Material variant updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update material variant",
      );
    },
  });
}

/**
 * Delete Material Variant
 */
export function useDeleteMaterialVariant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      materialVariantService.delete(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["asin-imports"] });

      toast.success(response?.message || "Material variant deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete material variant",
      );
    },
  });
}

/**
 * Update Material Variant Status
 */
export function useUpdateMaterialVariantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => materialVariantService.updateStatus(id, isActive, getToken()),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });

      toast.success(
        response?.message || "Material variant status updated successfully",
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update material variant status",
      );
    },
  });
}

