"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getTagLoops,
  createTagLoop,
  getTagLoopDashboard,
  exportTagLoop,
} from "../services/tagLoop.service";

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
