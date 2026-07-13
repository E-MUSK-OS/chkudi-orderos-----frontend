"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getUserVMS, deleteVMS as deleteVMSApi } from "../services/vms.service";

export const useVMS = () => {
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

    staleTime: 1000 * 60 * 5,

    gcTime: 1000 * 60 * 10,

    retry: 1,

    refetchOnWindowFocus: false,
  });

  const deleteVMS = async (id: string) => {
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
