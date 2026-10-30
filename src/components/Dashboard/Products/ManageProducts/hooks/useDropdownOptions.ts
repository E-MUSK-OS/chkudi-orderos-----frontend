"use client";

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
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => productService.getDropdownOptions(getToken()),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

