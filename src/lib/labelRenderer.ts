import JsBarcode from "jsbarcode";
import { renderToString } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import React from "react";
import { resolveVariable } from "@/components/Dashboard/Labels/Designer/utils/sampleData";
import { mmToPx, MM_TO_PX } from "@/components/Dashboard/Labels/Designer/utils/coordinateMath";
import { LabelTemplate } from "@/components/Dashboard/Labels/types/label.types";

export const getFontFamily = (fontFamily?: string): string => {
  if (!fontFamily || fontFamily === "Inter") {
    return '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  }
  if (fontFamily === "Arial") {
    return "Arial, Helvetica, sans-serif";
  }
  if (fontFamily === "monospace") {
    return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  }
  if (fontFamily === "serif") {
    return 'Georgia, "Times New Roman", Times, serif';
  }
  return `${fontFamily}, "DM Sans", sans-serif`;
};

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

// Removed applyMonochromeThreshold

// Render logic
export const renderLabelToCanvas = async (
  template: LabelTemplate,
  productData: ProductLookupResult,
  scaleOverride?: number,
  forThermalPrint = false
): Promise<HTMLCanvasElement> => {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2d context");

  const productRecord: Record<string, string> = {
    title: productData.title || "",
    sku: productData.sku || "",
    masterSku: productData.masterSku || "",
    fullSku: productData.masterSku || "",
    barcode: productData.sku || productData.asin || "",
    brand: productData.brand || "",
    size: productData.size || "",
    color: productData.color || "",
    mrp: productData.mrp !== null && productData.mrp !== undefined ? String(productData.mrp) : "",
    asin: productData.asin || productData.sku || "",
    articleNo: productData.asin || productData.sku || "",
    styleNo: productData.asin || productData.sku || "",
    manufacturingMonth: productData.manufacturingMonth || "",
    printDate: new Date().toLocaleDateString(),
  };

  // Calculate raw pixels
  // We apply a basic DPI scale to ensure crisp thermal printing (e.g. 203 dpi usually ~8 dots/mm)
  const scale = scaleOverride || (template.settings.dpi || 203) / 96; 
  const logicalWidth = template.settings.widthMm * MM_TO_PX;
  const logicalHeight = template.settings.heightMm * MM_TO_PX;

  canvas.width = Math.round(logicalWidth * scale);
  canvas.height = Math.round(logicalHeight * scale);

  // Draw background white
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(scale, scale);

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

    // Clip to element bounds like CSS overflow: hidden to prevent overlapping adjacent elements
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();

    if (el.type === "text") {
      const content = resolveVariable(el.content, el.variableSource, productRecord);
      if (!content || !content.trim()) {
        ctx.restore();
        continue;
      }
      
      const ptToPx = 96 / 72; // 1pt = 1.3333px at 96 DPI
      const lineHeightMultiplier = el.lineHeight || 1.2;
      let fontSizePx = (el.fontSize || 12) * ptToPx;
      
      ctx.fillStyle = el.color || "#000000";
      ctx.textAlign = el.textAlign || "left";
      ctx.textBaseline = "middle";

      const paragraphs = content.split("\n");
      
      // Auto-wrap lines at element width w
      const wrapText = (fsPx: number) => {
        const font = `${el.fontWeight === 'bold' ? "bold " : ""}${el.fontStyle === 'italic' ? "italic " : ""}${fsPx}px ${getFontFamily(el.fontFamily)}`;
        ctx.font = font;
        const lines: { text: string; width: number }[] = [];
        
        for (const paragraph of paragraphs) {
          if (!paragraph) {
            lines.push({ text: "", width: 0 });
            continue;
          }
          const words = paragraph.split(" ");
          let currentLine = "";
          
          for (let n = 0; n < words.length; n++) {
            const word = words[n];
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > w && currentLine) {
              lines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
              // Check if the single word itself is wider than w
              if (ctx.measureText(word).width > w) {
                let charLine = "";
                for (let c = 0; c < word.length; c++) {
                  if (ctx.measureText(charLine + word[c]).width > w && charLine) {
                    lines.push({ text: charLine, width: ctx.measureText(charLine).width });
                    charLine = word[c];
                  } else {
                    charLine += word[c];
                  }
                }
                currentLine = charLine;
              } else {
                currentLine = word;
              }
            } else if (metrics.width > w && !currentLine) {
              // Single word wider than box on empty line -> character wrap
              let charLine = "";
              for (let c = 0; c < word.length; c++) {
                if (ctx.measureText(charLine + word[c]).width > w && charLine) {
                  lines.push({ text: charLine, width: ctx.measureText(charLine).width });
                  charLine = word[c];
                } else {
                  charLine += word[c];
                }
              }
              currentLine = charLine;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push({ text: currentLine, width: ctx.measureText(currentLine).width });
          }
        }
        return lines;
      };

      let wrappedLines = wrapText(fontSizePx);
      let lineSpacing = fontSizePx * lineHeightMultiplier;
      let totalTextHeight = wrappedLines.length * lineSpacing;

      // Final font setting
      const font = `${el.fontWeight === 'bold' ? "bold " : ""}${el.fontStyle === 'italic' ? "italic " : ""}${fontSizePx}px ${getFontFamily(el.fontFamily)}`;
      ctx.font = font;

      const drawX = el.textAlign === "center" ? w / 2 : el.textAlign === "right" ? w : 0;
      
      // Vertically center like ElementRenderer (justifyContent: 'center')
      let lineY = Math.max(0, (h - totalTextHeight) / 2) + lineSpacing / 2;
      
      for (const lineObj of wrappedLines) {
        if (lineY - lineSpacing / 2 > h) {
          break; // Clip lines that exceed box height
        }
        if (lineObj.text) {
          ctx.fillText(lineObj.text, drawX, lineY);
          
          if (el.textDecoration === 'underline') {
            const lineWidth = lineObj.width;
            ctx.beginPath();
            let startX = drawX;
            if (el.textAlign === "center") startX -= lineWidth / 2;
            else if (el.textAlign === "right") startX -= lineWidth;
            
            ctx.moveTo(startX, lineY + fontSizePx / 2);
            ctx.lineTo(startX + lineWidth, lineY + fontSizePx / 2);
            ctx.stroke();
          }
        }
        lineY += lineSpacing;
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

  // Removed monochrome thresholding step entirely.
  // Thermal printer drivers (Windows Spooler) perform their own Floyd-Steinberg dithering
  // on grayscale anti-aliased text, which produces vastly superior and legible results.
  // Hard 128-thresholding causes sub-pixel text strokes to wash out and vanish.

  return canvas;
};

/**
 * Creates an exact vector HTML DOM representation of a label page,
 * using precise CSS millimeter and point units matching the Designer preview mode.
 */
export const createLabelDom = (
  template: LabelTemplate,
  productRecord: Record<string, string>
): HTMLDivElement => {
  const widthMm = template.settings.widthMm || 100;
  const heightMm = template.settings.heightMm || 50;

  const page = document.createElement("div");
  page.className = "print-page font-sans antialiased";
  page.style.cssText = `
    position: relative;
    width: ${widthMm}mm;
    height: ${heightMm}mm;
    min-width: ${widthMm}mm;
    min-height: ${heightMm}mm;
    max-width: ${widthMm}mm;
    max-height: ${heightMm}mm;
    background-color: #ffffff;
    overflow: hidden;
    box-sizing: border-box;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  `;

  // Background Image
  if (template.backgroundImageUrl) {
    const bgImg = document.createElement("img");
    bgImg.src = template.backgroundImageUrl;
    bgImg.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: fill;
      opacity: ${template.settings.backgroundOpacity ?? 1};
      pointer-events: none;
    `;
    page.appendChild(bgImg);
  }

  const elements = [...(template.layoutJson || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const el of elements) {
    const xPx = mmToPx(el.x, 1);
    const yPx = mmToPx(el.y, 1);
    const widthPx = mmToPx(el.width, 1);
    const heightPx = mmToPx(el.height, 1);
    const contentOpacity = el.opacity ?? 1;

    const elContainer = document.createElement("div");
    elContainer.style.cssText = `
      position: absolute;
      left: ${xPx}px;
      top: ${yPx}px;
      width: ${widthPx}px;
      height: ${heightPx}px;
      transform: ${el.rotation ? `rotate(${el.rotation}deg)` : 'none'};
      z-index: ${el.zIndex || 0};
      opacity: ${contentOpacity};
      box-sizing: border-box;
      overflow: hidden;
    `;

    if (el.type === "text") {
      const text = resolveVariable(el.content, el.variableSource, productRecord);
      const textDiv = document.createElement("div");
      const fontStack = getFontFamily(el.fontFamily);
      textDiv.style.cssText = `
        width: 100%;
        height: 100%;
        font-size: ${el.fontSize || 12}pt;
        font-family: ${fontStack};
        font-weight: ${el.fontWeight === 'bold' ? 'bold' : 'normal'};
        font-style: ${el.fontStyle === 'italic' ? 'italic' : 'normal'};
        text-decoration: ${el.textDecoration === 'underline' ? 'underline' : 'none'};
        text-align: ${el.textAlign || 'left'};
        line-height: ${el.lineHeight ? el.lineHeight : 'normal'};
        color: ${el.color || '#000000'};
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-sizing: border-box;
      `;
      textDiv.textContent = text;
      elContainer.appendChild(textDiv);
    } else if (el.type === "barcode") {
      const content = resolveVariable(el.content, el.variableSource, productRecord);
      if (content) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.display = "block";
        try {
          JsBarcode(svg, content, {
            format: el.barcodeFormat || "CODE128",
            displayValue: el.showText !== false,
            fontSize: el.fontSize || 12,
            margin: 0,
            width: 2,
            height: Math.max(4, heightPx - (el.showText ? (el.fontSize || 12) : 0)),
          });
        } catch (e) {
          console.warn("Barcode error:", e);
        }
        elContainer.appendChild(svg);
      }
    } else if (el.type === "qrcode") {
      const content = resolveVariable(el.content, el.variableSource, productRecord);
      if (content) {
        const qrWrapper = document.createElement("div");
        qrWrapper.style.cssText = "width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;";
        qrWrapper.innerHTML = renderToString(
          React.createElement(QRCodeSVG, {
            value: content,
            size: Math.min(widthPx, heightPx),
            level: el.errorCorrectionLevel || "M",
          })
        );
        elContainer.appendChild(qrWrapper);
      }
    } else if (el.type === "image") {
      if (el.imageUrl) {
        const img = document.createElement("img");
        img.src = el.imageUrl;
        img.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: ${el.keepAspectRatio ? 'contain' : 'fill'};
          pointer-events: none;
        `;
        elContainer.appendChild(img);
      }
    } else if (el.type === "line") {
      const strokePx = mmToPx(el.borderWidth || 1, 1);
      const lineDiv = document.createElement("div");
      lineDiv.style.cssText = `
        width: 100%;
        height: ${strokePx}px;
        background-color: ${el.borderColor || '#000000'};
        margin-top: ${(heightPx - strokePx) / 2}px;
      `;
      elContainer.appendChild(lineDiv);
    } else if (el.type === "rectangle") {
      const borderPx = mmToPx(el.borderWidth || 1, 1);
      const rectDiv = document.createElement("div");
      rectDiv.style.cssText = `
        width: 100%;
        height: 100%;
        border: ${borderPx}px solid ${el.borderColor || '#000000'};
        background-color: ${el.fillColor || 'transparent'};
        box-sizing: border-box;
      `;
      elContainer.appendChild(rectDiv);
    }

    page.appendChild(elContainer);
  }

  return page;
};
