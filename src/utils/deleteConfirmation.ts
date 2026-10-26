import Swal, { SweetAlertResult } from "sweetalert2";

interface ConfirmDeleteOptions {
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
}

export const showDeleteConfirmation = async ({
  title = "Delete Notification",
  text = "Are you sure you want to permanently delete this notification?",
  confirmText = "Delete",
  cancelText = "Cancel",
}: ConfirmDeleteOptions = {}): Promise<SweetAlertResult> => {
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return Swal.fire({
    html: `
      <div class="flex flex-col items-center text-center">
        <!-- Danger Icon Badge -->
        <div class="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200/80 shadow-xs dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25 dark:shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" x2="10" y1="11" y2="17"/>
            <line x1="14" x2="14" y1="11" y2="17"/>
          </svg>
        </div>

        <!-- Title -->
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0E1A] dark:text-white">
          ${title}
        </h2>

        <!-- Description -->
        <p class="mt-2.5 text-xs sm:text-sm leading-6 text-slate-500 dark:text-slate-400 max-w-sm">
          ${text}
        </p>

        <!-- Warning Alert Banner -->
        <div class="mt-5 flex w-full items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-left dark:border-amber-500/20 dark:bg-amber-500/10">
          <svg class="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p class="text-xs font-semibold text-amber-800 dark:text-amber-300">
              This action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    buttonsStyling: false,
    background: isDark ? "#0F1626" : "#ffffff",
    color: isDark ? "#ffffff" : "#0A0E1A",
    customClass: {
      popup:
        "!rounded-3xl !border !border-[#E7E0D2] !bg-white !p-6 sm:!p-8 !shadow-2xl dark:!border-white/[0.1] dark:!bg-[#0F1626] !max-w-md !w-full",
      htmlContainer: "!m-0 !p-0 !overflow-visible",
      actions:
        "!flex !items-center !justify-end !gap-3 !w-full !mt-6 !pt-4 !border-t !border-[#E7E0D2] dark:!border-white/[0.08]",
      cancelButton:
        "h-11 px-5 rounded-2xl border border-[#E2E5EA] bg-white text-[#0A0E1A] font-semibold text-sm hover:bg-[#F8F8F8] active:scale-[0.98] transition-all dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08] cursor-pointer",
      confirmButton:
        "h-11 px-6 rounded-2xl bg-red-600 text-white font-semibold text-sm shadow-sm hover:bg-red-700 active:scale-[0.98] transition-all dark:bg-rose-600 dark:hover:bg-rose-500 cursor-pointer",
    },
  });
};
