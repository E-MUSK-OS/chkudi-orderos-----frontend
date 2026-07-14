"use client";

import React from "react";

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
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Delete Account?
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-red-600">
              {accountName}
            </span>
            ?
          </p>

          <p className="mt-1 text-xs text-slate-400">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            loading={loading}
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </div>
    </AccountModal>
  );
};

export default DeleteAccountModal;