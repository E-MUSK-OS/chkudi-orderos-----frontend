"use client";

import Select, { GroupBase, Props, StylesConfig } from "react-select";

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
  borderRadius?: number;
  height?: number;
}

export default function ReactSelect({
  borderColor = "#E7E0D2",
  backgroundColor = "#ffffff",
  textColor = "#111827",
  placeholderColor = "#9CA3AF",
  menuBackgroundColor = "#ffffff",
  optionHoverColor = "#F8F5EE",
  optionSelectedColor = "#E8C16D",
  optionSelectedTextColor = "#111827",
  borderRadius = 0,
  height = 44,
  ...props
}: ReactSelectProps) {
  const styles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: height,
      height,
      borderRadius,
      borderColor: state.isFocused ? borderColor : borderColor,
      backgroundColor,
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": {
        borderColor,
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
      color: textColor,
    }),

    singleValue: (base) => ({
      ...base,
      color: textColor,
      fontSize: 14,
    }),

    placeholder: (base) => ({
      ...base,
      color: placeholderColor,
      fontSize: 14,
    }),

    indicatorSeparator: () => ({
      display: "none",
    }),

    dropdownIndicator: (base) => ({
      ...base,
      color: textColor,
      "&:hover": {
        color: textColor,
      },
    }),

    menu: (base) => ({
      ...base,
      backgroundColor: menuBackgroundColor,
      borderRadius,
      overflow: "hidden",
      zIndex: 100,
    }),

    option: (base, state) => ({
      ...base,
      cursor: "pointer",
      fontSize: 14,
      backgroundColor: state.isSelected
        ? optionSelectedColor
        : state.isFocused
          ? optionHoverColor
          : menuBackgroundColor,
      color: state.isSelected ? optionSelectedTextColor : textColor,
      "&:active": {
        backgroundColor: optionSelectedColor,
      },
    }),
  };

  return <Select styles={styles} isSearchable={false} {...props} />;
}
