"use client";

import { X, Wallet } from "lucide-react";
import { useState } from "react";
import { walletService } from "./services/wallet.service";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const paymentMethods = [
  {
    label: "UPI",
    value: "upi",
  },
  {
    label: "Credit Card",
    value: "credit_card",
  },
  {
    label: "Debit Card",
    value: "debit_card",
  },
  {
    label: "Net Banking",
    value: "net_banking",
  },
];

export default function AddBalanceModal({ open, onClose }: Props) {
  const [amount, setAmount] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");

  if (!open) return null;

  const handleContinue = async () => {
    try {
      if (!amount || Number(amount) <= 0) {
        toast.error("Please enter a valid amount.");
        return;
      }

      const token = localStorage.getItem("accessToken") || "";

      const response = await walletService.creditWallet(token, {
        points: Number(amount),
        description: "Wallet Recharge",
      });

      toast.success(response.message);

      setAmount("");
      setCoupon("");
      setPaymentMethod("upi");

      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#E7E0D2] bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#0F1626]">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-[#E7E0D2] px-6 py-5 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FFF9EC] text-[#B88728] border border-[#E8C16D]/30 shrink-0 dark:bg-[#1A160E] dark:text-[#E8C16D]">
              <Wallet size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#0A0E1A] dark:text-white">
                Add Wallet Balance
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Recharge your wallet securely.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}

        <div className="space-y-6 p-6">
          {/* Amount */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0A0E1A] dark:text-slate-200">
              Amount
            </label>

            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-100 dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451]"
            />
          </div>

          {/* Quick Amount */}

          <div>
            <p className="mb-3 text-sm font-semibold text-[#0A0E1A] dark:text-slate-200">
              Quick Select
            </p>

            <div className="grid grid-cols-4 gap-3">
              {[100, 500, 1000, 5000].map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(String(value))}
                  className={`h-10 rounded-xl border text-sm font-semibold transition active:scale-[0.98] cursor-pointer ${
                    Number(amount) === value
                      ? "border-[#E8C16D] bg-[#FFF8EB] text-[#B88728] dark:border-[#F5C451] dark:bg-[#F5C451]/15 dark:text-[#F5C451]"
                      : "border-slate-200 bg-white hover:border-[#E8C16D] dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-slate-300 dark:hover:border-[#F5C451]/50"
                  }`}
                >
                  ₹{value}
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}

          <div>
            <label className="mb-3 block text-sm font-semibold text-[#0A0E1A] dark:text-slate-200">
              Payment Method
            </label>

            <div className="space-y-3">
              {paymentMethods.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E7E0D2] bg-white px-4 py-3 text-slate-800 transition hover:border-[#E8C16D] dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-slate-200 dark:hover:border-[#F5C451]/50"
                >
                  <span>{item.label}</span>

                  <input
                    type="radio"
                    checked={paymentMethod === item.value}
                    onChange={() => setPaymentMethod(item.value)}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Coupon */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0A0E1A] dark:text-slate-200">
              Coupon Code (Optional)
            </label>

            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition hover:border-[#E8C16D] focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-100 dark:hover:border-[#F5C451]/50 dark:focus:border-[#F5C451]"
            />
          </div>
        </div>

        {/* Footer */}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-[#E7E0D2] px-6 py-5 dark:border-white/[0.08]">
          <button
            onClick={onClose}
            className="h-11 w-full sm:w-auto rounded-2xl border border-slate-200 px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] dark:border-white/[0.1] dark:text-slate-300 dark:hover:bg-white/[0.05] cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleContinue}
            className="h-11 w-full sm:w-auto rounded-2xl border border-[#E8C16D]/60 bg-[#FEFAEE] px-6 text-sm font-bold text-[#6A4D1D] shadow-2xs transition hover:border-[#E8C16D] hover:bg-[#FDF2D1] hover:text-[#4A3514] ring-1 ring-[#E8C16D]/20 dark:ring-0 active:scale-[0.98] dark:border-transparent dark:bg-gradient-to-r dark:from-[#F5C451] dark:via-[#F3BD3C] dark:to-[#E5A827] dark:text-[#080B11] dark:shadow-[0_0_15px_rgba(245,196,81,0.25)] cursor-pointer"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
