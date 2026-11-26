"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth/auth.service";
import { STEP_UP_EVENT, setToken } from "@/utils/auth";

export default function StepUpAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolverRef = useRef<((token: string | null) => void) | null>(null);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ resolve?: (t: string | null) => void }>)?.detail;
      if (resolverRef.current) {
        resolverRef.current(null);
      }
      resolverRef.current = detail?.resolve || null;
      setPassword("");
      setIsOpen(true);
    };
    window.addEventListener(STEP_UP_EVENT, handleEvent);
    return () => window.removeEventListener(STEP_UP_EVENT, handleEvent);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setPassword("");
    if (resolverRef.current) {
      resolverRef.current(null);
      resolverRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await authService.stepUp(password);
      const freshToken = res?.data?.accessToken || null;
      if (freshToken) {
        setToken(freshToken);
      }
      toast.success("Identity verified");
      setIsOpen(false);
      setPassword("");
      if (resolverRef.current) {
        resolverRef.current(freshToken);
        resolverRef.current = null;
      }
    } catch (err: any) {
      toast.error(err?.message || "Incorrect password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#0F1626] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF9EC] text-[#B88728] dark:bg-[#F5C451]/15 dark:text-[#F5C451]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
                Confirm Your Password
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your session was restored via Remember Me. Re-enter your password for this sensitive action.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter current password"
              autoFocus
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#0B0F17] text-sm text-[#0A0E1A] dark:text-white outline-none focus:border-[#E8C16D] dark:focus:border-[#F5C451]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A0E1A] text-[#E8C16D] dark:bg-[#F5C451] dark:text-[#080B11] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Verifying..." : "Confirm & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
