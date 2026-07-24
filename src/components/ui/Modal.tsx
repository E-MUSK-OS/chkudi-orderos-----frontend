"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

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
      <DialogContent
        className={`
    ${sizeClasses[size]}
    w-[95vw]
    p-0
    overflow-hidden
    max-h-[90vh]
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
    px-6
    py-5
  "
          >
            {title && <DialogTitle>{title}</DialogTitle>}

            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        )}
        <div
          className="
    overflow-y-auto
    max-h-[calc(90vh-140px)]
    scrollbar-thin
    scrollbar-thumb-[#0A0E1A]
    scrollbar-track-transparent
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
      px-6
      py-4
    "
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
