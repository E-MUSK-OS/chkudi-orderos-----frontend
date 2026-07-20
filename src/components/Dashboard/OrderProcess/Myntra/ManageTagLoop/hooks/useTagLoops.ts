"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getTagLoops,
  createTagLoop,
  getTagLoopDashboard,
  exportTagLoop,
  deleteTagLoop,
} from "../services/tagLoop.service";
import { toast } from "sonner";

export const useTagLoops = () => {
  return useQuery({
    queryKey: ["tag-loops"],
    queryFn: getTagLoops,
  });
};

export const useCreateTagLoop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTagLoop,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["tag-loops"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["tag-loop-dashboard"],
      });
    },
  });
};

export const useTagLoopDashboard = () => {
  return useQuery({
    queryKey: ["tag-loop-dashboard"],
    queryFn: getTagLoopDashboard,
  });
};

export const useExportTagLoop = () => {
  return useMutation({
    mutationFn: exportTagLoop,
  });
};

export const useDeleteTagLoop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTagLoop,

    onSuccess: (data) => {
      toast.success(data.message);

      queryClient.invalidateQueries({
        queryKey: ["tag-loops"],
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
