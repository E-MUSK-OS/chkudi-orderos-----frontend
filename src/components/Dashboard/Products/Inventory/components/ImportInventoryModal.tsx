"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

import { useImportInventory } from "../hooks/useInventories";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportInventoryModal({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);

  const { mutate, isPending } = useImportInventory();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (!droppedFile) return;

    const isExcel =
      droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls");

    if (!isExcel) {
      return;
    }

    setFile(droppedFile);
  };

  const handleUpload = () => {
    if (!file) return;

    mutate(file, {
      onSuccess: () => {
        setFile(null);
        onClose();
      },
    });
  };

  const handleClose = () => {
    if (isPending) return;

    setFile(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Inventory"
      description="Upload an Excel (.xlsx/.xls) file to update inventory."
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={handleUpload}
            loading={isPending}
            disabled={!file}
          >
            Import
          </Button>
        </div>
      }
    >
      <div className="space-y-4 px-5 py-5">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition
    ${
      isDragging
        ? "border-[#E8C16D] bg-[#E8C16D]/10 dark:border-[#F5C451] dark:bg-[#F5C451]/10"
        : "border-slate-300 hover:border-[#E8C16D] bg-slate-50/50 dark:border-white/20 dark:bg-[#0F1626] dark:hover:border-[#F5C451]"
    }`}
        >
          <Upload className="mb-3 h-8 w-8 text-slate-500 dark:text-[#F5C451]" />

          <p className="font-medium text-slate-800 dark:text-white">Drag & Drop Excel file here</p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            or Click to browse (.xlsx / .xls)
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".xlsx,.xls"
          onChange={(e) => {
            const selected = e.target.files?.[0];

            if (!selected) return;

            const isExcel =
              selected.name.endsWith(".xlsx") || selected.name.endsWith(".xls");

            if (!isExcel) return;

            setFile(selected);
          }}
        />

        {file && (
          <div className="rounded-md bg-slate-100 p-3 text-sm text-slate-900 dark:bg-white/[0.06] dark:text-white dark:border dark:border-white/[0.08]">
            <span className="font-medium">Selected File:</span>

            <div>{file.name}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
