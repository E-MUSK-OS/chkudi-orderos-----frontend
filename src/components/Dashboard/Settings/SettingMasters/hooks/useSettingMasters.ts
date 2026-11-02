"use client";

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

export function useFieldGroups() {
  return useQuery({
    queryKey: SETTING_MASTERS_GROUPS_KEY,
    queryFn: () => settingMastersService.getFieldGroups(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useFieldOptions(field: string) {
  return useQuery({
    queryKey: SETTING_MASTERS_OPTIONS_KEY(field),
    queryFn: () => settingMastersService.getFieldOptions(field),
    enabled: Boolean(field),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOptionPayload) =>
      settingMastersService.createOption(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SETTING_MASTERS_OPTIONS_KEY(variables.field),
      });
      queryClient.invalidateQueries({ queryKey: SETTING_MASTERS_GROUPS_KEY });
      // Invalidate product & material dropdown queries so all forms stay synced
      queryClient.invalidateQueries({ queryKey: ["product-dropdown-options"] });
      queryClient.invalidateQueries({ queryKey: ["material-dropdown-options"] });
      queryClient.invalidateQueries({ queryKey: ["user-dropdown-options"] });
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
      if (variables.payload.field) {
        queryClient.invalidateQueries({
          queryKey: SETTING_MASTERS_OPTIONS_KEY(variables.payload.field),
        });
      }
      queryClient.invalidateQueries({ queryKey: SETTING_MASTERS_GROUPS_KEY });
      queryClient.invalidateQueries({ queryKey: ["product-dropdown-options"] });
      queryClient.invalidateQueries({ queryKey: ["material-dropdown-options"] });
      queryClient.invalidateQueries({ queryKey: ["user-dropdown-options"] });
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
      queryClient.invalidateQueries({
        queryKey: SETTING_MASTERS_OPTIONS_KEY(variables.field),
      });
      queryClient.invalidateQueries({ queryKey: SETTING_MASTERS_GROUPS_KEY });
      queryClient.invalidateQueries({ queryKey: ["product-dropdown-options"] });
      queryClient.invalidateQueries({ queryKey: ["material-dropdown-options"] });
      queryClient.invalidateQueries({ queryKey: ["user-dropdown-options"] });
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
    }: {
      id: string;
      field: string;
      value: string;
    }) => settingMastersService.deleteOption(id, { field, value }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: SETTING_MASTERS_OPTIONS_KEY(variables.field),
      });
      queryClient.invalidateQueries({ queryKey: SETTING_MASTERS_GROUPS_KEY });
      queryClient.invalidateQueries({ queryKey: ["product-dropdown-options"] });
      queryClient.invalidateQueries({ queryKey: ["material-dropdown-options"] });
      queryClient.invalidateQueries({ queryKey: ["user-dropdown-options"] });
      toast.success(`"${variables.value}" deleted successfully`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete option");
    },
  });
}

