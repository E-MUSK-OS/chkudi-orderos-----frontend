"use client";

import Modal from "@/components/ui/Modal";

import TransferForm from "./TransferForm";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateTransferModal({
  open,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Stock Transfer"
      size="4xl"
    >
      <TransferForm onClose={onClose} />
    </Modal>
  );
}