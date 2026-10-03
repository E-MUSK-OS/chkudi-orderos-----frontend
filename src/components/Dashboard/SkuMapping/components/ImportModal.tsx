"use client";

import { useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Upload,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useImportSkuMappings } from "../hooks/useSkuMappings";
import { downloadDemoSheet } from "../utils/skuExcelUtils";

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
      <DialogContent className="sm:max-w-xl p-0 !rounded-3xl sm:!rounded-[32px] overflow-hidden border border-[#E7E0D2] bg-white shadow-2xl">
        <DialogHeader className="bg-[#0A0E1A] px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-800 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-[#FFF9EC]/10 border border-[#E8C16D]/30 text-[#E8C16D] shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-[#E8C16D]" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-[#E8C16D]">
                  Import Godown Inventory
                </DialogTitle>
                <p className="text-xs text-slate-300 mt-0.5">
                  Bulk import or update SKU mappings via Excel (.xlsx / .xls)
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Demo Sheet banner */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8C16D]/40 bg-[#FFF9EC]/80 p-3 sm:p-3.5 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 text-slate-800 font-medium">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#0A0E1A] text-[#E8C16D] shrink-0">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <span>Need the exact format? Download our demo template.</span>
            </div>
            <button
              type="button"
              onClick={() => downloadDemoSheet()}
              className="inline-flex h-8 sm:h-8.5 items-center justify-center gap-1.5 rounded-xl border border-[#E8C16D] bg-white hover:bg-[#FFF9EC] px-3 text-xs font-bold text-[#0A0E1A] shadow-2xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
              title="Download sample template"
            >
              <Download size={13} className="text-[#B88728]" />
              <span>Demo Excel</span>
            </button>
          </div>

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
              cursor-pointer rounded-2xl sm:rounded-[24px] border-2 border-dashed
              p-7 sm:p-8 text-center transition-all
              ${
                dragging
                  ? "border-[#E8C16D] bg-[#FFF9EC]"
                  : "border-[#E7E0D2] bg-[#FAF8F5]/80 hover:border-[#E8C16D] hover:bg-[#FFF9EC]/40"
              }
            `}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF9EC] border border-[#E8C16D]/40 text-[#B88728] shadow-xs">
              <Upload size={24} />
            </div>

            <p className="text-sm sm:text-base font-bold text-[#0A0E1A]">
              Drag & Drop your Excel file
            </p>

            <p className="mt-1 text-xs text-slate-500">
              or click to browse from device
            </p>

            <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl border border-[#E7E0D2] bg-white px-3 py-1 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500">Supported:</span>
              <span className="rounded-md bg-[#0A0E1A] px-1.5 py-0.5 text-[10px] font-bold text-[#E8C16D]">.xlsx</span>
              <span className="rounded-md bg-[#0A0E1A] px-1.5 py-0.5 text-[10px] font-bold text-[#E8C16D]">.xls</span>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-2xl border border-[#E7E0D2] bg-[#FAF8F5] p-3.5 sm:p-4 shadow-xs">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF9EC] border border-[#E8C16D]/30 text-[#B88728]">
                  <FileSpreadsheet size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-bold text-[#0A0E1A]">
                    {file.name}
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition cursor-pointer"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 sm:h-12 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isPending || !file}
              className="flex-1 h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] text-xs sm:text-sm font-bold text-[#0A0E1A] transition shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#0A0E1A]" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Import Excel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}