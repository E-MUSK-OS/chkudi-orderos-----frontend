"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

import { User, Mail, Lock, Eye, EyeOff, Package } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { signupSchema, SignupFormData } from "@/lib/signup-schema";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { authService } from "@/services/auth/auth.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),

    defaultValues: {
      terms: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      const signupResponse = await authService.signup({
        fullName: data.firstName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      const otpResponse = await authService.sendOtp({
        email: data.email,
        purpose: "EMAIL_VERIFICATION",
      });

      toast.success(otpResponse.message);

      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center bg-[#FCFBF9] px-4 py-6 sm:px-8 sm:py-8 md:px-10 lg:px-12 xl:px-16 w-full h-full dark:bg-[#0F1626]">
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
        <div className="lg:hidden flex items-center justify-center gap-2.5 pb-3.5 mb-3.5 sm:pb-4 sm:mb-4 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C89B3C]/30 bg-[#C89B3C]/10 dark:border-[#F5C451]/30 dark:bg-[#F5C451]/10">
            <Package size={18} className="text-[#E8C170] dark:text-[#F5C451]" />
          </div>
          <span className="font-display text-lg sm:text-xl tracking-[2px] uppercase text-[#C89B3C] dark:text-[#F5C451] font-bold">
            Chakudee <span className="text-[#0A0E1A] dark:text-white">OrderOS</span>
          </span>
        </div>

        {/* Header */}
        <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#C89B3C] dark:text-[#F5C451]">
          Create Account
        </span>

        <div className="mt-2 h-px w-20 sm:w-28 bg-gradient-to-r from-[#C89B3C] to-transparent dark:from-[#F5C451]" />

        <h1 className="mt-3.5 sm:mt-5 font-heading text-[26px] uppercase text-[#0A0E1A] dark:text-white">
          Join OrderOS
        </h1>

        <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base text-[#64748B] dark:text-slate-400">
          Create your account to start managing orders.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 sm:mt-7 space-y-3.5 sm:space-y-4">
          <div>
            <Input
              label="Full Name"
              leftIcon={<User size={18} />}
              {...register("firstName")}
              error={errors.firstName?.message}
            />
          </div>

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            leftIcon={<Mail size={18} />}
            {...register("email")}
            error={errors.email?.message}
          />

          {/* Password */}
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 transition hover:text-[#C89B3C] dark:hover:text-[#F5C451]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register("password")}
            error={errors.password?.message}
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 transition hover:text-[#C89B3C] dark:hover:text-[#F5C451]"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          {/* Terms */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              {...register("terms")}
              className="
                mt-1
                h-4
                w-4
                shrink-0
                cursor-pointer
                accent-[#E8C16D]
                dark:border-white/[0.2]
                dark:accent-[#F5C451]
              "
            />

            <p className="text-xs sm:text-sm leading-5 sm:leading-6 text-[#64748B] dark:text-slate-400">
              I agree to the{" "}
              <Link
                href="#"
                className="font-medium text-[#C89B3C] hover:underline dark:text-[#F5C451]"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="font-medium text-[#C89B3C] hover:underline dark:text-[#F5C451]"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          {errors.terms && (
            <p className="text-xs sm:text-sm text-red-500">{errors.terms.message}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            loading={isSubmitting}
            rightIcon={<span className="text-[#E8C170] dark:text-[#080B11]">→</span>}
          >
            Create Account
          </Button>

          {/* Divider */}
          <div className="flex items-center pt-1">
            <div className="h-px flex-1 bg-[#E2E5EA] dark:bg-white/[0.08]" />

            <span className="mx-3 font-mono text-[11px] sm:text-xs uppercase tracking-wide text-[#94A3B8] dark:text-slate-500">
              or
            </span>

            <div className="h-px flex-1 bg-[#E2E5EA] dark:bg-white/[0.08]" />
          </div>

          <div className="mt-5 sm:mt-7 text-center">
            <p className="text-xs sm:text-sm md:text-base text-[#64748B] dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="
                  font-semibold
                  text-[#C89B3C]
                  transition-colors
                  duration-300
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
