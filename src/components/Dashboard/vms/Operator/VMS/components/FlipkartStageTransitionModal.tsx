"use client";

import React, { useEffect } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface FlipkartStageTransitionModalProps {
  open: boolean;
  message: string;
  stageName?: string;
  onClose: () => void;
}

export const FlipkartStageTransitionModal: React.FC<FlipkartStageTransitionModalProps> = ({
  open,
  message,
  stageName,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;

    // Strict 1-second auto-close
    const timer = setTimeout(() => {
      onClose();
    }, 1000);

    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#E8C16D] bg-white dark:bg-[#0F1626] p-6 sm:p-8 shadow-2xl text-center">
        {/* Top Glowing Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FDF2D1] to-[#FFF9EC] dark:from-[#251E11] dark:to-[#1A160E] border-2 border-[#E8C16D] shadow-md animate-bounce">
          <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Stage Name Badge */}
        {stageName && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E8C16D]/50 bg-[#FEFAEE] dark:bg-[#1A160E] px-3.5 py-1 text-xs font-bold text-[#6A4D1D] dark:text-[#E8C16D] mb-3">
            <span>Stage Completed</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        )}

        {/* Main Message */}
        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#0A0E1A] dark:text-white leading-snug">
          {message}
        </h3>

        {/* 1-Second Progress Animation Bar */}
        <div className="mt-6 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08] h-1.5">
          <div
            className="h-full bg-gradient-to-r from-[#E8C16D] to-[#F5C451] rounded-full"
            style={{
              animation: "vmsStageCountdown 1000ms linear forwards",
            }}
          />
        </div>

        <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          Continuing automatically in 1 second...
        </p>
      </div>

      <style jsx global>{`
        @keyframes vmsStageCountdown {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default FlipkartStageTransitionModal;
