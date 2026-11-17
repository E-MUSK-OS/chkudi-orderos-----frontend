"use client";

import React from "react";
import { UserCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface OperatorModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const OperatorModal: React.FC<OperatorModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={<UserCheck className="h-5 w-5" />}
      size="md"
    >
      <div className="pt-1">{children}</div>
    </Modal>
  );
};

export default OperatorModal;