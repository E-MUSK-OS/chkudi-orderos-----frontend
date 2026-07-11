import React from "react";

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
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Delete Operator?
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-red-600">
              {operatorName}
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
    </OperatorModal>
  );
};

export default DeleteOperatorModal;