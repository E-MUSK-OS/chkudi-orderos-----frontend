import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { warehouseService } from "../services/warehouse.service";

import type {
  CreateWarehousePayload,
  UpdateWarehousePayload,
  UpdateWarehouseStatusPayload,
} from "../types/warehouse.types";
import { toast } from "sonner";

const QUERY_KEY = ["warehouses"];

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("accessToken") ?? "";
}

/**
 * Get All Warehouses
 */
// export function useWarehouses(token?: string) {
//   return useQuery({
//     queryKey: QUERY_KEY,
//     queryFn: () => warehouseService.getAll(token),
//   });
// }

export function useWarehouses() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => warehouseService.getAll(getToken()),
  });
}

/**
 * Get Warehouse By Id
 */
export function useWarehouse(id: string, token?: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => warehouseService.getById(id, token),
    enabled: !!id,
  });
}

/**
 * Create Warehouse
 */
export function useCreateWarehouse() {
  const token = localStorage.getItem("accessToken") ?? "";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarehousePayload) =>
      warehouseService.create(data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      toast.success(response?.message || "Warehouse created successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to create warehouse",
      );
    },
  });
}

/**
 * Update Warehouse
 */
// export function useUpdateWarehouse(token?: string) {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: string; data: UpdateWarehousePayload }) =>
//       warehouseService.update(id, data, token),

//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: QUERY_KEY,
//       });
//     },
//   });
// }

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarehousePayload }) =>
      warehouseService.update(id, data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      toast.success(response?.message || "Warehouse updated successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update warehouse",
      );
    },
  });
}

/**
 * Delete Warehouse
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warehouseService.delete(id, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      toast.success(response?.message || "Warehouse deleted successfully");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete warehouse",
      );
    },
  });
}

/**
 * Update Warehouse Status
 */
export function useUpdateWarehouseStatus() {
  const queryClient = useQueryClient();

  //   return useMutation({
  //     mutationFn: ({
  //       id,
  //       data,
  //     }: {
  //       id: string;
  //       data: UpdateWarehouseStatusPayload;
  //     }) => warehouseService.updateStatus(id, data, getToken()),

  //     onSuccess: () => {
  //       queryClient.invalidateQueries({
  //         queryKey: QUERY_KEY,
  //       });
  //     },
  //   });

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWarehouseStatusPayload;
    }) => warehouseService.updateStatus(id, data, getToken()),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });

      toast.success(
        response?.message || "Warehouse status updated successfully",
      );
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update warehouse status",
      );
    },
  });
}

const STATS_QUERY_KEY = ["warehouse-stats"];

export function useWarehouseStats() {
  return useQuery({
    queryKey: STATS_QUERY_KEY,
    queryFn: () => warehouseService.getStats(getToken()),
  });
}

