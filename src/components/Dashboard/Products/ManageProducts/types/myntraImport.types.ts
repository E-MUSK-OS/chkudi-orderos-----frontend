export interface MyntraImportItem {
  id: string;
  rackAddress: string | null;
  myntraSku: string;
  sellerSku: string | null;
  generateBarcode: string | null;
  generatedBarcode?: string | null;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MyntraMappingRecord {
  id?: string;
  myntraSku: string;
  sellerSku: string;
  generateBarcode: string;
  generatedBarcode?: string;
  rackAddress: string;
}

export interface MyntraImportsResponse {
  success: boolean;
  data: MyntraImportItem[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface MyntraMappingsResponse {
  success: boolean;
  mappings: Record<string, MyntraMappingRecord>;
  items: MyntraImportItem[];
  total: number;
}
