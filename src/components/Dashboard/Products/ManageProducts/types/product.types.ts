export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalBrands?: number;
}

export interface Product {
  id: string;
  productName: string;
  masterSku: string;
  brand: string;
  category: string;
  subCategory: string;
  description?: string;
  isActive: boolean;
  attributes: ProductAttribute[];
  createdAt: string;
}

export interface ProductPayload {
  productName: string;
  masterSku: string;
  brand?: string;
  category: string;
  subCategory?: string;
  description?: string;
  isActive: boolean;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
}

export interface ProductStatsResponse {
  success: boolean;
  data: ProductStats;
}

// export interface Product {
//   id: string;

//   productName: string;
//   masterSku: string;

//   brand?: string;
//   category: string;
//   subCategory?: string;

//   description?: string;

//   isActive: boolean;

//   createdAt: string;
//   updatedAt: string;
// }

export interface ProductAttribute {
  id?: string;
  attributeName: string;
}

export interface ProductAttributePayload {
  id?: string;
  attributeName: string;
}

// export interface ProductPayload {
//   productName: string;
//   masterSku: string;

//   brand?: string;
//   category: string;
//   subCategory?: string;

//   description?: string;

//   isActive: boolean;

//   attributes: ProductAttributePayload[];
// }

export interface CreateProductPayload {
  productName: string;
  masterSku: string;

  brand?: string;
  category: string;
  subCategory?: string;

  description?: string;

  isActive: boolean;

  attributes: ProductAttributePayload[];
}

// export interface UpdateProductPayload extends Partial<CreateProductPayload> {}
export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface UpdateProductStatusPayload {
  isActive: boolean;
}

// export interface ProductResponse {
//   success: boolean;
//   message: string;
//   data: Product;
// }

// export interface ProductsResponse {
//   success: boolean;
//   data: Product[];
// }

// export interface ProductStats {
//   totalProducts: number;
//   activeProducts: number;
//   inactiveProducts: number;
// }

// export interface ProductStatsResponse {
//   success: boolean;
//   data: ProductStats;
// }
