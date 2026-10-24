"use client";

import React from "react";
import Modal from "@/components/ui/Modal";

interface OperatorModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const OperatorModal: React.FC<OperatorModalProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="pt-1">{children}</div>
    </Modal>
  );
};

export default OperatorModal;