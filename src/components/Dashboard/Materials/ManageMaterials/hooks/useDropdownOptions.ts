"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialService } from "../services/material.service";

const QUERY_KEY = ["material-dropdown-options"];

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
    queryFn: () => materialService.getDropdownOptions(getToken()),
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
      materialService.saveDropdownOption(data, getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["product-dropdown-options"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["userManagementDropdownOptions"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["user-dropdown-options"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["setting-masters-groups"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["setting-masters-options"], refetchType: "all" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("dropdown_options_updated"));
        try {
          localStorage.setItem("orderos_dropdown_sync", String(Date.now()));
        } catch {}
      }
    },
  });
}
