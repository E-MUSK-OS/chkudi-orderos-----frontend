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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-full cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 transition hover:border-primary"
        >
          <Upload className="mb-3 h-8 w-8 text-slate-500" />

          <p className="font-medium">Click to select Excel file</p>

          <p className="mt-1 text-sm text-slate-500">.xlsx or .xls</p>
        </button>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".xlsx,.xls"
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null;

            setFile(selected);
          }}
        />

        {file && (
          <div className="rounded-md bg-slate-100 p-3 text-sm">
            <span className="font-medium">Selected File:</span>

            <div>{file.name}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}
