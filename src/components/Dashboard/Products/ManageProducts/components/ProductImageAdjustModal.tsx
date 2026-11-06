"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Check,
  Move,
  Sparkles,
} from "lucide-react";

interface ProductImageAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  colorName: string;
  masterSku?: string;
  onConfirm: (file: File) => void;
  isUploading?: boolean;
}

const VIEWPORT_SIZE = 340; // Visual editor square dimension (px)

export default function ProductImageAdjustModal({
  isOpen,
  onClose,
  imageSrc,
  colorName,
  masterSku,
  onConfirm,
  isUploading = false,
}: ProductImageAdjustModalProps) {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");

  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Load image when imageSrc or isOpen changes
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Render crop preview onto offscreen canvas and return it
  const renderCanvas = useCallback(
    (outputSize = 800): HTMLCanvasElement | null => {
      if (!imageObj) return null;

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputSize, outputSize);

      ctx.save();
      // Move to center of canvas
      ctx.translate(outputSize / 2, outputSize / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Calculate scale
      const currentViewport = editorContainerRef.current?.clientWidth || VIEWPORT_SIZE;
      const scaleMultiplier = outputSize / currentViewport;
      const baseScale = Math.max(
        outputSize / imageObj.width,
        outputSize / imageObj.height
      );
      const effectiveScale = baseScale * zoom;

      ctx.scale(effectiveScale, effectiveScale);
      ctx.translate(
        (pan.x * scaleMultiplier) / effectiveScale,
        (pan.y * scaleMultiplier) / effectiveScale
      );

      ctx.drawImage(
        imageObj,
        -imageObj.width / 2,
        -imageObj.height / 2,
        imageObj.width,
        imageObj.height
      );

      ctx.restore();
      return canvas;
    },
    [imageObj, zoom, rotation, pan]
  );

  // Update live preview Data URL
  useEffect(() => {
    if (!imageObj) return;
    const canvas = renderCanvas(200);
    if (canvas) {
      setPreviewDataUrl(canvas.toDataURL("image/jpeg", 0.85));
    }
  }, [imageObj, zoom, rotation, pan, renderCanvas]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers for mobile/trackpad
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => {
      const step = 0.05;
      const next = e.deltaY < 0 ? prev + step : prev - step;
      return Math.min(4, Math.max(1, parseFloat(next.toFixed(2))));
    });
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleApply = () => {
    const canvas = renderCanvas(800);
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const cleanName = `${(masterSku || "product").replace(/[^a-zA-Z0-9_-]/g, "_")}-${colorName.toLowerCase()}.jpg`;
        const file = new File([blob], cleanName, { type: "image/jpeg" });
        onConfirm(file);
      },
      "image/jpeg",
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 dark:bg-[#F5C451]/15 dark:text-[#F5C451] dark:border-[#F5C451]/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0A0E1A] dark:text-white tracking-tight">
                Adjust & Crop Product Image
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Color: <span className="font-bold text-[#B88728] dark:text-[#F5C451]">{colorName}</span>
                {masterSku ? ` • SKU: ${masterSku}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5">
          {/* Main Visual Editor Area */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
            {/* Crop Viewport */}
            <div className="relative flex flex-col items-center">
              <div
                ref={editorContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                style={{ maxWidth: VIEWPORT_SIZE, maxHeight: VIEWPORT_SIZE }}
                className="relative overflow-hidden rounded-2xl border-2 border-[#E8C16D] dark:border-[#F5C451] bg-slate-900 shadow-inner select-none cursor-grab active:cursor-grabbing w-[270px] h-[270px] sm:w-[340px] sm:h-[340px] aspect-square"
              >
                {imageObj ? (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
                      transformOrigin: "center center",
                      transition: isDragging ? "none" : "transform 0.05s ease-out",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageSrc}
                      alt="Adjust target"
                      draggable={false}
                      className="max-w-none pointer-events-none"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Loading image...
                  </div>
                )}

                {/* Subtle rule of thirds grid overlay */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                {/* Center drag helper badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[11px] font-semibold text-white/90 pointer-events-none">
                  <Move size={12} className="text-[#E8C16D]" />
                  <span>Drag to pan • Scroll to zoom</span>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium text-center">
                Click & drag to reposition image inside the frame
              </p>
            </div>

            {/* Live Preview & Info Column */}
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Live Thumbnail Preview
                </p>
                <div className="flex items-center gap-3">
                  {/* Table-sized preview (48x48) */}
                  <div className="h-14 w-14 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04] p-0.5 shadow-xs overflow-hidden">
                    {previewDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewDataUrl}
                        alt="Table preview"
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-lg bg-slate-200 dark:bg-white/[0.06]" />
                    )}
                  </div>

                  {/* Medium preview (80x80) */}
                  <div className="h-20 w-20 rounded-2xl border-2 border-[#E8C16D]/50 dark:border-[#F5C451]/40 bg-slate-100 dark:bg-white/[0.04] p-1 shadow-sm overflow-hidden">
                    {previewDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewDataUrl}
                        alt="Card preview"
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-xl bg-slate-200 dark:bg-white/[0.06]" />
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  How it appears in the variants table
                </span>
              </div>

              {/* Quick Preset Tips */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-300 space-y-1 max-w-[220px]">
                <p className="font-bold text-[#0A0E1A] dark:text-white">Tips:</p>
                <p>• Zoom in to focus on product fabric & details</p>
                <p>• Center the product for consistent storefront view</p>
              </div>
            </div>
          </div>

          {/* Controls Bar: Zoom Slider, Rotate, Reset */}
          <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#0B0F17]/50 space-y-3">
            {/* Zoom Slider Row */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 shrink-0">
                Zoom
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, parseFloat((z - 0.1).toFixed(2))))}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131926] hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>

              <input
                type="range"
                min="1"
                max="4"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#B88728] dark:accent-[#F5C451]"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, parseFloat((z + 0.1).toFixed(2))))}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131926] hover:bg-slate-100 dark:hover:bg-white/[0.08] flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>

              <span className="text-xs font-mono font-bold text-[#B88728] dark:text-[#F5C451] w-12 text-right shrink-0">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotation & Reset Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  className="px-3 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131926] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Rotate Counter-Clockwise"
                >
                  <RotateCcw size={13} />
                  <span>Rotate -90°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="px-3 h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131926] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Rotate Clockwise"
                >
                  <RotateCw size={13} />
                  <span>Rotate +90°</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 h-8 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Reset adjustments"
              >
                <RefreshCw size={12} />
                <span>Reset All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-100 dark:border-white/[0.08] bg-[#FAF8F5] dark:bg-[#080B11]">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="w-full sm:w-auto h-10 px-5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#131926] dark:text-slate-200 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isUploading || !imageObj}
            className="w-full sm:w-auto h-10 px-6 rounded-xl text-xs sm:text-sm font-bold border border-[#E8C16D]/60 dark:border-transparent bg-[#FEFAEE] text-[#6A4D1D] hover:bg-[#FDF2D1] hover:border-[#E8C16D] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 dark:bg-[#F5C451] dark:text-black dark:hover:bg-[#e6b540] active:scale-[0.98] shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
          >
            {isUploading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Check size={16} />
                <span>Save & Apply Image</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

