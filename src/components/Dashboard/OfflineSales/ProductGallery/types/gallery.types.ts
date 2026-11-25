import type { Party } from "../../SalesChallan/types/challan.types";
import type { ProductVariant } from "../../../Products/ManageProducts/types/productVariant.types";

export type PriceMode = "RR" | "DR";

export interface GalleryVariantInventory {
  id: string;
  availableStock: number;
  reservedStock?: number;
  reorderLevel?: number;
  warehouseId?: string;
}

export interface GalleryDisplayOptions {
  showCost: boolean;
  showDealerRate: boolean;
  showStock: boolean;
  showReorderStock: boolean;
}

export type StockFilterMode = "all" | "in-stock" | "out-of-stock";

export interface GalleryProductVariant extends ProductVariant {
  imageUrl?: string | null;
  inventories?: GalleryVariantInventory[];
}

export interface GallerySizeVariant {
  variantId: string;
  variantSku: string;
  size: string;
  color: string;
  availableStock: number;
  retailRate: number;
  dealerRate: number;
  mrp: number;
  isActive: boolean;
}

export interface GalleryColorCardItem {
  cardId: string;
  productId: string;
  productName: string;
  masterSku: string;
  cardSku: string;
  category: string;
  availability: string;
  color: string;
  imageUrl?: string;
  retailRate: number;
  dealerRate: number;
  cost: number;
  mrp: number;
  totalPcs: number;
  reorderLevel: number;
  rackAddress: string;
  isActive: boolean;
  primaryVariantId: string;
  sizes: GallerySizeVariant[];
  createdAt?: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  variantSku: string;
  productName: string;
  color: string;
  size: string;
  quantity: number;
  rate: number;
  retailRate: number;
  dealerRate: number;
  availableStock: number;
  imageUrl?: string;
}

export interface GalleryCart {
  id: string;
  name: string;
  party: Party | null;
  items: CartItem[];
}
