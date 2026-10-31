export interface MaterialVariantAttribute {
  id: string;
  materialAttributeId: string;
  attributeValue: string;
  materialAttribute: {
    id: string;
    attributeName: string;
  };
}

export interface MaterialVariant {
  id: string;
  materialId: string;
  variantSku: string;
  asin?: string | null;
  rackAddress?: string | null;
  imageUrl?: string | null;
  imgfileurl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attributes: MaterialVariantAttribute[];
}

export interface CreateMaterialVariantPayload {
  materialId: string;
  variantSku: string;
  asin?: string;
  rackAddress?: string;
  isActive: boolean;
  attributes: {
    materialAttributeId: string;
    attributeValue: string;
  }[];
}

export type UpdateMaterialVariantPayload = Partial<CreateMaterialVariantPayload>;

export interface MaterialVariantResponse {
  success: boolean;
  message?: string;
  data: MaterialVariant;
}

export interface MaterialVariantsResponse {
  success: boolean;
  data: MaterialVariant[];
}

