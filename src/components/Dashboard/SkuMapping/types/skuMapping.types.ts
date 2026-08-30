export interface SkuMapping {
  id: string;
  shortSku: string;
  barcodeSku: string;
  fullSku: string;
  asinBarcode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SkuMappingsResponse {
  success: boolean;
  message: string;
  data: SkuMapping[];
  pagination: Pagination;
}

export interface SkuMappingResponse {
  success: boolean;
  message: string;
  data: SkuMapping;
}

export interface UpdateSkuMappingPayload {
  shortSku: string;
  barcodeSku: string;
  ordercookSku: string;
}

export interface ImportSkuMappingResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    totalRows: number;
    inserted: number;
    updated: number;
    failed: number;
    skipped: number;
    errors: {
      row: number;
      shortSku: string;
      message: string;
    }[];
  };
}