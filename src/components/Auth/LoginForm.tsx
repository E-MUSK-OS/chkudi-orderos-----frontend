"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
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
    <div className="flex items-center justify-center bg-[#FCFBF9] px-8 py-14 lg:px-16 h-full">
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <span className="text-lg uppercase text-[#C89B3C]">OrderOS Access</span>
        <div className="mt-2 h-px w-30 bg-gradient-to-r from-[#C89B3C] to-transparent" />

        <h1 className="mt-5 font-heading text-4xl text-[#0A0E1A] uppercase">
          Welcome back
        </h1>

        <p className="mt-2 text-xl text-[#64748B]">
          Sign in to pick up where you left off.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-5">
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
                  className="text-slate-400 hover:text-[#C89B3C]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              {...register("password")}
              error={errors.password?.message}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-md text-[#64748B]">
              <input
                type="checkbox"
                {...register("remember")}
                className="
    h-4
    w-4
    border-[#E2E5EA]
    accent-[#E8C16D]
    focus:ring-[#E8C16D]/30
    cursor-pointer
  "
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-md font-medium text-[#0A0E1A] hover:text-[#C89B3C]"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            loading={isSubmitting}
            rightIcon={<span className="text-[#E8C16D]">→</span>}
          >
            Sign In
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
              Don&#39;t have an account?{" "}
              <Link
                href="/signup"
                className="
        font-semibold
        text-[#C89B3C]
        transition-colors
        duration-300
        hover:text-[#B88A2C]
      "
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
