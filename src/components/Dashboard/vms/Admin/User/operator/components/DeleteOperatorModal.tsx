"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

import Button from "@/components/ui/Button";
import OperatorModal from "./OperatorModal";

interface DeleteOperatorModalProps {
  open: boolean;
  loading?: boolean;

  operatorName?: string;

  onClose: () => void;
  onDelete: () => void;
}

const DeleteOperatorModal: React.FC<DeleteOperatorModalProps> = ({
  open,
  loading = false,
  operatorName,
  onClose,
  onDelete,
}) => {
  return (
    <OperatorModal
      open={open}
      onClose={onClose}
      title="Delete Operator"
    >
      <div className="space-y-6 py-2">
        {/* Warning Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-200 shadow-xs">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-900">
            Delete Operator?
          </h3>

          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-bold text-red-600">
              {operatorName}
            </span>
            ?
          </p>

          <div className="mx-auto max-w-xs rounded-xl border border-amber-200 bg-[#FFF9EC] py-2 px-3">
            <p className="text-xs font-semibold text-amber-800">
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
            className="min-w-[130px] rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50"
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
            className="min-w-[130px] rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200"
          >
            Delete
          </Button>
        </div>
      </div>
    </OperatorModal>
  );
};

export default DeleteOperatorModal;