"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Crop,
  Check,
  User as UserIcon,
  Mail,
  Phone,
  Eye,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { userManagementService } from "../services/userManagement.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string; // File URL (object URL or remote URL)
  onSave: (uploadedUrl: string) => void;
  userNames?: { firstName?: string; middleName?: string; lastName?: string };
  email?: string;
  role?: string;
  phone?: string;
}

const CROP_SIZE = 300; // Visual editor square dimension

export default function ProfileImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onSave,
  userNames,
  email,
  role = "USER",
  phone,
}: Props) {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Full name for preview
  const fullName = [userNames?.firstName, userNames?.middleName, userNames?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "User Name";

  // Initials for preview fallback
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

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
      toast.error("Failed to load image for editing.");
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Render crop preview onto offscreen canvas and generate preview Data URL
  const renderCanvas = useCallback(
    (outputSize = 600): HTMLCanvasElement | null => {
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
      const scaleMultiplier = outputSize / CROP_SIZE;
      const baseScale = Math.max(
        outputSize / imageObj.width,
        outputSize / imageObj.height
      );
      const effectiveScale = baseScale * zoom;

      // Draw image with pan and scale
      ctx.scale(effectiveScale, effectiveScale);
      ctx.translate(pan.x * scaleMultiplier / effectiveScale, pan.y * scaleMultiplier / effectiveScale);

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
      setPreviewDataUrl(canvas.toDataURL("image/jpeg", 0.85));
    }
  }, [imageObj, zoom, rotation, pan, renderCanvas]);

  // Pan dragging handlers
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
      toast.error("Failed to render final cropped image.");
      return;
    }

    setIsUploading(true);
    finalCanvas.toBlob(
      async (blob) => {
        if (!blob) {
          setIsUploading(false);
          toast.error("Failed to process image blob.");
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
          const res = await userManagementService.uploadPhoto(file, token, userNames);

          if (res?.secure_url) {
            onSave(res.secure_url);
            toast.success("Profile photo adjusted and saved successfully.");
            onClose();
          } else {
            throw new Error("No URL returned from server.");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl rounded-3xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0B0F17] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30 shadow-2xs">
              <Crop className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0A0E1A] dark:text-white">
                Edit & Preview Profile Photo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Drag to position, zoom, and see live previews before saving
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Crop Editor Canvas */}
          <div className="lg:col-span-7 flex flex-col items-center gap-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider self-start flex items-center gap-1.5">
              <span>Adjustment Viewport</span>
              <span className="text-[10px] text-slate-400">(Drag to Pan)</span>
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
              style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
              className={`relative rounded-3xl overflow-hidden border-2 border-[#E8C16D] shadow-inner bg-slate-900 select-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              {imageObj ? (
                <div
                  className="w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="Edit Canvas"
                    className="max-w-none pointer-events-none"
                    style={{
                      width: `${CROP_SIZE}px`,
                      height: "auto",
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                  Loading image...
                </div>
              )}

              {/* Crop Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-white/20 grid grid-cols-3 grid-rows-3">
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

            {/* Zoom & Rotation Controls Bar */}
            <div className="w-full max-w-[320px] space-y-3 pt-1">
              {/* Zoom Slider */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-[#E8C16D] cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              {/* Action Buttons: Rotate & Reset */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <RotateCw size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
                  <span>Rotate 90°</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 transition cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset View</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Contextual Previews */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Eye size={13} className="text-[#B88728] dark:text-[#E8C16D]" />
              <span>Live Profile Preview</span>
            </div>

            {/* 1. Preview on Actual User Profile Card */}
            <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#080B11] p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Cropped Preview Avatar */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04]">
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
                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                      ALL
                    </span>
                  </div>
                </div>

                <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
                  {role}
                </span>
              </div>

              {/* Info details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#E7E0D2]/60 dark:border-white/[0.06] text-[11px]">
                <div>
                  <span className="block text-[9px] font-semibold text-slate-400">Email</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                    {email || "user@example.com"}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-semibold text-slate-400">Mobile</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                    {phone || "—"}
                  </span>
                </div>
              </div>

              {/* Card Footer Status */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
                <span className="text-[10px] font-bold text-slate-400">User Card Preview</span>
              </div>
            </div>

            {/* 2. Circular Avatar Preview (Navbar / Chat) & Header Preview */}
            <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50 dark:bg-[#121826] p-3.5 space-y-3">
              <span className="block text-[11px] font-bold text-slate-500 uppercase">
                Different Avatar Formats
              </span>

              <div className="flex items-center gap-5">
                {/* Circular Avatar */}
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#E8C16D] shadow-xs">
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
                  <span className="text-[10px] font-medium text-slate-400">Navbar</span>
                </div>

                {/* Medium Rounded Avatar */}
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
                  <span className="text-[10px] font-medium text-slate-400">Detail View</span>
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
                  <span className="text-[10px] font-medium text-slate-400">Profile Header</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#080B11] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="h-10 px-5 rounded-2xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F17] text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyAndUpload}
            disabled={isUploading || !imageObj}
            className="h-10 px-6 rounded-2xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] transition shadow-xs cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <svg className="h-4 w-4 animate-spin text-current" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Saving Photo...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Apply & Save Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

