"use client";

import { useSyncExternalStore } from "react";
import Select, { GroupBase, Props, StylesConfig } from "react-select";
import { useTheme } from "@/providers/ThemeProvider";

export interface SelectOption {
  label: string;
  value: string;
}

interface ReactSelectProps extends Props<
  SelectOption,
  false,
  GroupBase<SelectOption>
> {
  borderColor?: string;
  backgroundColor?: string;
  textColor?: string;
  placeholderColor?: string;
  menuBackgroundColor?: string;
  optionHoverColor?: string;
  optionSelectedColor?: string;
  optionSelectedTextColor?: string;
  optionTextColor?: string;
  borderRadius?: number;
  height?: number;
}

const emptySubscribe = () => () => {};

export default function ReactSelect({
  borderColor,
  backgroundColor,
  textColor,
  placeholderColor,
  menuBackgroundColor,
  optionHoverColor,
  optionSelectedColor,
  optionSelectedTextColor,
  optionTextColor,
  borderRadius = 16,
  height = 44,
  ...props
}: ReactSelectProps) {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const resolvedBorderColor =
    borderColor ?? (isDark ? "rgba(255, 255, 255, 0.1)" : "#E7E0D2");
  const resolvedBgColor =
    backgroundColor ?? (isDark ? "#0F1626" : "#ffffff");
  const resolvedTextColor =
    textColor ?? (isDark ? "#F8FAFC" : "#111827");
  const resolvedPlaceholderColor =
    placeholderColor ?? (isDark ? "#64748B" : "#9CA3AF");
  const resolvedMenuBgColor =
    menuBackgroundColor ?? (isDark ? "#0F1626" : "#ffffff");
  const resolvedOptionHoverColor =
    optionHoverColor ?? (isDark ? "#131B2E" : "#F8F5EE");
  const resolvedOptionSelectedColor =
    optionSelectedColor ?? (isDark ? "#F5C451" : "#E8C16D");
  const resolvedOptionSelectedTextColor =
    optionSelectedTextColor ?? (isDark ? "#080B11" : "#111827");
  const resolvedOptionTextColor =
    optionTextColor ?? (isDark ? "#CBD5E1" : "#111827");

  if (!isMounted) {
    return (
      <div
        style={{ height, borderRadius }}
        className="w-full animate-pulse border border-[#E7E0D2] bg-slate-100 dark:border-white/[0.1] dark:bg-[#0F1626]"
      />
    );
  }

  const styles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: height,
      height,
      borderRadius,
      borderColor: resolvedBorderColor,
      backgroundColor: state.isDisabled
        ? isDark
          ? "#131B2E"
          : "#F3F4F6"
        : resolvedBgColor,
      boxShadow: "none",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      opacity: state.isDisabled ? 0.7 : 1,
      "&:hover": {
        borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : resolvedBorderColor,
      },
    }),

    valueContainer: (base) => ({
      ...base,
      height,
      padding: "0 14px",
    }),

    input: (base) => ({
      ...base,
      margin: 0,
      color: resolvedTextColor,
    }),

    singleValue: (base) => ({
      ...base,
      color: resolvedTextColor,
      fontSize: 14,
      fontWeight: 600,
    }),

    placeholder: (base) => ({
      ...base,
      color: resolvedPlaceholderColor,
      fontSize: 14,
    }),

    indicatorSeparator: () => ({
      display: "none",
    }),

    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? "#94A3B8" : resolvedTextColor,
      "&:hover": {
        color: isDark ? "#F5C451" : resolvedTextColor,
      },
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: resolvedMenuBgColor,
      borderRadius,
      overflow: "hidden",
      border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #E7E0D2",
      boxShadow: isDark
        ? "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)"
        : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      zIndex: 100,
    }),

    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),

    option: (base, state) => ({
      ...base,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: state.isSelected ? 600 : 500,
      backgroundColor: state.isSelected
        ? resolvedOptionSelectedColor
        : state.isFocused
          ? resolvedOptionHoverColor
          : resolvedMenuBgColor,
      color: state.isSelected
        ? resolvedOptionSelectedTextColor
        : resolvedOptionTextColor,
      "&:active": {
        backgroundColor: resolvedOptionSelectedColor,
      },
    }),
  };

  return (
    <Select
      aria-label="Select option"
      styles={styles}
      isSearchable={false}
      getOptionLabel={(option) =>
        option ? option.label ?? (option as any).name ?? "" : ""
      }
      getOptionValue={(option) =>
        option ? option.value ?? (option as any).id ?? "" : ""
      }
      {...props}
    />
  );
}
