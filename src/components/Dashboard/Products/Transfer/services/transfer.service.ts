import { api } from "@/services/api";

import type {
  CreateTransferPayload,
  CreateTransferResponse,
} from "../types/transfer.types";

export const createTransfer = (
  payload: CreateTransferPayload,
  token: string,
) => {
  return api.post<CreateTransferResponse>(
    "/stock-transfers",
    payload,
    token,
  );
};