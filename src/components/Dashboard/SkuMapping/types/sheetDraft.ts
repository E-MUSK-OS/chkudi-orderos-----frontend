export interface SheetDraftRow {
  shortSku: string;
  barcodeSku: string;
  ordercookSku: string;
}

export interface SheetDraft {
  id: string;
  userId: string;
  rows: SheetDraftRow[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveSheetDraftPayload {
  rows: SheetDraftRow[];
}

export interface SheetDraftResponse {
  success: boolean;
  message: string;
  data: SheetDraft | null;
}