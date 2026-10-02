export interface SkuMapping {
  id: string;
  shortSku: string;
  fullSku?: string | null;
  barcodeSku: string;
  ordercookSku?: string | null;
  brandName?: string | null;
  color?: string | null;
  size?: string | null;
  title?: string | null;
  qty?: number | null;
  mrp?: number | null;
  asinBarcode?: string | null;
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
  fullSku?: string;
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