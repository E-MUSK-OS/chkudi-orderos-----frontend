"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export default function QuantityInput({
  value,
  onChange,
  max,
}: Props) {
  const handleChange = (input: string) => {
    // Empty હોય તો allow કરવું
    if (input === "") {
      onChange(1);
      return;
    }

    const qty = Number(input);

    if (Number.isNaN(qty)) return;

    if (qty < 1) {
      onChange(1);
      return;
    }

    if (max && qty > max) {
      onChange(max);
      return;
    }

    onChange(qty);
  };

  return (
    <div className="inline-flex items-center overflow-hidden border border-slate-300 rounded-md dark:border-white/[0.08]">
      <button
        type="button"
        onClick={() => {
          if (value > 1) {
            onChange(value - 1);
          }
        }}
        className="border-r border-slate-300 px-3 py-2 hover:bg-slate-100 text-slate-700 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
      >
        <Minus size={14} />
      </button>

      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="
          w-16
          border-0
          text-center
          text-sm
          font-medium
          outline-none
          bg-transparent
          text-slate-900
          dark:text-white
          [appearance:textfield]
          [&::-webkit-inner-spin-button]:appearance-none
          [&::-webkit-outer-spin-button]:appearance-none
        "
      />

      <button
        type="button"
        onClick={() => {
          if (!max || value < max) {
            onChange(value + 1);
          }
        }}
        className="border-l border-slate-300 px-3 py-2 hover:bg-slate-100 text-slate-700 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}