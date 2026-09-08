"use client";

import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getUserVMS, deleteVMS as deleteVMSApi } from "../services/vms.service";
import { socket } from "@/lib/socket";
import type { VMSItem, GetVMSResponse } from "../types";

export const useVMS = () => {
  const queryClient = useQueryClient();

  const userId = useMemo(() => {
    if (typeof window === "undefined") return "";

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      return user?.id || "";
    } catch (error) {
      console.error("Failed to read user from localStorage:", error);

      return "";
    }
  }, []);

  const query = useQuery({
    queryKey: ["user-vms", userId],

    queryFn: () => getUserVMS(userId),

    enabled: !!userId,

    staleTime: 1000 * 30, // 30 seconds

    gcTime: 1000 * 60 * 10,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!userId) return;

    const joinRoom = () => {
      console.log("👤 Joining VMS room for user:", userId);
      socket.emit("join:user", userId);
    };

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    const handleVmsNew = (newVMS: VMSItem) => {
      console.log("📦 NEW VMS RECEIVED VIA SOCKET:", newVMS);

      queryClient.setQueryData<GetVMSResponse>(["user-vms", userId], (old) => {
        if (!old || !old.data) return old;

        const existsIndex = old.data.findIndex(
          (item) => item.id === newVMS.id || item.trackingId.trim().toLowerCase() === newVMS.trackingId.trim().toLowerCase(),
        );

        if (existsIndex > -1) {
          const updatedList = [...old.data];
          updatedList[existsIndex] = { ...updatedList[existsIndex], ...newVMS };
          return {
            ...old,
            data: updatedList,
          };
        }

        return {
          ...old,
          data: [newVMS, ...old.data],
          total: (old.total || 0) + 1,
        };
      });
    };

    const handleTrackingUpdated = (payload: {
      trackingId: string;
      userId: string;
      scanId: string;
      packingScanStatus: string;
      scan?: VMSItem;
    }) => {
      console.log("📦 TRACKING UPDATED VIA SOCKET:", payload);

      queryClient.setQueryData<GetVMSResponse>(["user-vms", userId], (old) => {
        if (!old || !old.data) return old;

        return {
          ...old,
          data: old.data.map((item) => {
            const matchesTracking =
              item.trackingId.trim().toLowerCase() ===
              payload.trackingId.trim().toLowerCase();
            const matchesId = item.id === payload.scanId;

            if (matchesTracking || matchesId) {
              return {
                ...item,
                packingScanStatus: payload.packingScanStatus as any,
                ...(payload.scan ? payload.scan : {}),
              };
            }

            return item;
          }),
        };
      });
    };

    const handleVmsDeleted = (payload: { id: string; trackingId?: string }) => {
      console.log("🗑️ VMS DELETED VIA SOCKET:", payload);

      queryClient.setQueryData<GetVMSResponse>(["user-vms", userId], (old) => {
        if (!old || !old.data) return old;

        return {
          ...old,
          data: old.data.filter((item) => item.id !== payload.id),
          total: Math.max(0, (old.total || 1) - 1),
        };
      });
    };

    socket.on("vms:new", handleVmsNew);
    socket.on("tracking:updated", handleTrackingUpdated);
    socket.on("vms:deleted", handleVmsDeleted);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("vms:new", handleVmsNew);
      socket.off("tracking:updated", handleTrackingUpdated);
      socket.off("vms:deleted", handleVmsDeleted);
    };
  }, [userId, queryClient]);

  const deleteVMS = async (id: string) => {
    // Optimistic deletion
    queryClient.setQueryData<GetVMSResponse>(["user-vms", userId], (old) => {
      if (!old || !old.data) return old;

      return {
        ...old,
        data: old.data.filter((item) => item.id !== id),
        total: Math.max(0, (old.total || 1) - 1),
      };
    });

    await deleteVMSApi(id);
    await query.refetch();
  };

  return {
    userId,

    data: query.data?.data ?? [],

    total: query.data?.total ?? 0,

    deleteVMS,

    success: query.data?.success ?? false,

    loading: query.isLoading,

    isLoading: query.isLoading,

    isFetching: query.isFetching,

    isError: query.isError,

    error: query.error,

    refetch: query.refetch,
  };
};

