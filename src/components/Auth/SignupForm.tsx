"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

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
    <div className="flex items-center justify-center bg-[#FCFBF9] px-8 py-14 lg:px-16 h-full">
      <motion.div
        initial={{
          opacity: 0,
          x: 40,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="w-full max-w-md"
      >
        {/* Header */}

        <span className="text-lg uppercase text-[#C89B3C]">Create Account</span>

        <div className="mt-2 h-px w-30 bg-gradient-to-r from-[#C89B3C] to-transparent" />

        <h1 className="mt-5 font-heading text-4xl uppercase text-[#0A0E1A]">
          Join OrderOS
        </h1>

        <p className="mt-2 text-xl text-[#64748B]">
          Create your account to start managing orders.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
          <div className="">
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
                className="text-slate-400 transition hover:text-[#C89B3C]"
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
                className="text-slate-400 transition hover:text-[#C89B3C]"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          {/* Terms */}

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              {...register("terms")}
              className="
                mt-1
                h-4
                w-4
                cursor-pointer
                accent-[#E8C16D]
              "
            />

            <p className="text-[15px] leading-6 text-[#64748B]">
              I agree to the{" "}
              <Link
                href="#"
                className="font-medium text-[#C89B3C] hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="font-medium text-[#C89B3C] hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>

          {errors.terms && (
            <p className="text-sm text-red-500">{errors.terms.message}</p>
          )}

          {/* Submit */}

          <Button
            type="submit"
            loading={isSubmitting}
            rightIcon={<span className="text-[#E8C170]">→</span>}
          >
            Create Account
          </Button>

          {/* Divider */}

          <div className="flex items-center pt-1">
            <div className="h-px flex-1 bg-[#E2E5EA]" />

            <span className="mx-3 font-mono text-xs uppercase tracking-wide text-[#94A3B8]">
              or
            </span>

            <div className="h-px flex-1 bg-[#E2E5EA]" />
          </div>

          <div className="mt-8 text-center">
            <p className="text-lg text-[#64748B]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="
                  font-semibold
                  text-[#C89B3C]
                  transition-colors
                  duration-300
                  hover:text-[#B88A2C]
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
