import JsBarcode from "jsbarcode";
import { renderToString } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import React from "react";
import { resolveVariable } from "@/components/Dashboard/Labels/Designer/utils/sampleData";

import { LabelTemplate } from "@/components/Dashboard/Labels/types/label.types";
export interface ProductLookupResult {
  productVariantId?: string;
  title?: string;
  sku?: string;
  masterSku?: string;
  brand?: string;
  size?: string;
  color?: string;
  mrp?: number | null;
  asin?: string | null;
  manufacturingMonth?: string | null;
  availableStock?: number;
  marketplaceId?: string | null;
  marketplaceName?: string | null;
}

const MM_TO_PX = 3.7795275591;

// Load image helper
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

// SVG to Image helper for QR code
const svgStringToImage = (svgString: string): Promise<HTMLImageElement> => {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return loadImage(url).then((img) => {
    URL.revokeObjectURL(url);
    return img;
  });
};

// Pure Black and White threshold
const applyMonochromeThreshold = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];

    if (alpha === 0) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
      continue;
    }

    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const threshold = 128;
    const value = luminance < threshold ? 0 : 255;

    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255; // Solid opacity
  }
  ctx.putImageData(imageData, 0, 0);
};

// Render logic
export const renderLabelToCanvas = async (
  template: LabelTemplate,
  productData: ProductLookupResult,
  scaleOverride?: number
): Promise<HTMLCanvasElement> => {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2d context");

  const productRecord: Record<string, string> = {
    title: productData.title || "",
    sku: productData.sku || "",
    masterSku: productData.masterSku || "",
    brand: productData.brand || "",
    size: productData.size || "",
    mrp: productData.mrp !== null && productData.mrp !== undefined ? String(productData.mrp) : "",
    asin: productData.asin || "",
    manufacturingMonth: productData.manufacturingMonth || "",
    printDate: new Date().toLocaleDateString(),
  };

  const isPortrait = template.settings.orientation === "portrait";
  
  // Calculate raw pixels
  // We apply a basic DPI scale to ensure crisp thermal printing (e.g. 203 dpi usually ~8 dots/mm)
  // But we stick to MM_TO_PX for logical layout, then scale
  const scale = scaleOverride || (template.settings.dpi || 203) / 96; 
  const logicalWidth = template.settings.widthMm * MM_TO_PX;
  const logicalHeight = template.settings.heightMm * MM_TO_PX;

  // Set canvas size (swap if portrait for final output rotation)
  if (isPortrait) {
    canvas.width = logicalHeight * scale;
    canvas.height = logicalWidth * scale;
  } else {
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;
  }

  // Draw background white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Setup transform for portrait rotation
  ctx.save();
  if (isPortrait) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-logicalWidth / 2, -logicalHeight / 2);
  } else {
    ctx.scale(scale, scale);
  }

  // Draw Background Image
  if (template.backgroundImageUrl) {
    try {
      const bgImg = await loadImage(template.backgroundImageUrl);
      ctx.drawImage(bgImg, 0, 0, logicalWidth, logicalHeight);
    } catch (err) {
      console.error("Failed to load background image", err);
      // Draw visible error state
      ctx.save();
      ctx.fillStyle = "#ffebee";
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      ctx.fillStyle = "#d32f2f";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Background Image Failed", logicalWidth / 2, logicalHeight / 2);
      ctx.restore();
    }
  }

  // Render Elements
  // Sort elements by zIndex (or assume they are sorted)
  const elements = [...(template.layoutJson || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const el of elements) {
    const x = el.x * MM_TO_PX;
    const y = el.y * MM_TO_PX;
    const w = el.width * MM_TO_PX;
    const h = el.height * MM_TO_PX;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (el.rotation) {
      ctx.rotate((el.rotation * Math.PI) / 180);
    }
    ctx.translate(-w / 2, -h / 2);

    if (el.type === "text") {
      const content = resolveVariable(el.content, el.variableSource, productRecord);
      
      let fontSize = el.fontSize || 12;
      ctx.fillStyle = el.color || "#000000";
      ctx.textAlign = el.textAlign || "left";
      ctx.textBaseline = "top";

      const paragraphs = content.split("\n");
      let wrappedLines: { text: string; width: number }[] = [];
      
      // Auto-shrink and wrap loop
      while (fontSize >= 4) {
        const font = `${el.fontWeight === 'bold' ? "bold " : ""}${el.fontStyle === 'italic' ? "italic " : ""}${fontSize}px ${el.fontFamily || "Arial"}`;
        ctx.font = font;
        
        wrappedLines = [];
        
        for (const paragraph of paragraphs) {
          const words = paragraph.split(" ");
          let currentLine = "";
          
          for (let n = 0; n < words.length; n++) {
            const testLine = currentLine + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > w && n > 0) {
              wrappedLines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
              currentLine = words[n] + " ";
            } else {
              currentLine = testLine;
            }
          }
          wrappedLines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
        }
        
        const maxLineWidth = Math.max(...wrappedLines.map(l => l.width));
        const totalHeight = wrappedLines.length * (fontSize * 1.2);
        
        if ((maxLineWidth <= w && totalHeight <= h) || fontSize === 4) {
          break; // Fits perfectly, or we hit the floor
        }
        
        fontSize -= 1;
      }
      
      // Final draw
      const font = `${el.fontWeight === 'bold' ? "bold " : ""}${el.fontStyle === 'italic' ? "italic " : ""}${fontSize}px ${el.fontFamily || "Arial"}`;
      ctx.font = font;
      
      const drawX = el.textAlign === "center" ? w / 2 : el.textAlign === "right" ? w : 0;
      let lineY = 0;
      
      for (const lineObj of wrappedLines) {
        if (lineY + fontSize * 1.2 > h) {
          break; // Clip remaining lines
        }
        ctx.fillText(lineObj.text, drawX, lineY);
        
        if (el.textDecoration === 'underline') {
          const lineWidth = lineObj.width;
          ctx.beginPath();
          let startX = drawX;
          if (el.textAlign === "center") startX -= lineWidth / 2;
          else if (el.textAlign === "right") startX -= lineWidth;
          
          ctx.moveTo(startX, lineY + fontSize);
          ctx.lineTo(startX + lineWidth, lineY + fontSize);
          ctx.stroke();
        }
        lineY += fontSize * 1.2;
      }

    } else if (el.type === "barcode") {
      const content = resolveVariable(el.content, el.variableSource, productRecord);
      if (content) {
        const tmpCanvas = document.createElement("canvas");
        try {
          JsBarcode(tmpCanvas, content, {
            format: el.barcodeFormat || "CODE128",
            width: 2,
            height: h,
            displayValue: el.showText !== false,
            margin: 0,
            background: "transparent",
            lineColor: "#000000",
            fontSize: el.fontSize || 12,
          });
          
          // Letterbox and center to avoid distorting barcode
          const bw = tmpCanvas.width;
          const bh = tmpCanvas.height;
          const scale = Math.min(w / bw, h / bh);
          const scaledW = bw * scale;
          const scaledH = bh * scale;
          const dx = (w - scaledW) / 2;
          const dy = (h - scaledH) / 2;
          
          ctx.drawImage(tmpCanvas, dx, dy, scaledW, scaledH);
        } catch(e) {
          console.error("Barcode render error", e);
        }
      }
    } else if (el.type === "qrcode") {
      const content = resolveVariable(el.content, el.variableSource, productRecord);
      if (content) {
        try {
          const svgString = renderToString(
            React.createElement(QRCodeSVG, {
              value: content,
              size: 256,
              level: el.errorCorrectionLevel || "M",
              includeMargin: false,
            })
          );
          const qrImg = await svgStringToImage(svgString);
          ctx.drawImage(qrImg, 0, 0, w, h);
        } catch (e) {
          console.error("QR Code render error", e);
        }
      }
    } else if (el.type === "rectangle") {
      ctx.strokeStyle = el.borderColor || "#000000";
      ctx.lineWidth = (el.borderWidth || 1) * MM_TO_PX;
      if (el.fillColor) {
        ctx.fillStyle = el.fillColor;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.strokeRect(0, 0, w, h);
    } else if (el.type === "line") {
      ctx.strokeStyle = el.borderColor || "#000000";
      ctx.lineWidth = (el.borderWidth || 1) * MM_TO_PX;
      ctx.beginPath();
      ctx.moveTo(0, h/2);
      ctx.lineTo(w, h/2);
      ctx.stroke();
    } else if (el.type === "image" && el.imageUrl) {
      try {
        const img = await loadImage(el.imageUrl);
        ctx.drawImage(img, 0, 0, w, h);
      } catch (err) {
        console.error("Failed to load embedded image", err);
      }
    }

    ctx.restore();
  }

  ctx.restore();

  // Apply monochrome thresholding only for thermal (B&W) printers.
  // Color mode labels skip this step so colors are preserved in the print output.
  if ((template.settings.colorMode ?? "color") === "monochrome") {
    applyMonochromeThreshold(ctx, canvas.width, canvas.height);
  }

  return canvas;
};
