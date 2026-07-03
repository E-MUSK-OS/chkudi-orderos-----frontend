"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

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
        <span className="text-lg uppercase text-[#C89B3C]">
          Password Recovery
        </span>

        <div className="mt-2 h-px w-30 bg-gradient-to-r from-[#C89B3C] to-transparent" />

        <h1 className="mt-5 font-heading text-4xl uppercase text-[#0A0E1A]">
          Forgot Password
        </h1>

        <p className="mt-2 text-lg leading-7 text-[#64748B]">
          Enter your registered email address and we&#39;ll send you a 6-digit
          verification code.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
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
            rightIcon={<span className="text-[#E8C170]">→</span>}
          >
            Send OTP
          </Button>

          <div className="border-t border-[#E2E5EA] pt-6 text-center">
            <p className="text-lg text-[#64748B]">
              Remember your password?{" "}
              <Link
                href="/login"
                className="
                  font-semibold
                  text-[#C89B3C]
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
