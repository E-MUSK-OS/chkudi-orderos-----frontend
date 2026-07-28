"use client";

import { Search } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProductSearchModal({
  open,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Product"
      size="2xl"
    >
      <div className="space-y-5 p-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <Input
            placeholder="Search Product / SKU..."
            className="pl-10"
          />
        </div>

        <div className="rounded-lg border">
          <div className="flex items-center justify-center py-16 text-slate-400">
            Products will appear here...
          </div>
        </div>
      </div>
    </Modal>
  );
}