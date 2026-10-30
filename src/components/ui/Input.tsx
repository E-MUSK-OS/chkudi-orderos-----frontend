"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
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
      placeholder,

      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasValue =
      props.value !== undefined &&
      props.value !== null &&
      String(props.value).length > 0;

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
              dark:group-focus-within:text-[#F5C451]
            "
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            placeholder={
              floatingLabel && label
                ? placeholder || " "
                : placeholder
            }
            className={cn(
              `
              peer
              h-14
              w-full
              rounded-xl
              sm:rounded-2xl

              border
              border-slate-200
              dark:border-white/[0.1]

              bg-white
              dark:bg-[#0F1626]

              text-[15px]
              text-slate-900
              dark:text-slate-100

              shadow-2xs

              outline-none

              transition-all
              duration-300

              hover:border-slate-300
              dark:hover:border-white/[0.2]
              hover:shadow-xs

              focus:border-[#C89B3C]
              dark:focus:border-[#F5C451]
              focus:ring-4
              focus:ring-[#C89B3C]/10
              dark:focus:ring-[#F5C451]/15
            `,
              floatingLabel &&
                label &&
                "placeholder:text-transparent focus:placeholder:text-slate-400 dark:focus:placeholder:text-slate-500",
              leftIcon ? "pl-12" : "pl-4",
              rightIcon ? "pr-12" : "pr-4",
              inputClassName,
              className,
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
                z-10
                top-1/2
                -translate-y-1/2

                bg-white
                dark:bg-[#0F1626]

                px-1.5

                text-[15px]
                text-slate-400

                transition-all
                duration-200

                peer-focus:-top-2
                peer-focus:text-[11px]
                peer-focus:font-medium
                peer-focus:text-[#C89B3C]
                dark:peer-focus:text-[#F5C451]

                peer-[:not(:placeholder-shown)]:-top-2
                peer-[:not(:placeholder-shown)]:text-[11px]
                peer-[:not(:placeholder-shown)]:font-medium
                peer-[:not(:placeholder-shown)]:text-slate-500
                dark:peer-[:not(:placeholder-shown)]:text-slate-400
              `,
                hasValue && "-top-2 text-[11px] font-medium text-slate-500 dark:text-slate-400",
                leftIcon ? "left-12" : "left-4",
                labelClassName,
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
          <p className={cn("text-sm text-red-500", errorClassName)}>{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
