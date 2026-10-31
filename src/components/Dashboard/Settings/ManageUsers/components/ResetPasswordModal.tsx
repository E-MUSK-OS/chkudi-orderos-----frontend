"use client";

import React, { useState } from "react";
import { KeyRound, X, Eye, EyeOff, Check } from "lucide-react";
import { useUpdateUser } from "../hooks/useManageUsers";
import { toast } from "sonner";

interface Props {
  userId: string;
  userName: string;
  open: boolean;
  onClose: () => void;
}

export default function ResetPasswordModal({ userId, userName, open, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const updateUserMutation = useUpdateUser();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        data: { password },
      });
      toast.success("Password reset successfully.");
      setPassword("");
      setConfirmPassword("");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E7E0D2] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] text-[#B88728] dark:text-[#E8C16D] border border-[#E8C16D]/30">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0A0E1A] dark:text-white">
                Reset Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set a new password for {userName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-5 space-y-4">
          {/* Trap for browser autofill */}
          <div style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
            <input type="text" name="trap_user" tabIndex={-1} autoComplete="off" defaultValue="" />
            <input type="password" name="trap_pass" tabIndex={-1} autoComplete="new-password" defaultValue="" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="one-time-code"
                data-lpignore="true"
                data-1p-ignore="true"
                data-form-type="other"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min 8 chars)"
                className="w-full h-11 px-3.5 pr-10 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0_1000px_#080B11_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:inherit]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="one-time-code"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full h-11 px-3.5 rounded-2xl text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] text-[#0A0E1A] dark:text-white focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 transition-all shadow-xs [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] dark:[&:-webkit-autofill]:shadow-[0_0_0_1000px_#080B11_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:inherit]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-5 rounded-2xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-800 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="min-h-[40px] px-6 rounded-2xl text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] cursor-pointer shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <Check size={16} />
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

