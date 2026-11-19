export interface FlipcartImportItem {
  id: string;
  fsn: string;
  sku: string;
  rackAddress: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlipcartImportsResponse {
  success: boolean;
  data: FlipcartImportItem[];
  total?: number;
}

export interface CreateFlipcartImportInput {
  fsn: string;
  sku: string;
  rackAddress?: string;
}

export interface UpdateFlipcartImportInput {
  fsn: string;
  sku: string;
  rackAddress?: string;
}
