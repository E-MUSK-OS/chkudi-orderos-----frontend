"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Package } from "lucide-react";
import { motion } from "framer-motion";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, LoginFormData } from "@/lib/login-schema";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { authService } from "@/services/auth/auth.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      if (!response.success || !response.data) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);

      localStorage.setItem("accessToken", response.data.accessToken);

      localStorage.setItem("refreshToken", response.data.refreshToken);

      localStorage.setItem("user", JSON.stringify(response.data.user));

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center bg-[#FCFBF9] px-4 py-8 sm:px-8 sm:py-12 md:px-10 lg:px-12 xl:px-16 w-full h-full dark:bg-[#0F1626]">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md mx-auto"
      >
        {/* Mobile / Tablet Brand Header */}
        <div className="lg:hidden flex items-center justify-center gap-2.5 pb-4 mb-4 sm:pb-5 sm:mb-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C89B3C]/30 bg-[#C89B3C]/10 dark:border-[#F5C451]/30 dark:bg-[#F5C451]/10">
            <Package size={18} className="text-[#E8C170] dark:text-[#F5C451]" />
          </div>
          <span className="font-display text-lg sm:text-xl tracking-[2px] uppercase text-[#C89B3C] dark:text-[#F5C451] font-bold">
            Chakudee <span className="text-[#0A0E1A] dark:text-white">OrderOS</span>
          </span>
        </div>

        <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#C89B3C] dark:text-[#F5C451]">
          OrderOS Access
        </span>
        <div className="mt-2 h-px w-20 sm:w-28 bg-gradient-to-r from-[#C89B3C] to-transparent dark:from-[#F5C451]" />

        <h1 className="mt-3.5 sm:mt-5 font-heading text-[26px] uppercase text-[#0A0E1A] dark:text-white">
          Welcome back
        </h1>

        <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-[#64748B] dark:text-slate-400">
          Sign in to pick up where you left off.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
          <div>
            <Input
              label="Email Address"
              type="email"
              leftIcon={<Mail size={18} />}
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-[#C89B3C] dark:hover:text-[#F5C451] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              {...register("password")}
              error={errors.password?.message}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs sm:text-sm">
            <label className="flex items-center gap-2 text-[#64748B] dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("remember")}
                className="h-4 w-4 rounded border-[#E2E5EA] accent-[#E8C16D] focus:ring-[#E8C16D]/30 cursor-pointer dark:border-white/[0.2] dark:accent-[#F5C451]"
              />
              <span>Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="font-medium text-[#0A0E1A] hover:text-[#C89B3C] dark:text-slate-300 dark:hover:text-[#F5C451] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            rightIcon={<span className="text-[#0A0E1A] dark:text-[#080B11]">→</span>}
          >
            Sign In
          </Button>

          {/* Divider */}
          <div className="flex items-center pt-1">
            <div className="h-px flex-1 bg-[#E2E5EA] dark:bg-white/[0.08]" />
            <span className="mx-3 font-mono text-[11px] sm:text-xs uppercase tracking-wide text-[#94A3B8] dark:text-slate-500">
              or
            </span>
            <div className="h-px flex-1 bg-[#E2E5EA] dark:bg-white/[0.08]" />
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm md:text-base text-[#64748B] dark:text-slate-400">
              Don&#39;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-[#C89B3C] transition-colors duration-300 hover:text-[#B88A2C] dark:text-[#F5C451] dark:hover:text-[#F5C451]/80"
              >
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
