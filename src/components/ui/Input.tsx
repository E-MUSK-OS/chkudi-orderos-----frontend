"use client";

import {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useId,
} from "react";
import { cn } from "@/lib/utils";

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;

  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;

  floatingLabel?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,

      leftIcon,
      rightIcon,

      floatingLabel = true,

      className,
      containerClassName,
      inputClassName,
      labelClassName,
      errorClassName,

      id,

      ...props
    },
    ref
  ) => {
    const inputId = id || useId();

    return (
      <div className={cn("space-y-2", containerClassName)}>
        <div className="relative group">
          {leftIcon && (
            <div
              className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-slate-400
              transition-colors
              group-focus-within:text-[#C89B3C]
            "
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            placeholder={floatingLabel ? " " : props.placeholder}
            className={cn(
              `
              peer
              h-14
              w-full

              border
              border-slate-200

              bg-white

              pl-12
              pr-12
              pt-3

              text-[15px]
              text-slate-900

              shadow-sm

              outline-none

              transition-all
              duration-300

              hover:border-slate-300
              hover:shadow-md

              focus:border-[#C89B3C]
              focus:ring-4
              focus:ring-[#C89B3C]/10
            `,
              inputClassName,
              className
            )}
            {...props}
          />

          {floatingLabel && label && (
            <label
              htmlFor={inputId}
              className={cn(
                `
                pointer-events-none

                absolute

                left-12

                top-1/2

                -translate-y-1/2

                bg-white

                px-1

                text-[15px]

                text-slate-400

                transition-all
                duration-200

                peer-focus:-top-0
                peer-focus:text-[15px]
                peer-focus:text-[#C89B3C]

                peer-[:not(:placeholder-shown)]:-top-1
                peer-[:not(:placeholder-shown)]:text-[11px]
                peer-[:not(:placeholder-shown)]:text-slate-500
              `,
                labelClassName
              )}
            >
              {label}
            </label>
          )}

          {rightIcon && (
            <div
              className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
            "
            >
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            className={cn(
              "text-sm text-red-500",
              errorClassName
            )}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;