"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import Button from "@/components/ui/Button";
import Link from "next/link";
import { Package } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth/auth.service";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];

    newOtp[index] = value;

    setOtp(newOtp);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData.getData("text").trim();

    if (!/^\d{6}$/.test(pasted)) return;

    const values = pasted.split("");

    setOtp(values);

    values.forEach((value, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index]!.value = value;
      }
    });

    inputRefs.current[5]?.focus();
  };

  useEffect(() => {
    if (timer === 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      const response = await authService.verifyOtp({
        email,
        otp: code,
        purpose: "EMAIL_VERIFICATION",
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

  const handleResendOtp = async () => {
    try {
      const response = await authService.sendOtp({
        email,
        purpose: "EMAIL_VERIFICATION",
      });

      toast.success(response.message);

      setTimer(60);
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
          Email Verification
        </span>

        <div className="mt-2 h-px w-20 sm:w-28 bg-gradient-to-r from-[#C89B3C] to-transparent dark:from-[#F5C451]" />

        <h1 className="mt-3.5 sm:mt-5 font-heading text-2xl sm:text-3xl lg:text-4xl uppercase text-[#0A0E1A] dark:text-white">
          Verify Your Email
        </h1>

        <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base leading-relaxed text-[#64748B] dark:text-slate-400">
          We&#39;ve sent a 6-digit verification code to
          <span className="font-semibold text-[#0A0E1A] dark:text-white"> {email}</span>
        </p>

        {/* Responsive OTP */}
        <div className="mt-6 sm:mt-8 flex justify-center items-center gap-1.5 sm:gap-2.5 md:gap-3 w-full">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete="one-time-code"
              className="
                h-11 w-10 sm:h-13 sm:w-12 md:h-15 md:w-14
                rounded-xl sm:rounded-2xl
                border
                border-[#E2E5EA]
                bg-white
                text-center
                text-lg sm:text-xl md:text-2xl
                font-semibold
                text-[#0A0E1A]
                shadow-xs
                outline-none
                transition-all
                duration-300
                hover:border-[#C89B3C]/40
                focus:border-[#C89B3C]
                focus:ring-4
                focus:ring-[#C89B3C]/10
                dark:border-white/[0.1]
                dark:bg-[#080B11]
                dark:text-slate-100
                dark:hover:border-[#F5C451]/50
                dark:focus:border-[#F5C451]
                dark:focus:ring-[#F5C451]/15
              "
            />
          ))}
        </div>

        <div className="mt-6 sm:mt-8">
          <Button
            type="button"
            onClick={handleVerify}
            rightIcon={<span className="text-[#E8C170] dark:text-[#080B11]">→</span>}
          >
            Verify Email
          </Button>
        </div>

        {/* Resend */}
        <div className="mt-6 sm:mt-8 text-center">
          {timer > 0 ? (
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
              Resend OTP in{" "}
              <span className="font-semibold text-[#C89B3C] dark:text-[#F5C451]">
                00:{timer.toString().padStart(2, "0")}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTimer(60);
                handleResendOtp();
              }}
              className="
                text-xs sm:text-sm font-semibold
                text-[#C89B3C]
                transition-colors
                hover:text-[#B88A2C]
                dark:text-[#F5C451]
                dark:hover:text-[#F5C451]/80
                cursor-pointer
              "
            >
              Resend OTP
            </button>
          )}
        </div>

        {/* Change Email */}
        <div className="mt-6 sm:mt-8 border-t border-[#E2E5EA] pt-5 sm:pt-6 text-center dark:border-white/[0.08]">
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-slate-400">
            Wrong email?
            <Link
              href="/signup"
              className="
                ml-2
                font-semibold
                text-[#C89B3C]
                transition-colors
                hover:text-[#B88A2C]
                dark:text-[#F5C451]
                dark:hover:text-[#F5C451]/80
              "
            >
              Change Email
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
