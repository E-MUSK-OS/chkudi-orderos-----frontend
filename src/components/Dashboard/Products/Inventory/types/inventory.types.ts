export interface Inventory {
  id: string;

  availableStock: number;
  reservedStock: number;
  incomingStock: number;
  damagedStock: number;
  reorderLevel: number;

  createdAt: string;
  updatedAt: string;

  productVariant: {
    id: string;
    variantSku: string;
    isActive: boolean;

    product: {
      id: string;
      productName: string;
      masterSku: string;
      brand?: string;
      category: string;
    };

    attributes: {
      id: string;

      attributeValue: string;

      productAttribute: {
        id: string;
        attributeName: string;
      };
    }[];
  };
}

export interface InventoryPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryListResponse {
  success: boolean;
  message: string;

  data: Inventory[];

  pagination: InventoryPagination;
}

export interface InventoryResponse {
  success: boolean;
  message: string;

  data: Inventory;
}

export interface UpdateInventoryPayload {
  reorderLevel: number;
}

export interface AdjustInventoryPayload {
  quantity: number;

  adjustmentType: "IN" | "OUT";

  reason: string;
}

export interface InventoryFilters {
  page?: number;

  limit?: number;

  search?: string;

  productId?: string;

  variantStatus?: boolean;

  sortBy?: string;

  sortOrder?: "asc" | "desc";
}

// export interface ImportInventoryResponse {
//   success: boolean;
//   message: string;
//   data: {
//     totalRows: number;
//     updated: number;
//     failed: number;
//     errors: {
//       row: number;
//       variantSku: string;
//       message: string;
//     }[];
//   };
// }

export interface ImportInventoryResponse {
  success: boolean;
  message: string;
  data: {
    totalRows: number;
    updated: number;
    failed: number;
    errors: {
      row: number;
      variantSku: string;
      message: string;
    }[];
  };
}
