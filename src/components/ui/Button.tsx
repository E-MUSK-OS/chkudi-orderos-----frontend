"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;

  loading?: boolean;

  fullWidth?: boolean;

  leftIcon?: ReactNode;

  rightIcon?: ReactNode;

  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";

  size?: "sm" | "md" | "lg" | "icon";

  rounded?: string;

  className?: string;
}

export default function Button({
  children,

  loading = false,

  fullWidth = true,

  leftIcon,

  rightIcon,

  variant = "primary",

  size = "md",

  rounded = "rounded-xl",

  className,

  disabled,

  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[#0A0E1A] text-white hover:bg-[#161D2E]",

    secondary: "bg-[#E8C16D] text-black hover:bg-[#ddb75d]",

    outline:
      "border border-[#E2E5EA] bg-white text-[#0A0E1A] hover:bg-[#F8F8F8]",

    ghost: "bg-transparent text-[#0A0E1A] hover:bg-[#F3F4F6]",

    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "h-10 px-4 text-sm",

    md: "h-14 px-6 text-[15px]",

    lg: "h-16 px-8 text-lg",

    icon: "h-10 w-10 p-0",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        `
        group
        relative
        overflow-hidden
        cursor-pointer

        flex
        items-center
        justify-center
        gap-2

        font-semibold

        transition-all

        duration-300

        disabled:opacity-60

        disabled:cursor-not-allowed
      `,
        variants[variant],

        sizes[size],

        // rounded,

        fullWidth && "w-full",

        className,
      )}
      {...props}
    >
      {/* Shine */}

      <span
        className="
        pointer-events-none

        absolute

        inset-y-0

        -left-full

        w-1/2

        -skew-x-12

        bg-gradient-to-r

        from-transparent

        via-white/20

        to-transparent

        transition-all

        duration-700

        group-hover:left-full
      "
      />

      {loading ? (
        <>
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              opacity=".3"
            />

            <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {leftIcon}

          {children}

          {rightIcon}
        </>
      )}
    </button>
  );
}
