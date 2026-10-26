"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import Button from "@/components/ui/Button";
import AccountModal from "./AccountModal";

interface DeleteAccountModalProps {
  open: boolean;
  loading?: boolean;

  accountName?: string;

  onClose: () => void;
  onDelete: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  open,
  loading = false,
  accountName,
  onClose,
  onDelete,
}) => {
  return (
    <AccountModal
      open={open}
      onClose={onClose}
      title="Delete Account"
    >
      <div className="space-y-6 py-2">
        {/* Warning Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 shadow-xs">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Delete Account?
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-bold text-red-600 dark:text-red-400">
              {accountName}
            </span>
            ?
          </p>

          <div className="mx-auto max-w-xs rounded-xl border border-amber-200 dark:border-amber-900/40 bg-[#FFF9EC] dark:bg-amber-950/20 py-2 px-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Action Buttons Centered */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            fullWidth={false}
            onClick={onClose}
            disabled={loading}
            className="min-w-[130px] rounded-2xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            fullWidth={false}
            loading={loading}
            onClick={onDelete}
            leftIcon={<Trash2 size={16} />}
            className="min-w-[130px] rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200 dark:shadow-none"
          >
            Delete
          </Button>
        </div>
      </div>
    </AccountModal>
  );
};

export default DeleteAccountModal;