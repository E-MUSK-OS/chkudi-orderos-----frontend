export interface TransferItem {
  inventoryId: string;

  productVariantId: string;

  sku: string;

  product: string;

  available: number;

  qty: number;
}

export interface CreateTransferPayload {
  fromWarehouseId: string;

  toWarehouseId: string;

  notes?: string;

  items: {
    productVariantId: string;

    quantity: number;
  }[];
}

export interface CreateTransferResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
  };
}
