import { api } from "@/services/api";

import type {
  SaveSheetDraftPayload,
  SheetDraftResponse,
} from "../types/sheetDraft";

const BASE_URL = "/sheet-drafts";

export const sheetDraftService = {
  save(data: SaveSheetDraftPayload, token?: string) {
    return api.post<SheetDraftResponse>(
      BASE_URL,
      data,
      token,
    );
  },

  get(token?: string) {
    return api.get<SheetDraftResponse>(
      BASE_URL,
      token,
    );
  },

  delete(token?: string) {
    return api.delete<SheetDraftResponse>(
      BASE_URL,
      token,
    );
  },
};