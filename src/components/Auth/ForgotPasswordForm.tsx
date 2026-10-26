"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Package } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from "@/lib/forgot-password-schema";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { authService } from "@/services/auth/auth.service";
import { toast } from "sonner";

interface ForgotPasswordFormProps {
  onNext: () => void;
  setEmail: (email: string) => void;
}

export default function ForgotPasswordForm({
  onNext,
  setEmail,
}: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const response = await authService.forgotPassword({
        email: data.email,
      });

      toast.success(response.message);

      setEmail(data.email);

      onNext();
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
        initial={{
          opacity: 0,
          x: 20,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.4,
        }}
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
          Password Recovery
        </span>

        <div className="mt-2 h-px w-20 sm:w-28 bg-gradient-to-r from-[#C89B3C] to-transparent dark:from-[#F5C451]" />

        <h1 className="mt-3.5 sm:mt-5 font-heading text-2xl sm:text-3xl lg:text-4xl uppercase text-[#0A0E1A] dark:text-white">
          Forgot Password
        </h1>

        <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base leading-relaxed text-[#64748B] dark:text-slate-400">
          Enter your registered email address and we&#39;ll send you a 6-digit
          verification code.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 sm:mt-8 space-y-5 sm:space-y-6">
          <Input
            label="Email Address"
            type="email"
            leftIcon={<Mail size={18} />}
            {...register("email")}
            error={errors.email?.message}
          />

          <Button
            type="submit"
            loading={isSubmitting}
            rightIcon={<span className="text-[#E8C170] dark:text-[#080B11]">→</span>}
          >
            Send OTP
          </Button>

          <div className="border-t border-[#E2E5EA] pt-5 sm:pt-6 text-center dark:border-white/[0.08]">
            <p className="text-xs sm:text-sm md:text-base text-[#64748B] dark:text-slate-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="
                  font-semibold
                  text-[#C89B3C]
                  hover:text-[#B88A2C]
                  dark:text-[#F5C451]
                  dark:hover:text-[#F5C451]/80
                "
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
