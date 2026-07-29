"use client";

import { useRef, useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useImportSkuMappings } from "../hooks/useSkuMappings";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImportSkuMappingModal({
  open,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const { mutate, isPending } = useImportSkuMappings();

  const handleFile = (selected: File | null) => {
    if (!selected) return;

    const extension = selected.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension || "")) {
      toast.error("Please select a valid Excel file.");
      return;
    }

    setFile(selected);
  };

  const handleImport = () => {
    if (!file) {
      toast.error("Please select an Excel file.");
      return;
    }

    mutate(
      { file },
      {
        onSuccess: (response) => {
          toast.success(response.message);

          setFile(null);

          onClose();
        },

        onError: (error: Error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          setFile(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-xl px-10 py-5">

        <DialogHeader>
          <DialogTitle>
            Import SKU Mapping
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-5">

          <input
            ref={inputRef}
            hidden
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) =>
              handleFile(e.target.files?.[0] ?? null)
            }
          />

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);

              handleFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`
              cursor-pointer rounded-xl border-2 border-dashed
              p-8 text-center transition-all
              ${
                dragging
                  ? "border-[#C89B3C] bg-[#FFF8E7]"
                  : "border-slate-300 hover:border-[#C89B3C] hover:bg-slate-50"
              }
            `}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF8E7] text-[#C89B3C]">
              <Upload size={28} />
            </div>

            <p className="text-base font-semibold text-slate-800">
              Drag & Drop your Excel file
            </p>

            <p className="mt-1 text-sm text-slate-500">
              or click to browse
            </p>

            <p className="mt-3 text-xs text-slate-400">
              Supported: .xlsx, .xls
            </p>
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-4">
              <div className="flex items-center gap-3">

                <div className="rounded-lg bg-green-100 p-2 text-green-600">
                  <FileSpreadsheet size={22} />
                </div>

                <div>
                  <p className="font-medium text-slate-800">
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="rounded-md p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <Button
            onClick={handleImport}
            loading={isPending}
            className="w-full"
          >
            <Upload size={18} />

            Import Excel
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  );
}