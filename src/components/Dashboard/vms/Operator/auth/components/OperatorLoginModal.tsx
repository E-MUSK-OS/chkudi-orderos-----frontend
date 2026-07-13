"use client";

import React from "react";

import OperatorLoginForm from "./OperatorLoginForm";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OperatorLoginModalProps {
  open: boolean;
  onClose: () => void;
}

const OperatorLoginModal: React.FC<OperatorLoginModalProps> = ({
  open,
  onClose,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Prevent dialog from closing manually.
        // Dialog will close only after successful login.
      }}
    >
      <DialogContent
        className="max-w-[500px] px-10 py-10"
        showCloseButton={false}
        // onInteractOutside={(event) => {
        //   event.preventDefault();
        // }}
        // onEscapeKeyDown={(event) => {
        //   event.preventDefault();
        // }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Operator Login
          </DialogTitle>

          <p className="mt-2 text-center text-sm text-slate-500">
            Login to start barcode scanning and video recording.
          </p>
        </DialogHeader>

        <div className="mt-6">
          <OperatorLoginForm
            onSuccess={() => {
              onClose();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OperatorLoginModal;