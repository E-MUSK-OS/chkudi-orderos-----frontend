"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import Button from "@/components/ui/Button";

import { authService } from "@/services/auth/auth.service";
import { toast } from "sonner";

interface ForgotPasswordOtpFormProps {
  email: string;
  onNext: (resetToken: string) => void;
}

export default function ForgotPasswordOtpForm({
  email,
  onNext,
}: ForgotPasswordOtpFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];

    newOtp[index] = value;

    setOtp(newOtp);

    if (value && index < 5) {
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

    const value = e.clipboardData.getData("text").trim();

    if (!/^\d{6}$/.test(value)) return;

    const values = value.split("");

    setOtp(values);

    values.forEach((digit, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index]!.value = digit;
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
      toast.error("Please enter valid OTP.");
      return;
    }

    try {
      const response = await authService.verifyOtp({
        email,
        otp: code,
        purpose: "FORGOT_PASSWORD",
      });

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);

      onNext(response.resetToken);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  const handleResend = async () => {
    try {
      const response = await authService.sendOtp({
        email,
        purpose: "FORGOT_PASSWORD",
      });

      toast.success(response.message);

      setTimer(60);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
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
        <span className="text-lg uppercase text-[#C89B3C]">
          OTP Verification
        </span>

        <div className="mt-2 h-px w-30 bg-gradient-to-r from-[#C89B3C] to-transparent" />

        <h1 className="mt-5 font-heading text-4xl uppercase text-[#0A0E1A]">
          Verify OTP
        </h1>

        <p className="mt-2 text-lg leading-7 text-[#64748B]">
          Enter the 6-digit verification code sent to your email.
        </p>

        <div className="mt-10 flex justify-between gap-3">
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
              maxLength={1}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="
                h-16
                w-16
                rounded-2xl
                border
                border-[#E2E5EA]
                bg-white
                text-center
                text-2xl
                font-semibold
                text-[#0A0E1A]
                shadow-sm
                outline-none
                transition
                hover:border-[#C89B3C]/40
                focus:border-[#C89B3C]
                focus:ring-4
                focus:ring-[#C89B3C]/10
              "
            />
          ))}
        </div>

        <div className="mt-10">
          <Button
            type="button"
            onClick={handleVerify}
            rightIcon={<span className="text-[#E8C170]">→</span>}
          >
            Verify OTP
          </Button>
        </div>

        <div className="mt-8 text-center">
          {timer > 0 ? (
            <p className="text-[15px] text-[#64748B]">
              Resend OTP in{" "}
              <span className="font-semibold text-[#C89B3C]">
                00:{timer.toString().padStart(2, "0")}
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="
    font-semibold
    text-[#C89B3C]
    hover:text-[#B88A2C]
  "
            >
              Resend OTP
            </button>
          )}
        </div>

        <div className="mt-8 border-t border-[#E2E5EA] pt-6 text-center">
          <p className="text-[15px] text-[#64748B]">
            Wrong email?
            <Link
              href="/forgot-password"
              className="
                ml-2
                font-semibold
                text-[#C89B3C]
                hover:text-[#B88A2C]
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
