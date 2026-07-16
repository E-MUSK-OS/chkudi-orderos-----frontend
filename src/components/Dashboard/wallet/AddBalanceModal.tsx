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
      <div className="w-full max-w-lg border border-[#E7E0D2] bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-[#E7E0D2] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A0E1A] text-white">
              <Wallet size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#0A0E1A]">
                Add Wallet Balance
              </h2>

              <p className="text-sm text-slate-500">
                Recharge your wallet securely.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}

        <div className="space-y-6 p-6">
          {/* Amount */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#0A0E1A]">
              Amount
            </label>

            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="h-12 w-full border border-[#E7E0D2] px-4 outline-none transition focus:border-[#C89B3C]"
            />
          </div>

          {/* Quick Amount */}

          <div>
            <p className="mb-3 text-sm font-semibold text-[#0A0E1A]">
              Quick Select
            </p>

            <div className="grid grid-cols-4 gap-3">
              {[100, 500, 1000, 5000].map((value) => (
                <button
                  key={value}
                  onClick={() => setAmount(String(value))}
                  className={`h-11 border text-sm font-semibold transition ${
                    Number(amount) === value
                      ? "border-[#C89B3C] bg-[#FFF8EB] text-[#C89B3C]"
                      : "border-[#E7E0D2] hover:border-[#C89B3C]"
                  }`}
                >
                  ₹{value}
                </button>
              ))}
            </div>
          </div>

          {/* Payment */}

          <div>
            <label className="mb-3 block text-sm font-semibold text-[#0A0E1A]">
              Payment Method
            </label>

            <div className="space-y-3">
              {paymentMethods.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center justify-between border border-[#E7E0D2] px-4 py-3 transition hover:border-[#C89B3C]"
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
            <label className="mb-2 block text-sm font-semibold text-[#0A0E1A]">
              Coupon Code (Optional)
            </label>

            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className="h-12 w-full border border-[#E7E0D2] px-4 outline-none transition focus:border-[#C89B3C]"
            />
          </div>
        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t border-[#E7E0D2] px-6 py-5">
          <button
            onClick={onClose}
            className="h-11 border border-[#E7E0D2] px-6 font-medium transition hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleContinue}
            className="h-11 bg-[#0A0E1A] px-6 font-semibold text-white transition hover:bg-[#161D2E]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
