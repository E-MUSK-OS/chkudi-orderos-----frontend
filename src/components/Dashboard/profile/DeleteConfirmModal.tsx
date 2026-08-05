"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface DeleteConfirmModalProps {
  open: boolean;

  onClose: () => void;

  onConfirm: () => Promise<void> | void;

  title?: string;

  description?: string;

  loading?: boolean;
}

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,

  title = "Delete",

  description = "Are you sure you want to delete this item?",
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      description={description}
    >
      <div className="space-y-6 p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            fullWidth={false}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            loading={loading}
            fullWidth={false}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}