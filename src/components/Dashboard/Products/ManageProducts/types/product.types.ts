export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalBrands?: number;
}

export interface ProductAttribute {
  id?: string;
  attributeName: string;
  attributeValue?: string;
}

export interface ProductAttributePayload {
  id?: string;
  attributeName: string;
  attributeValue?: string;
}

export interface Product {
  id: string;
  productName: string;
  masterSku: string;
  brand: string;
  category: string;
  sku?: string;
  marketplace?: string | string[];
  subCategory?: string;
  unit?: string;
  sizeList?: string;
  colors?: string[];
  gender?: string;
  referenceParty?: string;
  productCost?: number;
  dealerRate?: number;
  retailRate?: number;
  openingStock?: number;
  reorderLevelStock?: number;
  minimumStock?: number;
  productPoints?: number;
  isPaired?: boolean;
  availability?: string;
  description?: string;
  asin?: string;
  myntraSku?: string;
  fsnCode?: string;
  rackAddress?: string;
  generateBarcode?: string;
  mrp?: string;
  mfgMonth?: string;
  hsnCode?: string;
  gstRate?: number;
  imageUrl?: string;

  imgfileurl?: string;
  isActive: boolean;
  attributes: ProductAttribute[];
  variants?: any[];
  createdAt: string;
}

export interface ProductPayload {
  productName: string;
  masterSku: string;
  brand?: string;
  category: string;
  sku?: string;
  marketplace?: string | string[];
  subCategory?: string;
  unit?: string;
  sizeList?: string;
  colors?: string[];
  gender?: string;
  referenceParty?: string;
  productCost?: number;
  dealerRate?: number;
  retailRate?: number;
  openingStock?: number;
  reorderLevelStock?: number;
  minimumStock?: number;
  productPoints?: number;
  isPaired?: boolean;
  availability?: string;
  attributes?: ProductAttributePayload[];
  description?: string;
  asin?: string;
  myntraSku?: string;
  fsnCode?: string;
  rackAddress?: string;
  generateBarcode?: string;
  mrp?: string;
  mfgMonth?: string;
  hsnCode?: string;
  gstRate?: number;
  imageUrl?: string;

  imgfileurl?: string;
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

export interface CreateProductPayload {
  productName: string;
  masterSku: string;
  brand?: string;
  category: string;
  sku?: string;
  marketplace?: string | string[];
  subCategory?: string;
  unit?: string;
  sizeList?: string;
  colors?: string[];
  gender?: string;
  referenceParty?: string;
  productCost?: number;
  dealerRate?: number;
  retailRate?: number;
  openingStock?: number;
  reorderLevelStock?: number;
  minimumStock?: number;
  productPoints?: number;
  isPaired?: boolean;
  availability?: string;
  attributes?: ProductAttributePayload[];
  description?: string;
  asin?: string;
  myntraSku?: string;
  fsnCode?: string;
  rackAddress?: string;
  generateBarcode?: string;
  mrp?: string;
  mfgMonth?: string;
  hsnCode?: string;
  gstRate?: number;
  imageUrl?: string;

  imgfileurl?: string;
  isActive: boolean;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface UpdateProductStatusPayload {
  isActive: boolean;
}

export interface DropdownOptionItem {
  id: string;
  field: string;
  value: string;
  label: string;
  isActive?: boolean;
}

export interface DropdownOptionsData {
  savedOptions: DropdownOptionItem[];
  parties: string[];
  distinctFromProducts: {
    categories: string[];
    brands: string[];
    units: string[];
    genders: string[];
    referenceParties: string[];
    rackAddresses: string[];
    availabilities: string[];
    colors: string[];
  };
}

export interface DropdownOptionsResponse {
  success: boolean;
  data: DropdownOptionsData;
}
