import JsBarcode from "jsbarcode";
import { renderToString } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import React from "react";
import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
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
  if (typeof document !== "undefined" && document.fonts) {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2d context");

  const rawData = (productData || {}) as unknown as Record<string, string>;
  const productRecord: Record<string, string> = {
    ...rawData,
    title: productData.title || rawData.title || "",
    sku: productData.sku || rawData.sku || "",
    masterSku: productData.masterSku || rawData.masterSku || "",
    fullSku: productData.masterSku || rawData.fullSku || rawData.masterSku || "",
    barcode: rawData.barcode || productData.sku || productData.asin || "",
    brand: productData.brand || rawData.brand || "",
    size: productData.size || rawData.size || "",
    color: productData.color || rawData.color || "",
    mrp: productData.mrp !== null && productData.mrp !== undefined ? String(productData.mrp) : (rawData.mrp || ""),
    asin: productData.asin || productData.sku || rawData.asin || "",
    articleNo: rawData.articleNo || productData.asin || productData.sku || "",
    styleNo: rawData.styleNo || productData.asin || productData.sku || "",
    manufacturingMonth: productData.manufacturingMonth || rawData.manufacturingMonth || "",
    printDate: rawData.printDate || new Date().toLocaleDateString(),
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
        try {
          const fontSize = el.fontSize || 12;
          const showText = el.showText !== false;
          const barHeight = Math.max(4, h - (showText ? fontSize : 0));

          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          JsBarcode(svg, content, {
            format: el.barcodeFormat || "CODE128",
            displayValue: showText,
            fontSize: fontSize,
            margin: 0,
            width: 2,
            height: barHeight,
          });

          const svgString = new XMLSerializer().serializeToString(svg);
          const barcodeImg = await svgStringToImage(svgString);

          const bw = barcodeImg.width || 1;
          const bh = barcodeImg.height || 1;
          const scale = Math.min(w / bw, h / bh);
          const scaledW = bw * scale;
          const scaledH = bh * scale;
          const dx = (w - scaledW) / 2;
          const dy = (h - scaledH) / 2;

          ctx.drawImage(barcodeImg, dx, dy, scaledW, scaledH);
        } catch (e) {
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

export type PrintRotation = 0 | 90 | 180 | 270;

export const rotateCanvas = (
  srcCanvas: HTMLCanvasElement,
  rotation: PrintRotation
): HTMLCanvasElement => {
  if (!rotation) return srcCanvas;

  const rotCanvas = document.createElement("canvas");
  const isPerpendicular = rotation === 90 || rotation === 270;
  rotCanvas.width = isPerpendicular ? srcCanvas.height : srcCanvas.width;
  rotCanvas.height = isPerpendicular ? srcCanvas.width : srcCanvas.height;

  const ctx = rotCanvas.getContext("2d");
  if (!ctx) return srcCanvas;

  ctx.save();
  if (rotation === 90) {
    // 90 deg clockwise (rotates landscape 100x50 to fit 50x100 vertical roll)
    ctx.translate(rotCanvas.width, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (rotation === 180) {
    ctx.translate(rotCanvas.width, rotCanvas.height);
    ctx.rotate(Math.PI);
  } else if (rotation === 270) {
    // 90 deg counter-clockwise
    ctx.translate(0, rotCanvas.height);
    ctx.rotate((-90 * Math.PI) / 180);
  }

  ctx.drawImage(srcCanvas, 0, 0);
  ctx.restore();

  return rotCanvas;
};

export interface PrintBrowserOptions {
  widthMm: number;
  heightMm: number;
  title?: string;
}

/**
 * Universally reliable browser printing using an isolated hidden iframe.
 * Completely immune to modal scroll-locks (overflow: hidden), SPA DOM mutation,
 * Base UI dialog backdrops, and premature unmounting conflicts.
 */
export const printLabelsViaBrowser = async (
  imageDataUrls: string[],
  options: PrintBrowserOptions
): Promise<boolean> => {
  if (!imageDataUrls || imageDataUrls.length === 0) {
    throw new Error("No labels provided for printing");
  }

  const { widthMm, heightMm, title = "Print Labels" } = options;

  return new Promise<boolean>((resolve, reject) => {
    // Clean up any stale iframe from previous attempts
    const existing = document.getElementById("label-browser-print-frame");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const iframe = document.createElement("iframe");
    iframe.id = "label-browser-print-frame";
    iframe.setAttribute("aria-hidden", "true");
    // Visible to rendering engine with full opacity (not transparent or offscreen)
    // 1px x 1px in corner so it does not interfere with screen UI
    iframe.style.position = "fixed";
    iframe.style.bottom = "0";
    iframe.style.right = "0";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.border = "none";
    iframe.style.margin = "0";
    iframe.style.padding = "0";
    iframe.style.overflow = "hidden";
    iframe.style.visibility = "visible";
    iframe.style.opacity = "1";
    iframe.style.zIndex = "-1";

    document.body.appendChild(iframe);

    const iframeWin = iframe.contentWindow;
    const iframeDoc = iframe.contentDocument || iframeWin?.document;
    if (!iframeDoc || !iframeWin) {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      reject(new Error("Unable to access print iframe document"));
      return;
    }

    const pagesHtml = imageDataUrls
      .map(
        (url, idx) => `
        <div class="print-page">
          <img src="${url}" alt="Label ${idx + 1}" />
        </div>`
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${widthMm}mm !important;
      height: 100% !important;
      background: #ffffff !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-page {
      display: block !important;
      width: ${widthMm}mm !important;
      height: ${heightMm}mm !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: #ffffff !important;
    }
    .print-page:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    .print-page img {
      display: block !important;
      width: ${widthMm}mm !important;
      height: ${heightMm}mm !important;
      object-fit: fill !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    let isDone = false;
    const finish = () => {
      if (isDone) return;
      isDone = true;
      resolve(true);

      // CRITICAL: In Chromium, removing the iframe immediately inside afterprint
      // cancels the Windows Print Spooler background task before it reaches the printer!
      // We keep the iframe in the DOM and only clean it up after 2 minutes.
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        } catch (e) {}
      }, 120000);
    };

    const runPrint = async () => {
      try {
        const imgs = Array.from(iframeDoc.images);
        if (imgs.length > 0) {
          await Promise.all(
            imgs.map(async (img) => {
              if (img.complete) {
                if (img.decode) {
                  try {
                    await img.decode();
                  } catch (e) {}
                }
                return;
              }
              return new Promise<void>((imgDone) => {
                img.onload = async () => {
                  if (img.decode) {
                    try {
                      await img.decode();
                    } catch (e) {}
                  }
                  imgDone();
                };
                img.onerror = () => imgDone();
              });
            })
          );
        }

        // Delay for rendering layout calculations
        await new Promise((r) => setTimeout(r, 250));

        iframeWin.addEventListener("afterprint", finish);
        window.addEventListener("afterprint", finish);

        iframeWin.focus();
        iframeWin.print();

        // Fallback resolution if afterprint does not fire in some browsers
        setTimeout(finish, 120000);
      } catch (err) {
        console.error("Iframe print error:", err);
        finish();
      }
    };

    // Give iframe document a tick to mount
    setTimeout(() => {
      runPrint().catch(() => finish());
    }, 80);
  });
};

// ==========================================
// Native Vector PDF Generation for Labels
// ==========================================

export const MM_TO_PT = 72 / 25.4;

export const sanitizePdfText = (str?: string | null): string => {
  if (!str) return "";
  return String(str)
    .replace(/₹/g, "Rs. ")
    .replace(/[^\x00-\x7F\xA0-\xFF]/g, "?");
};

export const parsePdfColor = (hexOrRgb?: string) => {
  if (!hexOrRgb || hexOrRgb === "transparent") return null;
  let str = hexOrRgb.trim();
  if (str.startsWith("#")) {
    str = str.substring(1);
    if (str.length === 3) {
      str = str.split("").map((c) => c + c).join("");
    }
    if (str.length === 6) {
      const r = parseInt(str.substring(0, 2), 16) / 255;
      const g = parseInt(str.substring(2, 4), 16) / 255;
      const b = parseInt(str.substring(4, 6), 16) / 255;
      return rgb(r, g, b);
    }
  } else if (str.startsWith("rgb")) {
    const match = str.match(/\d+/g);
    if (match && match.length >= 3) {
      const r = parseInt(match[0], 10) / 255;
      const g = parseInt(match[1], 10) / 255;
      const b = parseInt(match[2], 10) / 255;
      return rgb(r, g, b);
    }
  }
  return rgb(0, 0, 0);
};

const getPdfFont = async (
  pdfDoc: PDFDocument,
  fontFamily?: string,
  fontWeight?: string,
  fontStyle?: string
): Promise<PDFFont> => {
  const isBold = fontWeight === "bold";
  const isItalic = fontStyle === "italic";
  const ff = (fontFamily || "").toLowerCase();

  if (ff.includes("courier") || ff.includes("mono")) {
    if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
    if (isBold) return pdfDoc.embedFont(StandardFonts.CourierBold);
    if (isItalic) return pdfDoc.embedFont(StandardFonts.CourierOblique);
    return pdfDoc.embedFont(StandardFonts.Courier);
  }

  if (ff.includes("serif") || ff.includes("times") || ff.includes("georgia")) {
    if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
    if (isBold) return pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    if (isItalic) return pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    return pdfDoc.embedFont(StandardFonts.TimesRoman);
  }

  // Default to Helvetica (Inter, Arial, Roboto, sans-serif)
  if (isBold && isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  if (isBold) return pdfDoc.embedFont(StandardFonts.HelveticaBold);
  if (isItalic) return pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  return pdfDoc.embedFont(StandardFonts.Helvetica);
};

const wrapPdfText = (
  font: PDFFont,
  text: string,
  maxWidthPt: number,
  fontSizePt: number
): { text: string; width: number }[] => {
  const paragraphs = text.split("\n");
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
      const testWidth = font.widthOfTextAtSize(testLine, fontSizePt);

      if (testWidth > maxWidthPt && currentLine) {
        lines.push({ text: currentLine, width: font.widthOfTextAtSize(currentLine, fontSizePt) });
        // Check if single word is wider than maxWidthPt
        const wordWidth = font.widthOfTextAtSize(word, fontSizePt);
        if (wordWidth > maxWidthPt) {
          let charLine = "";
          for (let c = 0; c < word.length; c++) {
            const charTest = charLine + word[c];
            if (font.widthOfTextAtSize(charTest, fontSizePt) > maxWidthPt && charLine) {
              lines.push({ text: charLine, width: font.widthOfTextAtSize(charLine, fontSizePt) });
              charLine = word[c];
            } else {
              charLine += word[c];
            }
          }
          currentLine = charLine;
        } else {
          currentLine = word;
        }
      } else if (testWidth > maxWidthPt && !currentLine) {
        // First word itself is wider than box
        let charLine = "";
        for (let c = 0; c < word.length; c++) {
          const charTest = charLine + word[c];
          if (font.widthOfTextAtSize(charTest, fontSizePt) > maxWidthPt && charLine) {
            lines.push({ text: charLine, width: font.widthOfTextAtSize(charLine, fontSizePt) });
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
      lines.push({ text: currentLine, width: font.widthOfTextAtSize(currentLine, fontSizePt) });
    }
  }
  return lines;
};

const drawBarcodeToPdfPage = (
  page: any,
  font: PDFFont,
  xPt: number,
  yPt: number,
  widthPt: number,
  heightPt: number,
  content: string,
  barcodeFormat: "CODE128" | "EAN13" | "UPC" | "CODE39" = "CODE128",
  showText: boolean = true,
  fontSizePt: number = 10,
  opacity: number = 1
) => {
  if (!content || !content.trim()) return;

  const textPadding = 1;
  const textHeight = showText ? fontSizePt + textPadding + 2 : 0;
  const barAreaHeight = Math.max(4, heightPt - textHeight);

  let barRects: { x: number; w: number }[] = [];
  let totalBarcodeWidth = 0;

  // 1. Try DOM SVG generation in browser
  if (typeof document !== "undefined" && document.createElementNS) {
    try {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      JsBarcode(svg, content, {
        format: barcodeFormat,
        displayValue: false,
        margin: 0,
        width: 2,
        height: 100,
      });

      const rects = svg.querySelectorAll("rect");
      let minX = Infinity;
      let maxX = -Infinity;

      rects.forEach((r) => {
        const rx = parseFloat(r.getAttribute("x") || "0");
        const rw = parseFloat(r.getAttribute("width") || "0");
        const fill = r.getAttribute("fill");
        if (rw > 0 && fill !== "#ffffff" && fill !== "white") {
          minX = Math.min(minX, rx);
          maxX = Math.max(maxX, rx + rw);
          barRects.push({ x: rx, w: rw });
        }
      });

      if (barRects.length > 0 && isFinite(minX) && isFinite(maxX)) {
        totalBarcodeWidth = maxX - minX;
        barRects = barRects.map((b) => ({ x: b.x - minX, w: b.w }));
      }
    } catch (e) {
      console.warn("SVG JsBarcode generation failed, trying module encoder:", e);
      barRects = [];
    }
  }

  // 2. Fallback to direct binary module encoding
  if (barRects.length === 0) {
    try {
      const BarcodeClass = (JsBarcode as any).getModule(barcodeFormat || "CODE128");
      if (BarcodeClass) {
        const encoder = new BarcodeClass(content, { format: barcodeFormat });
        if (encoder.valid()) {
          const encoded = encoder.encode();
          let bitString = "";
          if (Array.isArray(encoded)) {
            bitString = encoded.map((item: any) => item.data || "").join("");
          } else if (encoded && typeof encoded === "object") {
            bitString = encoded.data || "";
          }

          if (bitString) {
            totalBarcodeWidth = bitString.length;
            let currentBarStart: number | null = null;
            for (let i = 0; i < bitString.length; i++) {
              if (bitString[i] === "1") {
                if (currentBarStart === null) currentBarStart = i;
              } else {
                if (currentBarStart !== null) {
                  barRects.push({ x: currentBarStart, w: i - currentBarStart });
                  currentBarStart = null;
                }
              }
            }
            if (currentBarStart !== null) {
              barRects.push({ x: currentBarStart, w: bitString.length - currentBarStart });
            }
          }
        }
      }
    } catch (err) {
      console.warn("Module JsBarcode generation failed:", err);
    }
  }

  if (barRects.length === 0 || totalBarcodeWidth <= 0) {
    console.warn("Could not generate vector barcode for:", content);
    return;
  }

  const barScale = widthPt / totalBarcodeWidth;
  const scaledBarsWidth = totalBarcodeWidth * barScale;
  const offsetX = xPt + (widthPt - scaledBarsWidth) / 2;
  const offsetY = yPt + textHeight;

  // Draw 100% sharp vector bars
  for (const bar of barRects) {
    page.drawRectangle({
      x: offsetX + bar.x * barScale,
      y: offsetY,
      width: bar.w * barScale,
      height: barAreaHeight,
      color: rgb(0, 0, 0),
      opacity,
    });
  }

  // Draw human readable text centered underneath
  if (showText) {
    const cleanText = sanitizePdfText(content);
    const textWidth = font.widthOfTextAtSize(cleanText, fontSizePt);
    const textX = xPt + (widthPt - textWidth) / 2;
    const textY = yPt + textPadding;
    page.drawText(cleanText, {
      x: textX,
      y: textY,
      size: fontSizePt,
      font,
      color: rgb(0, 0, 0),
      opacity,
    });
  }
};

const drawQrCodeToPdfPage = (
  page: any,
  xPt: number,
  yPt: number,
  widthPt: number,
  heightPt: number,
  content: string,
  errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M",
  opacity: number = 1
) => {
  if (!content || !content.trim()) return;

  try {
    const qrSvg = renderToString(
      React.createElement(QRCodeSVG, {
        value: content,
        size: 256,
        level: errorCorrectionLevel,
      })
    );

    const vbMatch = qrSvg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const matrixSize = vbMatch ? parseInt(vbMatch[1], 10) : 21;
    const qrSize = Math.min(widthPt, heightPt);
    const modScale = qrSize / matrixSize;
    const offsetX = xPt + (widthPt - qrSize) / 2;
    const offsetY = yPt + (heightPt - qrSize) / 2;

    const pathMatch = qrSvg.match(/<path[^>]*fill="#000000"[^>]*d="([^"]+)"/);
    if (pathMatch) {
      const d = pathMatch[1];
      const regex = /M(\d+)[,\s]+(\d+)\s*h(\d+)v(\d+)/gi;
      let match;
      while ((match = regex.exec(d)) !== null) {
        const rx = parseFloat(match[1]);
        const ry = parseFloat(match[2]);
        const rw = parseFloat(match[3]);
        const rh = parseFloat(match[4]);
        page.drawRectangle({
          x: offsetX + rx * modScale,
          y: offsetY + (matrixSize - ry - rh) * modScale,
          width: rw * modScale,
          height: rh * modScale,
          color: rgb(0, 0, 0),
          opacity,
        });
      }
    }
  } catch (err) {
    console.error("Failed to draw vector QR code in PDF:", err);
  }
};

/**
 * Generates a 100% native vector PDF string (Base64) for thermal and desktop printing.
 * Uses native vector text, vector barcode rectangles, and vector QR codes for razor-sharp
 * 203/300 DPI thermal printing without any raster blur or dither artifacts.
 */
export const renderLabelToVectorPdf = async (
  template: LabelTemplate,
  productData: ProductLookupResult
): Promise<string> => {
  const pdfDoc = await PDFDocument.create();

  const widthMm = template.settings.widthMm || 100;
  const heightMm = template.settings.heightMm || 50;

  const pageWidthPt = widthMm * MM_TO_PT;
  const pageHeightPt = heightMm * MM_TO_PT;

  const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

  // 1. Draw solid white background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidthPt,
    height: pageHeightPt,
    color: rgb(1, 1, 1),
  });

  // 2. Product record resolution
  const rawData = (productData || {}) as unknown as Record<string, string>;
  const productRecord: Record<string, string> = {
    ...rawData,
    title: productData.title || rawData.title || "",
    sku: productData.sku || rawData.sku || "",
    masterSku: productData.masterSku || rawData.masterSku || "",
    fullSku: productData.masterSku || rawData.fullSku || rawData.masterSku || "",
    barcode: rawData.barcode || productData.sku || productData.asin || "",
    brand: productData.brand || rawData.brand || "",
    size: productData.size || rawData.size || "",
    color: productData.color || rawData.color || "",
    mrp: productData.mrp !== null && productData.mrp !== undefined ? String(productData.mrp) : (rawData.mrp || ""),
    asin: productData.asin || productData.sku || rawData.asin || "",
    articleNo: rawData.articleNo || productData.asin || productData.sku || "",
    styleNo: rawData.styleNo || productData.asin || productData.sku || "",
    manufacturingMonth: productData.manufacturingMonth || rawData.manufacturingMonth || "",
    printDate: rawData.printDate || new Date().toLocaleDateString(),
  };

  // 3. Draw Background Image if specified
  if (template.backgroundImageUrl) {
    try {
      let bgBytes: Uint8Array | null = null;
      let isPng = false;
      let isJpg = false;
      if (template.backgroundImageUrl.startsWith("data:")) {
        const parts = template.backgroundImageUrl.split(",");
        const mime = parts[0].split(";")[0].replace("data:", "");
        const cleanBase64 = parts[1];
        const binaryString = atob(cleanBase64);
        bgBytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
        isPng = mime.includes("png");
        isJpg = mime.includes("jpeg") || mime.includes("jpg");
      } else {
        const response = await fetch(template.backgroundImageUrl);
        const arrayBuffer = await response.arrayBuffer();
        bgBytes = new Uint8Array(arrayBuffer);
        const ct = response.headers.get("content-type") || "";
        isPng = ct.includes("png") || template.backgroundImageUrl.endsWith(".png");
        isJpg = ct.includes("jpeg") || ct.includes("jpg") || template.backgroundImageUrl.endsWith(".jpg") || template.backgroundImageUrl.endsWith(".jpeg");
      }

      if (bgBytes) {
        let embeddedBg;
        if (isPng) {
          embeddedBg = await pdfDoc.embedPng(bgBytes);
        } else if (isJpg) {
          embeddedBg = await pdfDoc.embedJpg(bgBytes);
        } else {
          const bgImg = await loadImage(template.backgroundImageUrl);
          const oc = document.createElement("canvas");
          oc.width = bgImg.width || 400;
          oc.height = bgImg.height || 200;
          const octx = oc.getContext("2d");
          if (octx) {
            octx.drawImage(bgImg, 0, 0);
            const pngDataUrl = oc.toDataURL("image/png");
            const b64 = pngDataUrl.split(",")[1];
            const pngBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
            embeddedBg = await pdfDoc.embedPng(pngBytes);
          }
        }
        if (embeddedBg) {
          page.drawImage(embeddedBg, {
            x: 0,
            y: 0,
            width: pageWidthPt,
            height: pageHeightPt,
            opacity: template.settings.backgroundOpacity ?? 1,
          });
        }
      }
    } catch (err) {
      console.error("Failed to embed background image in vector PDF:", err);
    }
  }

  // 4. Render Elements in zIndex order
  const elements = [...(template.layoutJson || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  for (const el of elements) {
    const elXPt = el.x * MM_TO_PT;
    const elWPt = el.width * MM_TO_PT;
    const elHPt = el.height * MM_TO_PT;
    const elYPt = pageHeightPt - (el.y + el.height) * MM_TO_PT; // bottom-left corner in PDF coordinate space
    const opacity = el.opacity ?? 1;

    if (el.type === "text") {
      const rawContent = resolveVariable(el.content, el.variableSource, productRecord);
      if (!rawContent || !rawContent.trim()) continue;

      const cleanContent = sanitizePdfText(rawContent);
      const font = await getPdfFont(pdfDoc, el.fontFamily, el.fontWeight, el.fontStyle);
      const fontSizePt = el.fontSize || 12;
      const lineHeightMultiplier = el.lineHeight || 1.2;
      const lineSpacingPt = fontSizePt * lineHeightMultiplier;

      const wrappedLines = wrapPdfText(font, cleanContent, elWPt, fontSizePt);
      if (wrappedLines.length === 0) continue;

      const totalTextHeight = wrappedLines.length * lineSpacingPt;
      const topOffset = Math.max(0, (elHPt - totalTextHeight) / 2);
      // First baseline in PDF space:
      const firstBaselineY = elYPt + elHPt - topOffset - fontSizePt * 0.8 - (lineSpacingPt - fontSizePt) / 2;
      const textColor = parsePdfColor(el.color) || rgb(0, 0, 0);

      for (let i = 0; i < wrappedLines.length; i++) {
        const line = wrappedLines[i];
        const lineY = firstBaselineY - i * lineSpacingPt;

        if (lineY < elYPt - 2) {
          break; // Avoid drawing outside bottom boundary
        }

        if (line.text) {
          let lineX = elXPt;
          if (el.textAlign === "center") {
            lineX = elXPt + (elWPt - line.width) / 2;
          } else if (el.textAlign === "right") {
            lineX = elXPt + elWPt - line.width;
          }

          page.drawText(line.text, {
            x: lineX,
            y: lineY,
            size: fontSizePt,
            font,
            color: textColor,
            opacity,
          });

          if (el.textDecoration === "underline") {
            page.drawLine({
              start: { x: lineX, y: lineY - 1.5 },
              end: { x: lineX + line.width, y: lineY - 1.5 },
              thickness: 0.75,
              color: textColor,
              opacity,
            });
          }
        }
      }
    } else if (el.type === "barcode") {
      const barcodeContent = resolveVariable(el.content, el.variableSource, productRecord);
      if (barcodeContent) {
        const barcodeFont = await getPdfFont(pdfDoc, "Helvetica", "normal", "normal");
        drawBarcodeToPdfPage(
          page,
          barcodeFont,
          elXPt,
          elYPt,
          elWPt,
          elHPt,
          barcodeContent,
          el.barcodeFormat || "CODE128",
          el.showText !== false,
          el.fontSize || 10,
          opacity
        );
      }
    } else if (el.type === "qrcode") {
      const qrContent = resolveVariable(el.content, el.variableSource, productRecord);
      if (qrContent) {
        drawQrCodeToPdfPage(
          page,
          elXPt,
          elYPt,
          elWPt,
          elHPt,
          qrContent,
          el.errorCorrectionLevel || "M",
          opacity
        );
      }
    } else if (el.type === "rectangle") {
      const borderWidthPt = (el.borderWidth || 1) * MM_TO_PT;
      const borderColor = parsePdfColor(el.borderColor || "#000000");
      const fillColor = parsePdfColor(el.fillColor);

      page.drawRectangle({
        x: elXPt,
        y: elYPt,
        width: elWPt,
        height: elHPt,
        borderWidth: borderWidthPt,
        borderColor: borderColor || undefined,
        color: fillColor || undefined,
        opacity,
      });
    } else if (el.type === "line") {
      const borderWidthPt = (el.borderWidth || 1) * MM_TO_PT;
      const borderColor = parsePdfColor(el.borderColor || "#000000") || rgb(0, 0, 0);
      const lineMidY = elYPt + elHPt / 2;

      page.drawLine({
        start: { x: elXPt, y: lineMidY },
        end: { x: elXPt + elWPt, y: lineMidY },
        thickness: borderWidthPt,
        color: borderColor,
        opacity,
      });
    } else if (el.type === "image" && el.imageUrl) {
      try {
        let imageBytes: Uint8Array | null = null;
        let isPng = false;
        let isJpg = false;

        if (el.imageUrl.startsWith("data:")) {
          const parts = el.imageUrl.split(",");
          const mime = parts[0].split(";")[0].replace("data:", "");
          const cleanBase64 = parts[1];
          const binaryString = atob(cleanBase64);
          imageBytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
          isPng = mime.includes("png");
          isJpg = mime.includes("jpeg") || mime.includes("jpg");
        } else {
          const response = await fetch(el.imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          imageBytes = new Uint8Array(arrayBuffer);
          const ct = response.headers.get("content-type") || "";
          isPng = ct.includes("png") || el.imageUrl.endsWith(".png");
          isJpg = ct.includes("jpeg") || ct.includes("jpg") || el.imageUrl.endsWith(".jpg") || el.imageUrl.endsWith(".jpeg");
        }

        if (imageBytes) {
          let embeddedImg;
          if (isPng) {
            embeddedImg = await pdfDoc.embedPng(imageBytes);
          } else if (isJpg) {
            embeddedImg = await pdfDoc.embedJpg(imageBytes);
          } else {
            const htmlImg = await loadImage(el.imageUrl);
            const oc = document.createElement("canvas");
            oc.width = htmlImg.width || 200;
            oc.height = htmlImg.height || 200;
            const octx = oc.getContext("2d");
            if (octx) {
              octx.drawImage(htmlImg, 0, 0);
              const pngDataUrl = oc.toDataURL("image/png");
              const b64 = pngDataUrl.split(",")[1];
              const pngBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
              embeddedImg = await pdfDoc.embedPng(pngBytes);
            }
          }

          if (embeddedImg) {
            page.drawImage(embeddedImg, {
              x: elXPt,
              y: elYPt,
              width: elWPt,
              height: elHPt,
              opacity,
            });
          }
        }
      } catch (err) {
        console.error("Failed to embed image in vector PDF:", err);
      }
    }
  }

  const pdfBase64 = await pdfDoc.saveAsBase64();
  return pdfBase64;
};

