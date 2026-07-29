"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { skuMappingService } from "../services/skuMapping.service";

import type { UpdateSkuMappingPayload } from "../types/skuMapping.types";
import { getToken } from "@/utils/auth";

// ==================================================================================
// ============================== QUERY KEYS =========================================
// ==================================================================================

export const skuMappingKeys = {
  all: ["sku-mappings"] as const,

  list: (params?: Record<string, unknown>) =>
    [...skuMappingKeys.all, "list", params] as const,

  detail: (id: string) => [...skuMappingKeys.all, "detail", id] as const,

  search: (shortSku: string) =>
    [...skuMappingKeys.all, "search", shortSku] as const,
};

// ==================================================================================
// ============================== GET ALL ============================================
// ==================================================================================

export const useSkuMappings = (
  params?: Record<string, string | number | undefined>,
  token?: string,
) => {
  return useQuery({
    queryKey: skuMappingKeys.list(params),

    queryFn: () => skuMappingService.getAll(params, getToken()),
  });
};

// ==================================================================================
// ============================== GET BY ID ==========================================
// ==================================================================================

export const useSkuMapping = (id: string, token?: string) => {
  return useQuery({
    queryKey: skuMappingKeys.detail(id),

    queryFn: () => skuMappingService.getById(id, getToken()),

    enabled: !!id,
  });
};

// ==================================================================================
// ============================== SEARCH =============================================
// ==================================================================================

export const useSearchShortSku = (shortSku: string, token?: string) => {
  return useQuery({
    queryKey: skuMappingKeys.search(shortSku),

    queryFn: () => skuMappingService.search(shortSku, getToken()),

    enabled: !!shortSku,
  });
};

// ==================================================================================
// ============================== IMPORT =============================================
// ==================================================================================

export const useImportSkuMappings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file }: { file: File }) =>
      skuMappingService.import(file, getToken()),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: skuMappingKeys.all,
      });
    },
  });
};

// ==================================================================================
// ============================== UPDATE =============================================
// ==================================================================================

export const useUpdateSkuMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSkuMappingPayload }) =>
      skuMappingService.update(id, data, getToken()),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: skuMappingKeys.all,
      });

      queryClient.invalidateQueries({
        queryKey: skuMappingKeys.detail(variables.id),
      });
    },
  });
};

// ==================================================================================
// ============================== DELETE =============================================
// ==================================================================================

export const useDeleteSkuMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      skuMappingService.delete(id, getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: skuMappingKeys.all,
      });
    },
  });
};
