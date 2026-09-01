import { SelectOption } from "@/components/ui/ReactSelect";

export type ElementType = "text" | "barcode" | "qrcode" | "image" | "line" | "rectangle";

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;      // in mm
  y: number;      // in mm
  width: number;  // in mm
  height: number; // in mm
  rotation: 0 | 90 | 180 | 270;
  zIndex: number;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  variableSource?: string;
  fontSize: number; // in pt
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  textAlign: "left" | "center" | "right";
  color: string;
  lineHeight: number;
}

export interface BarcodeElement extends BaseElement {
  type: "barcode";
  barcodeFormat: "CODE128" | "EAN13" | "UPC" | "CODE39";
  content: string;
  variableSource?: string;
  showText: boolean;
  fontSize: number;
}

export interface QrCodeElement extends BaseElement {
  type: "qrcode";
  content: string;
  variableSource?: string;
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
}

export interface ImageElement extends BaseElement {
  type: "image";
  imageUrl: string;
  keepAspectRatio: boolean;
}

export interface ShapeElement extends BaseElement {
  type: "line" | "rectangle";
  borderWidth: number; // in mm
  borderColor: string;
  fillColor?: string;
}

export type LabelElement =
  | TextElement
  | BarcodeElement
  | QrCodeElement
  | ImageElement
  | ShapeElement;

export interface CanvasSettings {
  widthMm: number;
  heightMm: number;
  dpi: 203 | 300;
  orientation: "landscape" | "portrait";
  gridSizeMm: number;
  snapToGrid: boolean;
}

export interface DesignerState {
  templateId: string | null;
  templateName: string;
  backgroundImageUrl: string | null;
  settings: CanvasSettings;
  elements: LabelElement[];
  selectedElementId: string | null;
  zoom: number;
  previewSampleData: boolean;
}

export interface LabelTemplate {
  id?: string;
  name: string;
  marketplaceId?: string | null;
  backgroundImageUrl?: string | null;
  thumbnailUrl?: string | null;
  layoutJson: LabelElement[];
  settings: CanvasSettings;
}

export interface ProductLookupResult {
  productVariantId?: string;
  title?: string;
  sku?: string;
  masterSku?: string;
  brand?: string;
  size?: string;
  mrp?: number | null;
  asin?: string | null;
  manufacturingMonth?: string | null;
  availableStock?: number;
  marketplaceId?: string | null;
  marketplaceName?: string | null;
}

export interface PrintQueueItem {
  rowId: number;
  lookupSku: string;
  status: "pending" | "matched" | "not_found" | "multiple_matches" | "error";
  product?: ProductLookupResult;
  errorMessage?: string;
}
