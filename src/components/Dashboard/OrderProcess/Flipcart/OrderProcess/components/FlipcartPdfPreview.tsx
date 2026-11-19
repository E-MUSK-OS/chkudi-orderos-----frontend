"use client";

import React, { useMemo } from "react";
import { FileText, Download } from "lucide-react";
import Button from "@/components/ui/Button";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import { FlipcartPdfViewType } from "../types";

export interface FlipcartPdfPreviewProps {
  selectedView: FlipcartPdfViewType;
  onViewChange: (view: FlipcartPdfViewType) => void;
  totalOrders: number;
  shippingLabelsPdfUrl: string | null;
  taxInvoicesPdfUrl: string | null;
  originalPdfUrl: string | null;
  onDownloadShippingLabels: () => void;
  onDownloadTaxInvoices: () => void;
  onDownloadOriginal: () => void;
  isDesktop?: boolean;
  targetHeight?: number | null;
  previewCardRef?: React.RefObject<HTMLDivElement | null>;
  isDark?: boolean;
}

export default function FlipcartPdfPreview({
  selectedView,
  onViewChange,
  totalOrders,
  shippingLabelsPdfUrl,
  taxInvoicesPdfUrl,
  originalPdfUrl,
  onDownloadShippingLabels,
  onDownloadTaxInvoices,
  onDownloadOriginal,
  isDesktop = false,
  targetHeight = null,
  previewCardRef,
  isDark = false,
}: FlipcartPdfPreviewProps) {
  const selectThemeStyles = {
    controlBg: isDark ? "#0A0E1A" : "#FFFFFF",
    controlBorder: isDark ? "rgba(255, 255, 255, 0.12)" : "#E2E8F0",
    menuBg: isDark ? "#0F172A" : "#FFFFFF",
    menuBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
    textColor: isDark ? "#F8FAFC" : "#0F172A",
    optionHoverBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#F8FAFC",
  };

  const viewOptions: SelectOption[] = useMemo(
    () => [
      {
        label: `Shipping Labels (${totalOrders})`,
        value: "shipping_labels",
      },
      {
        label: `Tax Invoices (${totalOrders})`,
        value: "tax_invoices",
      },
      {
        label: `Original Uploaded PDF (${totalOrders})`,
        value: "original_pdf",
      },
    ],
    [totalOrders]
  );

  const currentConfig = useMemo(() => {
    switch (selectedView) {
      case "shipping_labels":
        return {
          title: "Flipcart Shipping Labels",
          description: "Cropped thermal shipping labels ready for high-speed printing.",
          url: shippingLabelsPdfUrl,
          onDownload: onDownloadShippingLabels,
          downloadText: "Download Shipping Labels",
        };
      case "tax_invoices":
        return {
          title: "Flipcart Tax Invoices",
          description: "Customer tax invoices extracted with clear top spacing for easy reading.",
          url: taxInvoicesPdfUrl,
          onDownload: onDownloadTaxInvoices,
          downloadText: "Download Tax Invoices",
        };
      case "original_pdf":
      default:
        return {
          title: "Original Uploaded PDF",
          description:
            "Full original uploaded PDF document containing both shipping labels and tax invoices.",
          url: originalPdfUrl,
          onDownload: onDownloadOriginal,
          downloadText: "Download Original Uploaded PDF",
        };
    }
  }, [
    selectedView,
    shippingLabelsPdfUrl,
    taxInvoicesPdfUrl,
    originalPdfUrl,
    onDownloadShippingLabels,
    onDownloadTaxInvoices,
    onDownloadOriginal,
  ]);

  return (
    <div
      ref={previewCardRef}
      className="flex flex-col flex-1 min-h-0 space-y-4 border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm"
      style={{
        height: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        minHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#B88728] dark:text-[#E8C16D]" />
            {currentConfig.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {currentConfig.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="w-full sm:w-60 md:w-64 shrink-0">
            <ReactSelect
              borderRadius={16}
              options={viewOptions}
              value={
                viewOptions.find((opt) => opt.value === selectedView) ??
                viewOptions[0]
              }
              onChange={(opt) => {
                if (opt?.value) {
                  onViewChange(opt.value as FlipcartPdfViewType);
                }
              }}
              height={48}
              {...selectThemeStyles}
            />
          </div>

          <Button
            type="button"
            onClick={currentConfig.onDownload}
            leftIcon={<Download className="h-4 w-4" />}
            className="h-11 sm:h-12 w-full sm:w-auto rounded-2xl border-transparent bg-[#E8C16D] text-xs sm:text-sm font-bold text-[#0A0E1A] hover:bg-[#d4af5a] px-4 cursor-pointer shrink-0"
          >
            {currentConfig.downloadText}
          </Button>
        </div>
      </div>

      {currentConfig.url ? (
        <div className="relative w-full flex-1 min-h-[300px] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] shadow-inner">
          <iframe
            src={`${currentConfig.url}#toolbar=1&navpanes=1&statusbar=1`}
            className="absolute inset-0 w-full h-full border-none"
            title={currentConfig.title}
          />
        </div>
      ) : (
        <div className="py-20 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Document preview is currently unavailable.
        </div>
      )}
    </div>
  );
}
