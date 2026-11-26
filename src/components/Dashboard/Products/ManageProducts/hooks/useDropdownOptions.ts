"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "../services/product.service";

const QUERY_KEY = ["product-dropdown-options"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Fetch all dropdown options (saved options, DB parties, distinct options)
 */
export function useDropdownOptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, refetchType: "all" });
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "orderos_dropdown_sync") {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY, refetchType: "all" });
      }
    };
    window.addEventListener("dropdown_options_updated", handleSync);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("dropdown_options_updated", handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => productService.getDropdownOptions(getToken()),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

/**
 * Save a new custom dropdown option
 */
export function useSaveDropdownOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { field: string; value: string; label?: string }) =>
      productService.saveDropdownOption(data, getToken()),
    onMutate: async (variables) => {
      const { optimisticallyAddDropdownOptionToCache } = await import(
        "@/utils/dropdownOptions.utils"
      );
      optimisticallyAddDropdownOptionToCache(queryClient, variables);
    },
    onSuccess: async (_data, variables) => {
      const { invalidateAndSyncAllDropdowns } = await import(
        "@/utils/dropdownOptions.utils"
      );
      invalidateAndSyncAllDropdowns(
        queryClient,
        {
          action: "create",
          field: variables.field,
          newValue: variables.value,
          newLabel: variables.label || variables.value,
        },
        { emitBroadcast: true, clearLocalCache: false }
      );
    },
  });
}
