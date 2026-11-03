"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingMastersService } from "../services/settingMasters.service";
import {
  CreateOptionPayload,
  UpdateOptionPayload,
} from "../types/settingMasters.types";
import { toast } from "sonner";

export const SETTING_MASTERS_GROUPS_KEY = ["setting-masters-groups"];
export const SETTING_MASTERS_OPTIONS_KEY = (field: string) => [
  "setting-masters-options",
  field.toLowerCase(),
];

export const notifyDropdownSync = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("dropdown_options_updated"));
    try {
      localStorage.setItem("orderos_dropdown_sync", String(Date.now()));
    } catch {}
  }
};

export const invalidateAllDropdownQueries = (
  queryClient: any,
  field?: string
) => {
  if (field) {
    queryClient.invalidateQueries({
      queryKey: SETTING_MASTERS_OPTIONS_KEY(field),
      refetchType: "all",
    });
  }
  queryClient.invalidateQueries({ queryKey: SETTING_MASTERS_GROUPS_KEY, refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["product-dropdown-options"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["material-dropdown-options"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["userManagementDropdownOptions"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["user-dropdown-options"], refetchType: "all" });
  notifyDropdownSync();
};

export function useSettingMastersSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: SETTING_MASTERS_GROUPS_KEY, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["setting-masters-options"], refetchType: "all" });
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "orderos_dropdown_sync") {
        queryClient.invalidateQueries({ queryKey: SETTING_MASTERS_GROUPS_KEY, refetchType: "all" });
        queryClient.invalidateQueries({ queryKey: ["setting-masters-options"], refetchType: "all" });
      }
    };
    window.addEventListener("dropdown_options_updated", handleSync);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("dropdown_options_updated", handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);
}

export function useFieldGroups() {
  return useQuery({
    queryKey: SETTING_MASTERS_GROUPS_KEY,
    queryFn: () => settingMastersService.getFieldGroups(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useFieldOptions(field: string) {
  return useQuery({
    queryKey: SETTING_MASTERS_OPTIONS_KEY(field),
    queryFn: () => settingMastersService.getFieldOptions(field),
    enabled: Boolean(field),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useCreateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOptionPayload) =>
      settingMastersService.createOption(payload),
    onSuccess: (_, variables) => {
      invalidateAllDropdownQueries(queryClient, variables.field);
      toast.success(`Option "${variables.value}" added successfully`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create option");
    },
  });
}

export function useUpdateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateOptionPayload;
    }) => settingMastersService.updateOption(id, payload),
    onSuccess: (_, variables) => {
      invalidateAllDropdownQueries(queryClient, variables.payload.field);
      toast.success("Option updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update option");
    },
  });
}

export function useToggleOptionActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      field,
      value,
      isActive,
    }: {
      id: string;
      field: string;
      value: string;
      isActive: boolean;
    }) =>
      settingMastersService.toggleOptionActive(id, { field, value, isActive }),
    onSuccess: (_, variables) => {
      invalidateAllDropdownQueries(queryClient, variables.field);
      toast.success(
        `"${variables.value}" set to ${variables.isActive ? "Active" : "Inactive"}`
      );
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to toggle option status");
    },
  });
}

export function useDeleteOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      field,
      value,
      label,
    }: {
      id: string;
      field: string;
      value: string;
      label?: string;
    }) => settingMastersService.deleteOption(id, { field, value, label }),
    onSuccess: (_, variables) => {
      invalidateAllDropdownQueries(queryClient, variables.field);
      toast.success(`"${variables.label || variables.value}" deleted successfully`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete option");
    },
  });
}

