"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ReactSelect, { SelectOption } from "@/components/ui/ReactSelect";
import {
  Printer,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Minus,
  Plus,
} from "lucide-react";
import { LabelTemplate } from "../../types/label.types";
import {
  chromeExtensionPrintService,
  resolveCurrentlyConnectedPrinter,
  isThermalOrLabelPrinter,
  PrinterDetail,
} from "../../services/printAgent.service";
import { renderLabelToCanvas, renderLabelToVectorPdf, ProductLookupResult, printLabelsViaBrowser, rotateCanvas } from "@/lib/labelRenderer";
import { getEffectiveCanvasDimensions } from "../utils/coordinateMath";
import { labelService } from "../../services/label.service";
import { toast } from "sonner";

interface TestPrintModalProps {
  open: boolean;
  onClose: () => void;
  template: LabelTemplate;
  previewData: Record<string, string> | null;
}

export function TestPrintModal({
  open,
  onClose,
  template,
  previewData,
}: TestPrintModalProps) {
  const [printers, setPrinters] = useState<string[]>([]);
  const [detailedPrinters, setDetailedPrinters] = useState<PrinterDetail[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("");
  const [copies, setCopies] = useState<number>(1);
  const [helperStatus, setHelperStatus] = useState<
    "checking" | "online" | "extension-missing" | "no-printers" | "error"
  >("checking");
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isRenderingPreview, setIsRenderingPreview] = useState<boolean>(true);
  
  const [skuInput, setSkuInput] = useState<string>(previewData?.sku || previewData?.asin || "");
  const [liveData, setLiveData] = useState<Record<string, string> | null>(previewData);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductLookupResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const term = skuInput.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await labelService.lookupProduct(term);
        setSearchResults(res);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [skuInput]);

  const selectProduct = useCallback((match: ProductLookupResult) => {
    setSkuInput(match.sku || match.masterSku || "");
    setLiveData({
      ...previewData,
      title: match.title || "",
      sku: match.sku || "",
      masterSku: match.masterSku || "",
      brand: match.brand || "",
      size: match.size || "",
      mrp: match.mrp ? match.mrp.toString() : "",
      asin: match.asin || "",
      manufacturingMonth: match.manufacturingMonth || "",
    } as any);
    setIsDropdownOpen(false);
  }, [previewData]);

  useEffect(() => {
    if (!isDropdownOpen) {
      setLiveData(prev => ({
        ...(prev || previewData || {}),
        sku: skuInput || "Template Default"
      } as any));
    }
  }, [skuInput, isDropdownOpen, previewData]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Prepare resolved product lookup data from previewData
  const productData: ProductLookupResult = liveData
    ? {
        title: liveData.title,
        sku: liveData.sku,
        masterSku: liveData.masterSku,
        brand: liveData.brand,
        size: liveData.size,
        color: liveData.color,
        mrp: liveData.mrp ? Number(liveData.mrp) || null : null,
        asin: liveData.asin,
        manufacturingMonth: liveData.manufacturingMonth,
        ...(liveData as any),
      }
    : {};

  // Fetch printers and check extension status
  const loadPrinters = useCallback(async () => {
    setHelperStatus("checking");
    try {
      const check = await chromeExtensionPrintService.checkExtension();
      if (!check.ok) {
        setPrinters([]);
        setDetailedPrinters([]);
        setHelperStatus("extension-missing");
        return;
      }

      const list = await chromeExtensionPrintService.getPrinters();
      const details = await chromeExtensionPrintService.getPrintersDetailed(true);

      setPrinters(list);
      setDetailedPrinters(details);

      if (list.length === 0) {
        setHelperStatus("no-printers");
      } else {
        setHelperStatus("online");

        // Auto-select online thermal or connected printer
        const resolved = resolveCurrentlyConnectedPrinter(list, details);
        if (resolved.printer) {
          setSelectedPrinter(resolved.printer);
        } else {
          // Fallback to last used or first available
          const lastUsed = typeof window !== "undefined" ? localStorage.getItem("lastUsedPrinter") : null;
          if (lastUsed && list.includes(lastUsed)) {
            setSelectedPrinter(lastUsed);
          } else {
            setSelectedPrinter(list[0]);
          }
        }
      }
    } catch (err) {
      console.warn("Error loading printers for test print:", err);
      setHelperStatus("error");
    }
  }, []);

  // On modal open, load printers and render canvas preview
  useEffect(() => {
    if (open) {
      loadPrinters();
    }
  }, [open, loadPrinters]);

  // Render thumbnail canvas
  useEffect(() => {
    if (!open || !template) return;

    let isMounted = true;
    setIsRenderingPreview(true);

    renderLabelToCanvas(template, productData, 1, false)
      .then((renderedCanvas) => {
        if (!isMounted || !canvasRef.current) return;
        const targetCanvas = canvasRef.current;
        targetCanvas.width = renderedCanvas.width;
        targetCanvas.height = renderedCanvas.height;
        const ctx = targetCanvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
          ctx.drawImage(renderedCanvas, 0, 0);
        }
      })
      .catch((err) => {
        console.error("Failed to render test print preview canvas:", err);
      })
      .finally(() => {
        if (isMounted) setIsRenderingPreview(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, template, previewData]);

  // Handle Silent Print via PrintBridge Chrome Extension
  const handleSilentPrint = async () => {
    if (!selectedPrinter) {
      toast.error("Please select a printer first.");
      return;
    }

    setIsPrinting(true);
    const toastId = toast.loading(`Sending test label to ${selectedPrinter}...`);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("lastUsedPrinter", selectedPrinter);
      }

      // Render native vector PDF for razor-sharp thermal printing
      const pdfBase64 = await renderLabelToVectorPdf(template, productData);

      const effectiveWidthMm = template.settings.widthMm || 100;
      const effectiveHeightMm = template.settings.heightMm || 50;

      const extRes = await chromeExtensionPrintService.printPdf(
        pdfBase64,
        selectedPrinter,
        copies,
        true,
        effectiveWidthMm,
        effectiveHeightMm
      );

      if (extRes && (extRes.success === false || extRes.error)) {
        throw new Error(extRes.error || "Print extension reported print failure");
      }

      // Log print session
      const skuLabel = previewData?.sku || previewData?.asin || "TEST-SKU";
      labelService
        .logPrintSession([{ sku: skuLabel, count: copies }])
        .catch(() => {});

      toast.success(`Successfully sent ${copies} test label(s) to ${selectedPrinter}!`, {
        id: toastId,
      });
      onClose();
    } catch (err: any) {
      console.error("Test print failed:", err);
      toast.error(err?.message || "Failed to print test label", { id: toastId });
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle Standard Browser Print
  const handleBrowserPrint = async () => {
    setIsPrinting(true);
    try {
      const { widthMm, heightMm } = getEffectiveCanvasDimensions(template.settings);

      const baseCanvas = await renderLabelToCanvas(template, productData, undefined, false);
      const dataUrl = baseCanvas.toDataURL("image/png");

      const urls: string[] = [];
      const numCopies = Math.max(copies || 1, 1);
      for (let i = 0; i < numCopies; i++) {
        urls.push(dataUrl);
      }

      toast.info(`Chrome Print: Ensure Layout is Landscape & Margins are None`, {
        duration: 5000,
      });

      await printLabelsViaBrowser(urls, {
        widthMm,
        heightMm,
        title: `Test Print - ${template.name || "Label"}`,
      });
    } catch (err: any) {
      console.error("Browser print failed:", err);
      toast.error(err?.message || "Browser print failed");
    } finally {
      setIsPrinting(false);
    }
  };

  // Prepare printer dropdown options
  const printerOptions: SelectOption[] = printers.map((p) => {
    const isThermal = isThermalOrLabelPrinter(p);
    const detail = detailedPrinters.find(
      (d) => d.name && d.name.toLowerCase().trim() === p.toLowerCase().trim()
    );
    const isDefault = detail?.isDefault;

    let badge = "";
    if (isThermal) badge = " (Thermal)";
    else if (isDefault) badge = " (Default)";

    return {
      label: `${p}${badge}`,
      value: p,
    };
  });

  const currentOption =
    printerOptions.find((p) => p.value === selectedPrinter) ??
    (selectedPrinter ? { label: selectedPrinter, value: selectedPrinter } : null);

  const displayTitle = liveData?.title || template.name || "Test Label";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Test Print Label"
      size="lg"
    >
      <div className="flex flex-col space-y-5 text-[#0A0E1A]">
        {/* Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto relative">
            <span className="font-semibold text-slate-700 whitespace-nowrap">Testing SKU: </span>
            <div className="relative">
              <input
                type="text"
                value={skuInput}
                onChange={(e) => {
                  setSkuInput(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                placeholder="Search SKU..."
                className="font-mono bg-white px-2 py-1 border border-slate-300 rounded text-[#0A0E1A] font-bold focus:outline-none focus:border-[#E8C16D] focus:ring-1 focus:ring-[#E8C16D] transition-shadow w-full sm:w-[200px]"
              />
              {isDropdownOpen && (searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 mt-1 w-[300px] sm:w-[400px] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                  {isSearching ? (
                    <div className="p-3 flex items-center justify-center text-slate-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Searching...
                    </div>
                  ) : (
                    searchResults.map((p, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectProduct(p)}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div className="font-bold text-sm text-[#0A0E1A] truncate">{p.title}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs font-mono text-slate-500">SKU: {p.sku || p.masterSku}</span>
                          <span className="text-xs font-semibold text-[#B88728]">₹{p.mrp || 0}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <span className="text-slate-500 line-clamp-1 flex-1 min-w-[100px]">
              {displayTitle}
            </span>
          </div>
          <div className="text-slate-500 font-medium whitespace-nowrap">
            {template.settings.widthMm} × {template.settings.heightMm} mm ({template.settings.dpi || 203} DPI)
          </div>
        </div>

        {/* Live Canvas Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-100 rounded-lg border border-slate-200 min-h-[140px] relative overflow-hidden">
          {isRenderingPreview && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#E8C16D]" />
            </div>
          )}
          <div className="shadow-md bg-white border border-stone-300 p-1 rounded">
            <canvas
              ref={canvasRef}
              className="max-h-[160px] max-w-full object-contain mx-auto"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Exact render preview matching canvas elements and preview data.
          </p>
        </div>

        {/* PrintBridge Extension Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                helperStatus === "online"
                  ? "bg-green-500"
                  : helperStatus === "checking"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="font-medium text-slate-800">
              PrintBridge Extension:{" "}
              {helperStatus === "online"
                ? "Active (Ready for Silent Print)"
                : helperStatus === "checking"
                ? "Detecting Printers..."
                : helperStatus === "extension-missing"
                ? "Not Detected"
                : helperStatus === "no-printers"
                ? "No Printers Detected"
                : "Offline"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPrinters}
            disabled={helperStatus === "checking"}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${helperStatus === "checking" ? "animate-spin" : ""}`} />}
            className="text-xs h-8 px-2.5"
          >
            Refresh
          </Button>
        </div>

        {/* Extension Warning Banner */}
        {helperStatus === "extension-missing" && (
          <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>PrintBridge Extension Not Detected (Using Browser Print)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Browser Print વાપરતી વખતે ક્રોમ (Chrome) પ્રિન્ટ વિન્ડોમાં આ સેટિંગ્સ ખાસ ચેક કરો:
            </p>
            <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/70 text-[11px] font-medium space-y-1 text-slate-700">
              <div>• <strong>Layout:</strong> <span className="text-emerald-700 font-bold">Landscape (આડું)</span></div>
              <div>• <strong>Paper size:</strong> <span className="text-emerald-700 font-bold">{template.settings.widthMm} × {template.settings.heightMm} mm</span> (અથવા User Defined)</div>
              <div>• <strong>Margins:</strong> <span className="text-emerald-700 font-bold">None (ઝીરો માર્જિન)</span></div>
              <div>• <strong>Scale:</strong> <span className="text-emerald-700 font-bold">100% / Fit to printable area</span></div>
            </div>
          </div>
        )}

        {/* Printer Selection & Copies */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Target Printer
            </label>
            <ReactSelect
              menuPortalTarget={typeof window !== "undefined" ? document.body : undefined}
              options={printerOptions}
              value={currentOption}
              onChange={(opt) => setSelectedPrinter(opt?.value ?? "")}
              isDisabled={helperStatus !== "online" || printers.length === 0}
              placeholder={
                helperStatus === "checking"
                  ? "Detecting printers..."
                  : helperStatus !== "online"
                  ? "Extension offline (use Browser Print)"
                  : printers.length === 0
                  ? "No printers found"
                  : "Select a printer..."
              }
              borderRadius={6}
              height={42}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Copies
            </label>
            <div className="flex items-center border border-stone-300 rounded-md h-[42px] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setCopies((prev) => Math.max(1, prev - 1))}
                disabled={copies <= 1}
                className="w-10 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min={1}
                value={copies}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setCopies(Math.max(1, val));
                }}
                className="w-full text-center text-sm font-semibold text-[#0A0E1A] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCopies((prev) => prev + 1)}
                className="w-10 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPrinting}
            className="w-full sm:w-auto text-xs sm:text-sm h-10"
          >
            Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={handleBrowserPrint}
            disabled={isPrinting}
            leftIcon={isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs sm:text-sm h-10"
          >
            Browser Print (Default)
          </Button>

          <Button
            variant="primary"
            onClick={handleSilentPrint}
            disabled={isPrinting || helperStatus !== "online" || !selectedPrinter}
            leftIcon={isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            className="w-full sm:w-auto text-xs sm:text-sm h-10 bg-[#E8C16D] text-[#0A0E1A] hover:bg-[#d4ae5c] font-semibold"
          >
            Silent Print (Extension)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
