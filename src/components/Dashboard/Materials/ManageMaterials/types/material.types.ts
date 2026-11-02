export interface MaterialStats {
  totalMaterials: number;
  activeMaterials: number;
  inactiveMaterials: number;
  totalBrands?: number;
}

export interface MaterialAttribute {
  id?: string;
  attributeName: string;
  attributeValue?: string;
}

export interface MaterialAttributePayload {
  id?: string;
  attributeName: string;
  attributeValue?: string;
}

export interface Material {
  id: string;
  materialName: string;
  masterSku: string;
  brand: string;
  category: string;
  manufacturingGroup?: string;
  sku?: string;
  marketplace?: string | string[];
  subCategory?: string;
  forUse?: string;
  unit?: string;
  sizeList?: string;
  colors?: string[];
  width?: number;
  widthRangeFrom?: number;
  widthRangeTo?: number;
  gsm?: number;
  gsmRangeFrom?: number;
  gsmRangeTo?: number;
  ledgerGroup?: string;
  less?: number;
  gender?: string;
  referenceParty?: string;
  costApplyingMode?: string;
  materialCost?: number;
  salesRate?: number;
  purchaseType?: string;
  isStockDetailsCompulsory?: boolean;
  issueMode?: string;
  consumptionMode?: string;
  isIssuable?: boolean;
  isSellable?: boolean;
  dealerRate?: number;
  retailRate?: number;
  openingStock?: number;
  reorderLevelStock?: number;
  minimumStock?: number;
  materialPoints?: number;
  isPaired?: boolean;
  availability?: string;
  description?: string;
  asin?: string;
  rackAddress?: string;
  generateBarcode?: string;
  mrp?: string;
  mfgMonth?: string;
  hsnCode?: string;
  gstRate?: number;
  imageUrl?: string;
  imgfileurl?: string;
  isActive: boolean;
  attributes: MaterialAttribute[];
  variants?: any[];
  createdAt: string;
}

export interface MaterialPayload {
  materialName: string;
  masterSku: string;
  brand?: string;
  category: string;
  manufacturingGroup?: string;
  sku?: string;
  marketplace?: string | string[];
  subCategory?: string;
  forUse?: string;
  unit?: string;
  sizeList?: string;
  colors?: string[];
  width?: number;
  widthRangeFrom?: number;
  widthRangeTo?: number;
  gsm?: number;
  gsmRangeFrom?: number;
  gsmRangeTo?: number;
  ledgerGroup?: string;
  less?: number;
  gender?: string;
  referenceParty?: string;
  costApplyingMode?: string;
  materialCost?: number;
  salesRate?: number;
  purchaseType?: string;
  isStockDetailsCompulsory?: boolean;
  issueMode?: string;
  consumptionMode?: string;
  isIssuable?: boolean;
  isSellable?: boolean;
  dealerRate?: number;
  retailRate?: number;
  openingStock?: number;
  reorderLevelStock?: number;
  minimumStock?: number;
  materialPoints?: number;
  isPaired?: boolean;
  availability?: string;
  attributes?: MaterialAttributePayload[];
  description?: string;
  asin?: string;
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

export interface MaterialResponse {
  success: boolean;
  message: string;
  data: Material;
}

export interface MaterialsResponse {
  success: boolean;
  data: Material[];
}

export interface MaterialStatsResponse {
  success: boolean;
  data: MaterialStats;
}

export interface CreateMaterialPayload extends MaterialPayload {}
export interface UpdateMaterialPayload extends Partial<MaterialPayload> {}

export interface UpdateMaterialStatusPayload {
  isActive: boolean;
}

export interface DropdownOptionItem {
  id?: string;
  field: string;
  value: string;
  label: string;
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

