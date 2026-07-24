import type { WarehouseFormValues } from "../validations/warehouse.validation";

export const warehouseDefaultValues: WarehouseFormValues = {
  warehouseName: "",
  warehouseCode: "",
  description: "",

  contactPerson: "",
  phone: "",
  email: "",

  addressLine1: "",
  addressLine2: "",

  city: "",
  state: "",
  country: "",
  pincode: "",

  gstNumber: "",

  isDefault: false,
  isActive: true,
};