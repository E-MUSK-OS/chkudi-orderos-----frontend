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

  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  attributes: ProductVariantAttribute[];
}

export interface CreateProductVariantPayload {
  productId: string;

  variantSku: string;

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
