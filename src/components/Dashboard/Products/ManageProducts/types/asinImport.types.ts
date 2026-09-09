export interface AsinImportItem {
  id: string;
  asin: string;
  sku: string;
  generateBarcode: string | null;
  rackAddress: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AsinImportsResponse {
  success: boolean;
  data: AsinImportItem[];
  total?: number;
}

