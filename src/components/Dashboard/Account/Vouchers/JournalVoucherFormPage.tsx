"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/Dashboard/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import JournalVoucherForm from "./components/JournalVoucherForm";
import { journalVoucherService } from "./services/journalVoucher.service";
import type { JournalVoucher } from "./types/journalVoucher.types";

interface JournalVoucherFormPageProps {
  mode: "create" | "edit" | "view";
  voucherId?: string;
}

const LIST_ROUTE = "/dashboard/account/vouchers/journal-vouchers";

export default function JournalVoucherFormPage({
  mode,
  voucherId,
}: JournalVoucherFormPageProps) {
  const router = useRouter();
  const [voucher, setVoucher] = useState<JournalVoucher | null>(null);
  const [loading, setLoading] = useState(mode !== "create");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!voucherId || mode === "create") return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const fetched = await journalVoucherService.getById(voucherId);
        if (active) setVoucher(fetched);
      } catch (err: any) {
        if (!active) return;
        toast.error(err?.response?.data?.message || "Failed to load journal voucher.");
        router.push(LIST_ROUTE);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [mode, voucherId, router]);

  const handleConfirmDelete = async () => {
    if (!voucher) return;
    try {
      setDeleting(true);
      await journalVoucherService.remove(voucher.id);
      toast.success(`Journal Voucher #${voucher.voucherNo} deleted.`);
      router.push(LIST_ROUTE);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete journal voucher.");
    } finally {
      setDeleting(false);
    }
  };

  const pageTitle =
    mode === "create"
      ? "Create Journal Voucher"
      : mode === "edit"
      ? "Edit Journal Voucher"
      : "View Journal Voucher";

  const pageDescription =
    mode === "create"
      ? "Record debit and credit journal voucher adjustments."
      : mode === "edit"
      ? "Update journal voucher debit/credit accounts and details."
      : "Review journal voucher entry details.";

  return (
    <DashboardLayout title={pageTitle}>
      <div className="flex flex-col gap-4 font-sans max-w-[1600px] mx-auto min-h-0">
        <section className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-6 lg:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => router.push(LIST_ROUTE)}
                title="Back to Journal Vouchers"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl sm:rounded-2xl border border-[#E8C16D]/60 dark:border-white/[0.15] bg-[#FEFAEE] dark:bg-[#080B11] text-[#6A4D1D] dark:text-[#E8C16D] hover:bg-[#FDF2D1] dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A] transition-all shadow-xs shrink-0 cursor-pointer mt-0.5"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div className="space-y-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-[26px] font-black font-heading tracking-tight text-[#0A0E1A] dark:text-white">
                  {pageTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {pageDescription}
                </p>
              </div>
            </div>

            {mode === "edit" && !loading && (
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="submit"
                  form="journal-voucher-form"
                  disabled={deleting}
                  className="inline-flex min-h-[38px] sm:h-11 items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] px-4 sm:px-6 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all cursor-pointer shadow-sm disabled:opacity-60"
                >
                  <Save className="h-4 w-4 stroke-[2.2]" />
                  <span>Update</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-16 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 text-sm text-[#8B7D65] dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading journal voucher...</span>
            </div>
          </div>
        ) : (
          <JournalVoucherForm
            mode={mode}
            initialVoucher={voucher}
            onCancel={() => router.push(LIST_ROUTE)}
            onDelete={mode === "edit" ? () => setDeleteOpen(true) : undefined}
            deleting={deleting}
            onSaved={() => {
              toast.success(
                mode === "edit"
                  ? "Journal voucher updated successfully."
                  : "Journal voucher created successfully."
              );
              router.push(LIST_ROUTE);
            }}
          />
        )}
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Delete Journal Voucher"
        description={`Are you sure you want to delete J.V. #${voucher?.voucherNo}?`}
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="h-9 px-4 rounded-xl text-xs font-medium border border-[#E7E0D2] dark:border-white/[0.12] text-[#0A0E1A] dark:text-slate-200 hover:bg-[#F7F5F0] dark:hover:bg-white/[0.06]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete
            </button>
          </div>
        }
      >
        <p className="text-xs text-[#6B7280] dark:text-slate-400">
          This journal voucher will be archived safely from your active register.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
