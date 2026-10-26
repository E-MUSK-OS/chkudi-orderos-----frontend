"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";

interface ModalProps {
  open: boolean;
  onClose: () => void;

  title?: string;
  description?: string;

  children: React.ReactNode;

  size?: ModalSize;

  showHeader?: boolean;

  footer?: React.ReactNode;

  bodyClassName?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "w-full max-w-[calc(100vw-24px)] sm:max-w-md",
  md: "w-full max-w-[calc(100vw-24px)] sm:max-w-lg",
  lg: "w-full max-w-[calc(100vw-24px)] sm:max-w-2xl",
  xl: "w-full max-w-[calc(100vw-24px)] sm:max-w-4xl",
  "2xl": "w-full max-w-[calc(100vw-24px)] sm:max-w-5xl",
  "4xl": "w-full max-w-[calc(100vw-24px)] sm:max-w-6xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "lg",
  showHeader = true,
  footer,
  bodyClassName,
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent
        className={`
    ${sizeClasses[size]}
    w-[95vw] sm:w-[92vw] md:w-full
    p-0
    overflow-hidden
    !rounded-2xl sm:!rounded-[32px]
    border border-[#E7E0D2] dark:border-white/[0.1]
    bg-white dark:bg-[#0F1626]
    text-[#0A0E1A] dark:text-slate-100
    shadow-2xl
    max-h-[92dvh] sm:max-h-[90vh]
    flex
    flex-col
  `}
      >
        {showHeader && (
          <DialogHeader
            className="
    sticky
    top-0
    z-10
    border-b border-[#E7E0D2] dark:border-white/[0.08]
    bg-[#0A0E1A] dark:bg-[#080B11]
    px-4 sm:px-6
    py-3.5 sm:py-5
  "
          >
            {title && (
              <DialogTitle className="text-base sm:text-xl font-bold text-[#E8C16D] dark:text-[#F5C451]">
                {title}
              </DialogTitle>
            )}

            {description && (
              <DialogDescription className="text-xs sm:text-sm text-slate-300 dark:text-slate-400">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}

        <div
          className={`
    custom-scrollbar
    overflow-y-auto
    flex-1
    min-h-0
    px-3.5 sm:px-6
    py-3.5 sm:py-6
    ${bodyClassName || ""}
  `}
        >
          {children}
        </div>

        {footer && (
          <div
            className="
      sticky
      bottom-0
      z-10
      border-t border-[#E7E0D2] dark:border-white/[0.08]
      bg-white/95 dark:bg-[#0F1626]/95
      backdrop-blur-xs
      px-3.5 sm:px-6
      py-3 sm:py-4
    "
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
