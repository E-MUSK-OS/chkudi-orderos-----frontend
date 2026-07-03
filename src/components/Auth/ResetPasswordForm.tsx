"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  resetPasswordSchema,
  ResetPasswordFormData,
} from "@/lib/reset-password-schema";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { authService } from "@/services/auth/auth.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ResetPasswordFormProps {
  resetToken: string;
}

export default function ResetPasswordForm({
  resetToken,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const response = await authService.resetPassword({
        resetToken,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      });

      toast.success(response.message);

      router.push("/login");
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
        <span className="text-lg uppercase text-[#C89B3C]">Password Reset</span>

        <div className="mt-2 h-px w-30 bg-gradient-to-r from-[#C89B3C] to-transparent" />

        <h1 className="mt-5 font-heading text-4xl uppercase text-[#0A0E1A]">
          Create New Password
        </h1>

        <p className="mt-2 text-lg leading-7 text-[#64748B]">
          Your new password must be different from your previous password.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
          {/* Password */}

          <Input
            label="New Password"
            type={showPassword ? "text" : "password"}
            leftIcon={<Lock size={18} />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-[#C89B3C]"
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
                className="text-slate-400 hover:text-[#C89B3C]"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            loading={isSubmitting}
            rightIcon={<span className="text-[#E8C170]">→</span>}
          >
            Reset Password
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
