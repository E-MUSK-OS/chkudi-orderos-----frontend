import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getToken } from "@/utils/auth";

import { createTransfer } from "../services/transfer.service";

import type {
  CreateTransferPayload,
  CreateTransferResponse,
} from "../types/transfer.types";
import { inventoryKeys } from "@/components/Dashboard/Products/Inventory/hooks/useInventories";

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTransferResponse, Error, CreateTransferPayload>({
    mutationFn: (payload) => createTransfer(payload, getToken()),

    onSuccess: (response) => {
      toast.success(response.message);

      queryClient.invalidateQueries({
        queryKey: ["stock-transfers"],
      });

      queryClient.invalidateQueries({
        queryKey: inventoryKeys.lists(),
      });
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });
};
