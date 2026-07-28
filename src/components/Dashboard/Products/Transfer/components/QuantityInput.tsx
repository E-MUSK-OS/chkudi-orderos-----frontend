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
    <div className="inline-flex items-center overflow-hidden border border-slate-300 rounded-md">
      <button
        type="button"
        onClick={() => {
          if (value > 1) {
            onChange(value - 1);
          }
        }}
        className="border-r px-3 py-2 hover:bg-slate-100"
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
        className="border-l px-3 py-2 hover:bg-slate-100"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}