import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getInventories,
  getInventoryById,
  updateInventory,
  adjustInventory,
  deleteInventory,
  exportInventory,
  importInventory,
} from "../services/inventory.service";

import type {
  InventoryFilters,
  UpdateInventoryPayload,
  AdjustInventoryPayload,
  ImportInventoryResponse,
} from "../types/inventory.types";

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
}

// ==================================================================================
// ================================= QUERY KEYS =====================================
// ==================================================================================

export const inventoryKeys = {
  all: ["inventories"] as const,

  lists: () => [...inventoryKeys.all, "list"] as const,

  list: (filters: InventoryFilters) =>
    [...inventoryKeys.lists(), filters] as const,

  details: () => [...inventoryKeys.all, "detail"] as const,

  detail: (id: string) => [...inventoryKeys.details(), id] as const,
};

// ==================================================================================
// ============================== GET INVENTORIES ===================================
// ==================================================================================

export const useInventories = (filters: InventoryFilters) => {
  return useQuery({
    queryKey: inventoryKeys.list(filters),

    queryFn: () => getInventories(filters, getToken()),
  });
};

// ==================================================================================
// =========================== GET INVENTORY BY ID ==================================
// ==================================================================================

export const useInventory = (id: string) => {
  return useQuery({
    queryKey: inventoryKeys.detail(id),

    queryFn: () => getInventoryById(id, getToken()),

    enabled: !!id,
  });
};

// ==================================================================================
// ============================= UPDATE INVENTORY ===================================
// ==================================================================================

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInventoryPayload;
    }) => updateInventory(id, payload, getToken()),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: inventoryKeys.detail(variables.id),
      });

      toast.success(response?.message || "Inventory updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update inventory",
      );
    },
  });
};

// ==================================================================================
// ============================= ADJUST INVENTORY ===================================
// ==================================================================================

export const useAdjustInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdjustInventoryPayload;
    }) => adjustInventory(id, payload, getToken()),

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: inventoryKeys.detail(variables.id),
      });

      toast.success(response?.message || "Inventory adjusted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to adjust inventory",
      );
    },
  });
};

// ==================================================================================
// ============================= DELETE INVENTORY ===================================
// ==================================================================================

export const useDeleteInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInventory(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(),
      });

      toast.success(response?.message || "Inventory deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete inventory",
      );
    },
  });
};

// ==================================================================================
// ============================= EXPORT INVENTORY ===================================
// ==================================================================================

export const useExportInventory = () => {
  return useMutation({
    // mutationFn: () => exportInventory(getToken()),
    mutationFn: (filters: InventoryFilters) =>
      exportInventory(filters, getToken()),

    onSuccess: () => {
      toast.success("Inventory exported successfully");
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to export inventory");
    },
  });
};

export const useImportInventory = () => {
  const queryClient = useQueryClient();

  return useMutation<ImportInventoryResponse, Error, File>({
    mutationFn: (file) => importInventory(file, getToken()),

    onSuccess: (response) => {
      toast.success(response.message);

      queryClient.invalidateQueries({
        queryKey: ["inventories"],
      });
    },

    onError: (error) => {
      toast.error(error.message || "Failed to import inventory.");
    },
  });
};
