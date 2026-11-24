"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export interface CopyButtonProps {
  text?: string | number | null;
  className?: string;
  iconClassName?: string;
  title?: string;
  toastMessage?: string;
}

export default function CopyButton({
  text,
  className = "",
  iconClassName = "h-3 w-3",
  title = "Copy",
  toastMessage,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  if (text === undefined || text === null) {
    return null;
  }

  const rawVal = String(text).trim();
  if (
    !rawVal ||
    rawVal === "-" ||
    rawVal === "—" ||
    rawVal === "--" ||
    rawVal === "N/A" ||
    rawVal === "Not assigned" ||
    rawVal.toLowerCase() === "not found in pdf" ||
    rawVal.toLowerCase() === "not found in zpl"
  ) {
    return null;
  }

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(rawVal);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = rawVal;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      const msg = toastMessage || `Copied "${rawVal}" to clipboard`;
      toast.success(msg, { duration: 1500 });

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0 ${className}`}
      title={copied ? "Copied!" : title}
      aria-label={title}
    >
      {copied ? (
        <Check className={`${iconClassName} text-emerald-600 dark:text-emerald-400`} />
      ) : (
        <Copy className={iconClassName} />
      )}
    </button>
  );
}
