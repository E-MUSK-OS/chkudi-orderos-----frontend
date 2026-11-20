"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Crop,
  Check,
  Eye,
  Move,
  Sparkles,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { userManagementService } from "@/components/Dashboard/Settings/ManageUsers/services/userManagement.service";

interface ProfileImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string; // Object URL or remote image URL
  onSave: (uploadedUrl: string) => Promise<void> | void;
  userNames?: { firstName?: string; middleName?: string; lastName?: string; fullName?: string };
  email?: string;
  role?: string;
  phone?: string;
}

const CROP_SIZE = 280; // Visual editor square dimension (fits on mobile 360px+ comfortably)

export default function ProfileImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onSave,
  userNames,
  email,
  role = "USER",
  phone,
}: ProfileImageCropModalProps) {
  const [mounted, setMounted] = useState(false);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);

  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 3;

  // Compute base dimensions to match canvas coordinate system exactly
  const baseScale = imageObj
    ? Math.max(CROP_SIZE / imageObj.width, CROP_SIZE / imageObj.height)
    : 1;
  const baseWidth = imageObj ? imageObj.width * baseScale : CROP_SIZE;
  const baseHeight = imageObj ? imageObj.height * baseScale : CROP_SIZE;

  // Fit entire image inside the frame (contain)
  const handleFit = () => {
    if (!imageObj) return;
    const containScale = Math.min(CROP_SIZE / imageObj.width, CROP_SIZE / imageObj.height);
    const coverScale = Math.max(CROP_SIZE / imageObj.width, CROP_SIZE / imageObj.height);
    const fitZoom = parseFloat((containScale / coverScale).toFixed(2));
    setZoom(Math.max(MIN_ZOOM, fitZoom));
    setPan({ x: 0, y: 0 });
  };

  // Fill frame (100% cover)
  const handleFill = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute Full Name for live preview
  const fullName =
    userNames?.fullName ||
    [userNames?.firstName, userNames?.middleName, userNames?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "User Profile";

  // Initials for preview fallback
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "US";

  // Load image object whenever imageSrc changes
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
    img.onerror = () => {
      toast.error("Failed to load image for adjustment.");
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isUploading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isUploading, onClose]);

  // Render crop preview onto offscreen canvas and generate preview Data URL
  const renderCanvas = useCallback(
    (outputSize = 600): HTMLCanvasElement | null => {
      if (!imageObj) return null;

      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outputSize, outputSize);

      ctx.save();
      // Move to center of canvas
      ctx.translate(outputSize / 2, outputSize / 2);

      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Calculate scale - matches the DOM editor coordinate system
      const scaleMultiplier = outputSize / CROP_SIZE;
      const canvasBaseScale = Math.max(
        outputSize / imageObj.width,
        outputSize / imageObj.height
      );
      const effectiveScale = canvasBaseScale * zoom;

      // Draw image with pan and scale
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
    const canvas = renderCanvas(240);
    if (canvas) {
      setPreviewDataUrl(canvas.toDataURL("image/jpeg", 0.88));
    }
  }, [imageObj, zoom, rotation, pan, renderCanvas]);

  // Mouse Pan dragging handlers
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

  // Touch Pan dragging handlers (for mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel Zoom support (allows zooming out down to MIN_ZOOM)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((prev + delta).toFixed(2)))));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApplyAndUpload = async () => {
    const finalCanvas = renderCanvas(600);
    if (!finalCanvas) {
      toast.error("Failed to render adjusted image.");
      return;
    }

    setIsUploading(true);
    finalCanvas.toBlob(
      async (blob) => {
        if (!blob) {
          setIsUploading(false);
          toast.error("Failed to process image.");
          return;
        }

        try {
          const file = new File([blob], `avatar_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("accessToken") || ""
              : "";

          const parsedNames = {
            firstName: userNames?.firstName || fullName.split(" ")[0] || "",
            middleName: userNames?.middleName || "",
            lastName: userNames?.lastName || fullName.split(" ").slice(1).join(" ") || "",
          };

          const res = await userManagementService.uploadPhoto(file, token, parsedNames);
          const uploadedUrl = res?.secure_url || (res as any)?.nas_url || (res as any)?.url;

          if (uploadedUrl) {
            await onSave(uploadedUrl);
            onClose();
          } else {
            throw new Error("No photo URL returned from server.");
          }
        } catch (err: any) {
          console.error("Upload failed:", err);
          toast.error(err?.message || "Failed to upload photo.");
        } finally {
          setIsUploading(false);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-md select-none animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        e.stopPropagation();
        if (!isUploading) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl my-auto rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0B0F17] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#E7E0D2] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-2xs shrink-0">
              <Crop className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-[#0A0E1A] dark:text-white truncate">
                Adjust & Set Profile Photo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Drag to move, scroll or use slider to zoom, and preview live
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Cancel and Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left Column: Interactive Adjustment Viewport & Controls */}
          <div className="lg:col-span-7 flex flex-col items-center gap-3.5 w-full">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider self-start flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Move & Zoom Editor</span>
              <span className="text-[10px] text-slate-400 font-normal">(Drag to pan)</span>
            </div>

            {/* Interactive Crop Frame */}
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
              style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
              className={`relative rounded-3xl overflow-hidden border-2 border-[#E8C16D] shadow-inner select-none touch-none bg-slate-900 ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              {imageObj ? (
                <div
                  className="w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transition: isDragging ? "none" : "transform 0.08s ease-out",
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Adjustment Preview"
                    className="max-w-none pointer-events-none select-none"
                    style={{
                      width: `${baseWidth}px`,
                      height: `${baseHeight}px`,
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Loading image...
                </div>
              )}

              {/* Circular Avatar Framing Guide (Translucent Ring) */}
              <div className="absolute inset-0 pointer-events-none rounded-3xl border-2 border-white/20">
                <div className="w-full h-full rounded-full border border-dashed border-[#E8C16D]/60" />
              </div>

              {/* Grid 3x3 Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-white/10 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-white/10" />
                <div className="border-r border-white/10" />
                <div />
              </div>
            </div>

            {/* Zoom Slider & Controls */}
            <div className="w-full max-w-[320px] space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <ZoomIn size={12} className="text-[#B88728] dark:text-[#E8C16D]" />
                  Zoom Level
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E8C16D]/15 text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - 0.1).toFixed(2))))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Zoom Out (Down to 10%)"
                >
                  <ZoomOut size={15} />
                </button>

                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#E8C16D] cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + 0.1).toFixed(2))))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={15} />
                </button>
              </div>

              {/* Quick Preset Buttons: Fit, Fill, Rotate & Reset */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleFit}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Fit whole image inside circle"
                >
                  <Minimize2 size={12} className="text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Fit</span>
                </button>

                <button
                  type="button"
                  onClick={handleFill}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Fill 100% frame"
                >
                  <Maximize2 size={12} className="text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Fill</span>
                </button>

                <button
                  type="button"
                  onClick={handleRotate}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="Rotate 90 degrees"
                >
                  <RotateCw size={12} className="text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Rotate</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 transition cursor-pointer"
                  title="Reset zoom & position"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Contextual Previews */}
          <div className="lg:col-span-5 space-y-4 w-full">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
              <span>Live Previews</span>
            </div>

            {/* Preview on User Profile Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#080B11] p-3.5 sm:p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Cropped Preview Avatar */}
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 border-2 border-[#E8C16D] bg-slate-100 dark:bg-white/[0.04] shadow-xs">
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt="Card Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black text-sm bg-[#FFF9EC] text-[#B88728]">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-[#0A0E1A] dark:text-white truncate">
                      {fullName}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {email || "user@example.com"}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30">
                  {role}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E7E0D2]/60 dark:border-white/[0.06] text-xs">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active Account
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Profile Card</span>
              </div>
            </div>

            {/* Circular Avatar (Navbar) & Header Preview */}
            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/60 dark:bg-[#080B11] p-3.5 space-y-2.5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Display Sizes
              </span>

              <div className="flex items-center justify-around gap-3 pt-1">
                {/* Circular Avatar (Navbar) */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#E8C16D] shadow-xs">
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt="Circle Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-[#FFF9EC] text-[#B88728]">
                        {initials}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">Navbar</span>
                </div>

                {/* Medium Rounded Avatar (Profile Header) */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#E8C16D] shadow-xs">
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt="Rounded Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-[#FFF9EC] text-[#B88728]">
                        {initials}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">Header</span>
                </div>

                {/* Large Detail View Avatar */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-16 h-16 rounded-3xl overflow-hidden border-2 border-[#E8C16D] shadow-xs">
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt="Large Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-sm bg-[#FFF9EC] text-[#B88728]">
                        {initials}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-slate-400">Large Card</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#080B11] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="h-10 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyAndUpload}
            disabled={isUploading || !imageObj}
            className="h-10 px-5 sm:px-6 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#E8C16D] to-[#D4AF5A] hover:from-[#d4af5a] hover:to-[#B88728] text-[#0A0E1A] transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Saving to Profile...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Set Profile Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
