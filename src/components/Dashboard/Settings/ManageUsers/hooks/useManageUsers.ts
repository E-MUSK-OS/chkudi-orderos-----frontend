import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userManagementService } from "../services/userManagement.service";
import type { UserFormValues } from "../types/userManagement.types";
import { toast } from "sonner";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") ?? "" : "";

export const useUsers = (params?: { search?: string; sort?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["managed-users", params?.search, params?.sort, params?.page, params?.limit],
    queryFn: () => userManagementService.getUsers(params, getToken()),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false, // Prevents sudden empty state on tab switch
    retry: 2,
  });
};

export const useUser = (id?: string) => {
  return useQuery({
    queryKey: ["managed-user", id],
    queryFn: () => (id ? userManagementService.getById(id, getToken()) : null),
    enabled: Boolean(id),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserFormValues>) =>
      userManagementService.create(data, getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast.success("User created successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create user.");
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormValues> }) =>
      userManagementService.update(id, data, getToken()),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      queryClient.invalidateQueries({ queryKey: ["managed-user", variables.id] });
      toast.success("User updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update user.");
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userManagementService.updateStatus(id, isActive, getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast.success("User status updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update user status.");
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userManagementService.deleteUser(id, getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      toast.success("User deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete user.");
    },
  });
};

const DROPDOWN_QUERY_KEY = ["user-dropdown-options"];

export const useUserDropdownOptions = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: DROPDOWN_QUERY_KEY, refetchType: "all" });
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "orderos_dropdown_sync") {
        queryClient.invalidateQueries({ queryKey: DROPDOWN_QUERY_KEY, refetchType: "all" });
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
    queryKey: DROPDOWN_QUERY_KEY,
    queryFn: async () => {
      const res = await userManagementService.getDropdownOptions(getToken());
      return res.data;
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

export const useSaveUserDropdownOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { field: string; value: string; label?: string }) =>
      userManagementService.saveDropdownOption(data, getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DROPDOWN_QUERY_KEY, refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["product-dropdown-options"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["material-dropdown-options"], refetchType: "all" });
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
};
