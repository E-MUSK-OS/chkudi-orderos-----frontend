"use client";

import React from "react";
import OperatorLoginForm from "./OperatorLoginForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Account } from "../../../Admin/Account/types/account";

interface OperatorLoginModalProps {
  open: boolean;
  onClose: () => void;
}

const OperatorLoginModal: React.FC<OperatorLoginModalProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md overflow-hidden border border-[#E7E0D2] dark:border-white/[0.08] p-0 shadow-2xl !rounded-3xl sm:!rounded-[32px] bg-white dark:bg-[#0F1626]"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-[#0A0E1A] dark:bg-[#080B11] px-6 py-5 text-center">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-[#E8C16D] text-center">
            Operator Login
          </DialogTitle>

          <p className="mt-1 text-xs sm:text-sm text-slate-300 text-center">
            Login to start barcode scanning and video recording.
          </p>
        </DialogHeader>

        <div className="p-6 sm:p-7">
          <OperatorLoginForm
            onSuccess={(account: Account) => {
              localStorage.setItem(
                "selectedAccount",
                JSON.stringify(account),
              );

              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OperatorLoginModal;
