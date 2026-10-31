export interface ProductVariantAttribute {
  id: string;

  productAttributeId: string;

  attributeValue: string;

  productAttribute: {
    id: string;
    attributeName: string;
  };
}

export interface ProductVariant {
  id: string;

  productId: string;

  variantSku: string;

  asin?: string | null;
  myntraSku?: string | null;
  fsnCode?: string | null;

  rackAddress?: string | null;
  imageUrl?: string | null;

  imgfileurl?: string | null;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  attributes: ProductVariantAttribute[];
}

export interface CreateProductVariantPayload {
  productId: string;

  variantSku: string;

  asin?: string;
  myntraSku?: string;
  fsnCode?: string;

  rackAddress?: string;

  isActive: boolean;

  attributes: {
    productAttributeId: string;
    attributeValue: string;
  }[];
}

export type UpdateProductVariantPayload = Partial<CreateProductVariantPayload>;

export interface ProductVariantResponse {
  success: boolean;

  message?: string;

  data: ProductVariant;
}

export interface ProductVariantsResponse {
  success: boolean;

  data: ProductVariant[];
}
