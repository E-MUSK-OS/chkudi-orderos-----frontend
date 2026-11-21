export interface FlipkartImportItem {
  id: string;
  fsn: string;
  sku: string;
  rackAddress: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlipkartImportsResponse {
  success: boolean;
  data: FlipkartImportItem[];
  total?: number;
}

export interface CreateFlipkartImportInput {
  fsn: string;
  sku: string;
  rackAddress?: string;
}

export interface UpdateFlipkartImportInput {
  fsn: string;
  sku: string;
  rackAddress?: string;
}
