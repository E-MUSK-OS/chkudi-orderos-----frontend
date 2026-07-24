export interface Warehouse {
  id: string;

  warehouseName: string;
  warehouseCode: string;
  description: string | null;

  contactPerson: string | null;
  phone: string | null;
  email: string | null;

  addressLine1: string | null;
  addressLine2: string | null;

  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;

  gstNumber: string | null;

  isDefault: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehousePayload {
  warehouseName: string;
  warehouseCode: string;
  description?: string;

  contactPerson?: string;
  phone?: string;
  email?: string;

  addressLine1?: string;
  addressLine2?: string;

  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  gstNumber?: string;

  isDefault?: boolean;
  isActive?: boolean;
}

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export interface WarehouseResponse {
  success: boolean;
  message: string;
  data: Warehouse;
}

export interface WarehousesResponse {
  success: boolean;
  message: string;
  data: Warehouse[];
}

export interface UpdateWarehouseStatusPayload {
  isActive: boolean;
}

export interface WarehouseStats {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  defaultWarehouse: {
    id: string;
    warehouseName: string;
  } | null;
}

export interface WarehouseStatsResponse {
  success: boolean;
  message: string;
  data: WarehouseStats;
}
