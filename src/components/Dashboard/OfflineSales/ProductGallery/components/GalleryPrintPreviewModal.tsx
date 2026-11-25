"use client";

import React, { useMemo, useState, useRef } from "react";
import {
  X,
  Download,
  Share2,
  Printer,
  ImageIcon,
  Phone,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import type {
  GalleryColorCardItem,
  GalleryDisplayOptions,
} from "../types/gallery.types";

interface GalleryPrintPreviewModalProps {
  open: boolean;
  items: GalleryColorCardItem[];
  companyName: string;
  companyPhone?: string;
  displayOptions: GalleryDisplayOptions;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 16; // 4 columns x 4 rows per A4 sheet matching img-3

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function GalleryPrintPreviewModal({
  open,
  items,
  companyName,
  companyPhone,
  displayOptions,
  onClose,
}: GalleryPrintPreviewModalProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const printableAreaRef = useRef<HTMLDivElement | null>(null);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const pages = useMemo(() => {
    const result: GalleryColorCardItem[][] = [];
    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
      result.push(items.slice(i, i + ITEMS_PER_PAGE));
    }
    return result.length > 0 ? result : [[]];
  }, [items]);

  if (!open) return null;

  const handlePrint = () => {
    const contentEl = printableAreaRef.current;
    if (!contentEl) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    const cardsHtml = pages
      .map((pageCards, pageIndex) => {
        const headerHtml =
          pageIndex === 0
            ? `
            <div style="text-align:center; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size:10px; font-weight:700; letter-spacing:2.5px; color:#64748b; text-transform:uppercase;">
                ——— PRODUCT GALLERY ———
              </div>
              <div style="font-size:22px; font-weight:900; color:#0f172a; margin-top:4px; letter-spacing:0.5px;">
                ${companyName || "PRODUCT GALLERY"}
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:4px;">
                ${companyPhone ? `☎ ${companyPhone} &nbsp;•&nbsp; ` : ""}${items.length} products &nbsp;•&nbsp; ${formattedDate}
              </div>
            </div>
          `
            : "";

        const gridHtml = pageCards
          .map(
            (card) => `
            <div style="border:1px solid #e2e8f0; border-radius:12px; padding:10px; background:#ffffff; display:flex; flex-direction:column; justify-content:space-between; break-inside:avoid;">
              <div style="height:125px; display:flex; align-items:center; justify-content:center; background:#ffffff; border-radius:8px; overflow:hidden; margin-bottom:8px;">
                ${
                  card.imageUrl
                    ? `<img src="${card.imageUrl}" alt="${card.cardSku}" style="max-height:100%; max-width:100%; object-fit:contain;" />`
                    : `<span style="font-size:10px; color:#94a3b8;">No Image</span>`
                }
              </div>
              <div>
                <div style="font-size:11px; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${card.cardSku}
                </div>
                <div style="display:inline-block; margin-top:3px; padding:2px 6px; border-radius:4px; background:#f1f5f9; color:#475569; font-size:9px; font-weight:700;">
                  ${card.category}
                </div>
                <div style="display:flex; align-items:flex-end; justify-content:space-between; margin-top:6px;">
                  <div style="font-size:10px; font-family:monospace; color:#334155; line-height:1.4;">
                    <div><strong>RR</strong> ₹${card.retailRate.toLocaleString("en-IN")}</div>
                    ${
                      displayOptions.showDealerRate
                        ? `<div><strong>DR</strong> ₹${card.dealerRate.toLocaleString("en-IN")}</div>`
                        : ""
                    }
                    ${
                      displayOptions.showCost
                        ? `<div><strong>COST</strong> ₹${card.cost.toLocaleString("en-IN")}</div>`
                        : ""
                    }
                    ${
                      displayOptions.showReorderStock
                        ? `<div><strong>RL</strong> ${card.reorderLevel}</div>`
                        : ""
                    }
                  </div>
                  ${
                    displayOptions.showStock
                      ? `<span style="padding:2px 8px; border-radius:999px; font-size:9px; font-weight:800; background:${
                          card.totalPcs > 0 ? "#dcfce7" : "#fee2e2"
                        }; color:${card.totalPcs > 0 ? "#15803d" : "#dc2626"};">
                          ${card.totalPcs}
                        </span>`
                      : ""
                  }
                </div>
              </div>
            </div>
          `
          )
          .join("");

        return `
          <div style="page-break-after: ${
            pageIndex < pages.length - 1 ? "always" : "auto"
          }; padding: 14px;">
            ${headerHtml}
            <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px;">
              ${gridHtml}
            </div>
          </div>
        `;
      })
      .join("");

    doc.open();
    doc.write(`
      <!doctype html>
      <html>
        <head>
          <title>Product Gallery - ${companyName}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>${cardsHtml}</body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 500);
  };

  const handleDownloadPdf = async () => {
    try {
      setGeneratingPdf(true);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageW = pdf.internal.pageSize.getWidth(); // 210
      const margin = 10;
      const cols = 4;
      const gap = 4;
      const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
      const cardH = 56;

      // Limit thumbnail pre-fetching smoothly to avoid memory spike if huge
      const maxImagesToEmbed = Math.min(items.length, 160);
      const imageMap = new Map<string, string>();
      await Promise.all(
        items.slice(0, maxImagesToEmbed).map(async (c) => {
          if (!c.imageUrl) return;
          const dataUrl = await loadImageAsDataUrl(c.imageUrl);
          if (dataUrl) imageMap.set(c.cardId, dataUrl);
        })
      );

      pages.forEach((pageCards, pageIdx) => {
        if (pageIdx > 0) pdf.addPage();

        let startY = 12;

        if (pageIdx === 0) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.text("PRODUCT GALLERY", pageW / 2, startY, { align: "center" });

          startY += 6;
          pdf.setFontSize(16);
          pdf.setTextColor(15, 23, 42);
          pdf.setFont("helvetica", "bold");
          pdf.text(companyName || "PRODUCT GALLERY", pageW / 2, startY, {
            align: "center",
          });

          startY += 5;
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 116, 139);
          const metaLine = `${companyPhone ? `${companyPhone}  •  ` : ""}${
            items.length
          } products  •  ${formattedDate}`;
          pdf.text(metaLine, pageW / 2, startY, { align: "center" });

          startY += 6;
        }

        pageCards.forEach((card, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = margin + col * (cardW + gap);
          const y = startY + row * (cardH + gap);

          // Card Box
          pdf.setDrawColor(226, 232, 240);
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(x, y, cardW, cardH, 2.5, 2.5, "FD");

          // Thumbnail
          const imgData = imageMap.get(card.cardId);
          if (imgData) {
            try {
              const fmt = imgData.includes("image/png") ? "PNG" : "JPEG";
              pdf.addImage(imgData, fmt, x + 4, y + 2.5, cardW - 8, 28, undefined, "FAST");
            } catch {
              // ignore unrenderable image
            }
          }

          // SKU Title
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(15, 23, 42);
          const skuText =
            card.cardSku.length > 22
              ? `${card.cardSku.slice(0, 21)}...`
              : card.cardSku;
          pdf.text(skuText, x + 3, y + 35);

          // Category
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(6.5);
          pdf.setTextColor(100, 116, 139);
          pdf.text(card.category || "", x + 3, y + 39);

          // Rates
          pdf.setFontSize(7.5);
          pdf.setTextColor(51, 65, 85);
          let rateY = y + 44;
          pdf.text(`RR ₹${card.retailRate}`, x + 3, rateY);
          if (displayOptions.showDealerRate) {
            rateY += 4;
            pdf.text(`DR ₹${card.dealerRate}`, x + 3, rateY);
          }
          if (displayOptions.showCost) {
            rateY += 4;
            pdf.text(`COST ₹${card.cost}`, x + 3, rateY);
          }

          // Stock Badge
          if (displayOptions.showStock) {
            const stockText = String(card.totalPcs);
            pdf.setFillColor(
              card.totalPcs > 0 ? 220 : 254,
              card.totalPcs > 0 ? 252 : 226,
              card.totalPcs > 0 ? 231 : 226
            );
            pdf.roundedRect(x + cardW - 11, y + 44, 8, 4.5, 2, 2, "F");
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(7);
            pdf.setTextColor(
              card.totalPcs > 0 ? 21 : 220,
              card.totalPcs > 0 ? 128 : 38,
              card.totalPcs > 0 ? 61 : 38
            );
            pdf.text(stockText, x + cardW - 7, y + 47.3, { align: "center" });
          }
        });
      });

      pdf.save(
        `${(companyName || "product-gallery")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")}.pdf`
      );
      toast.success("Product Gallery PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleShare = async () => {
    const text = `${companyName} - Product Gallery (${items.length} items)`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${companyName} - Product Gallery`,
          text,
          url: window.location.href,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} - ${window.location.href}`);
      toast.success("Gallery link copied to clipboard!");
    } catch {
      toast.info("Use Print or Download PDF to share.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-xs"
      onClick={onClose}
    >
      {/* Top Preview Action Bar matching img-3 */}
      <div
        className="px-4 sm:px-6 py-3.5 border-b border-white/[0.1] bg-[#0F131C] flex flex-wrap items-center justify-between gap-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white">
            Print Preview
          </h2>
          <p className="text-[11px] font-medium text-slate-400">
            {items.length} items &nbsp;•&nbsp; {pages.length} page
            {pages.length === 1 ? "" : "s"} &nbsp;•&nbsp; {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3.5 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <X size={14} />
            <span>Close</span>
          </button>

          <button
            type="button"
            disabled={generatingPdf}
            onClick={handleDownloadPdf}
            title="Download PDF"
            aria-label="Download PDF"
            className="h-9 w-9 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
          >
            {generatingPdf ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            title="Share"
            aria-label="Share"
            className="h-9 w-9 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Share2 size={15} />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="h-9 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#0A0E1A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Scrollable White Catalog Sheets matching img-3 */}
      <div
        ref={printableAreaRef}
        className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {pages.map((pageCards, pageIndex) => (
          <div
            key={pageIndex}
            className="mx-auto max-w-[820px] w-full rounded-xl bg-white text-slate-900 shadow-2xl p-6 sm:p-8"
          >
            {/* Company Title Block on Page 1 matching img-3 */}
            {pageIndex === 0 && (
              <div className="text-center pb-5 mb-5 border-b border-slate-100">
                <div className="flex items-center justify-center gap-3 text-[10px] font-bold tracking-[0.22em] text-slate-400 uppercase">
                  <span className="h-px w-8 bg-slate-200" />
                  <span>PRODUCT GALLERY</span>
                  <span className="h-px w-8 bg-slate-200" />
                </div>

                <h1 className="mt-1.5 text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {companyName || "PRODUCT GALLERY"}
                </h1>

                <div className="mt-1 flex items-center justify-center flex-wrap gap-2 text-[11px] font-medium text-slate-500">
                  {companyPhone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={10} />
                      <span>{companyPhone}</span>
                    </span>
                  )}
                  {companyPhone && <span>•</span>}
                  <span>{items.length} products</span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                </div>
              </div>
            )}

            {/* 4-Column White Card Grid matching img-3 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {pageCards.map((card) => {
                const isLowReorder =
                  displayOptions.showReorderStock &&
                  card.reorderLevel > 0 &&
                  card.totalPcs <= card.reorderLevel;

                return (
                  <div
                    key={card.cardId}
                    className="rounded-xl border border-slate-200/80 bg-white p-2.5 flex flex-col justify-between shadow-2xs"
                  >
                    <div className="aspect-[4/3.6] w-full rounded-lg bg-white overflow-hidden flex items-center justify-center mb-2">
                      {card.imageUrl && !imgErrors[card.cardId] ? (
                        <img
                          src={card.imageUrl}
                          alt={card.cardSku}
                          onError={() =>
                            setImgErrors((p) => ({
                              ...p,
                              [card.cardId]: true,
                            }))
                          }
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-extrabold text-slate-900 truncate">
                        {card.cardSku}
                      </p>

                      <div>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-semibold text-slate-600">
                          {card.category}
                        </span>
                      </div>

                      <div className="flex items-end justify-between gap-1 pt-0.5">
                        <div className="text-[10px] font-mono text-slate-700 leading-tight space-y-0.5">
                          <div>
                            <span className="text-slate-400 font-sans font-bold mr-1">
                              RR
                            </span>
                            ₹{card.retailRate.toLocaleString("en-IN")}
                          </div>
                          {displayOptions.showDealerRate && (
                            <div>
                              <span className="text-slate-400 font-sans font-bold mr-1">
                                DR
                              </span>
                              ₹{card.dealerRate.toLocaleString("en-IN")}
                            </div>
                          )}
                          {displayOptions.showCost && (
                            <div>
                              <span className="text-slate-400 font-sans font-bold mr-1">
                                COST
                              </span>
                              ₹{card.cost.toLocaleString("en-IN")}
                            </div>
                          )}
                          {displayOptions.showReorderStock && (
                            <div
                              className={
                                isLowReorder
                                  ? "text-amber-600 font-bold"
                                  : "text-slate-500"
                              }
                            >
                              <span className="font-sans font-bold mr-1">
                                RL
                              </span>
                              {card.reorderLevel}
                            </div>
                          )}
                        </div>

                        {displayOptions.showStock && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
                              card.totalPcs > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-100 text-rose-600"
                            }`}
                          >
                            {card.totalPcs}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {pages.length > 1 && (
              <div className="mt-4 pt-2 border-t border-slate-100 text-right text-[10px] text-slate-400">
                Page {pageIndex + 1} of {pages.length}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
