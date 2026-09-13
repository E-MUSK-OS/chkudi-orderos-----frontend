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
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  "2xl": "sm:max-w-5xl",
  "4xl": "sm:max-w-6xl",
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
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      {/* <DialogContent
        className={`
    ${sizeClasses[size]}
    w-[95vw]
    p-0
    overflow-hidden
    max-h-[90vh]
  `}
      > */}
      <DialogContent
        className={`
    ${sizeClasses[size]}
    w-[95vw]
    p-0
    overflow-hidden
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
    border-b
    bg-white
    px-4 sm:px-6
    py-3.5 sm:py-5
  "
          >
            {title && <DialogTitle className="text-lg sm:text-xl font-bold text-[#0A0E1A]">{title}</DialogTitle>}

            {description && (
              <DialogDescription className="text-xs sm:text-sm text-slate-500">{description}</DialogDescription>
            )}
          </DialogHeader>
        )}

        <div
          className="
    custom-scrollbar
    overflow-y-auto
    flex-1
    min-h-0
    px-4 sm:px-6
    py-4 sm:py-6
  "
        >
          {children}
        </div>

        {footer && (
          <div
            className="
      sticky
      bottom-0
      z-10
      border-t
      bg-white
      px-4 sm:px-6
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
