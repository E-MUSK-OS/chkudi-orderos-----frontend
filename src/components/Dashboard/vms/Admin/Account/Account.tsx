"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Plus, Store } from "lucide-react";

import DashboardLayout from "../../../layout/DashboardLayout";
import { useAccounts } from "./hooks/useAccounts";

import AccountTable from "./components/AccountTable";
import AccountModal from "./components/AccountModal";
import AccountForm from "./components/AccountForm";
import DeleteAccountModal from "./components/DeleteAccountModal";

import {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
} from "./types/account";

const AccountPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const {
    accounts,
    loading,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  } = useAccounts();

  const [openCreate, setOpenCreate] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const calculateHeight = useCallback(() => {
    const desktop = window.innerWidth >= 1024;
    setIsDesktop(desktop);
    if (!desktop) {
      setTargetHeight(null);
      setTableMaxHeight(null);
      return;
    }

    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    scrollContainer.scrollTop = 0;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      setTargetHeight(Math.floor(available));
      const headerHeight = headerCardRef.current?.offsetHeight || 90;
      const gap = 24; // gap-6
      const maxForTable = available - headerHeight - gap;
      if (maxForTable > 150) {
        setTableMaxHeight(Math.floor(maxForTable));
      }
    }
  }, []);

  useEffect(() => {
    calculateHeight();

    const timer = setTimeout(calculateHeight, 150);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (scrollContainer && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight]);

  // Lock outer scroll at header position on desktop:
  // Since this page only has Header Card + Table, the Header Card stays fixed at the top,
  // outer page does not scroll, and scrolling forwards to the internal table.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      scrollContainer.scrollTop = 0;

      const tableContainer = tableContainerRef.current;
      if (!tableContainer) return;

      // If wheel occurred over the header card or padding, scroll the table internally
      if (!e.composedPath().includes(tableContainer) && !tableContainer.contains(e.target as Node)) {
        tableContainer.scrollTop += e.deltaY;
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setOpenUpdate(true);
  };

  const handleDelete = (account: Account) => {
    setSelectedAccount(account);
    setOpenDelete(true);
  };

  const handleCreateAccount = async (data: CreateAccountPayload) => {
    await createAccount({
      accountName: data.accountName,
    });
    setOpenCreate(false);
  };

  const handleUpdateAccount = async (data: UpdateAccountPayload) => {
    if (!selectedAccount) return;
    await updateAccount(selectedAccount.id, data);
    setOpenUpdate(false);
    setSelectedAccount(null);
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    await deleteAccount(selectedAccount.id);
    setOpenDelete(false);
    setSelectedAccount(null);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <DashboardLayout title="Accounts">
      <div
        ref={containerRef}
        className="flex flex-col gap-6"
        style={{
          maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        }}
      >
        {/* Header Card (Matching Amazon Analytics UI) */}
        <div ref={headerCardRef} className="shrink-0 rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Selling Accounts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage your selling accounts
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto self-stretch md:self-center">
              <div
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8C16D] dark:border-[#E8C16D]/40 bg-[#FFF9EC] dark:bg-[#1A160E] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] dark:text-[#E8C16D] transition-all shadow-xs ring-2 ring-[#E8C16D]/30 w-full sm:w-auto min-h-[40px] sm:min-h-[44px]"
                title="Total Accounts"
              >
                <Store className="h-4 w-4 text-[#B88728] dark:text-[#E8C16D]" />
                <span>Total Accounts: {accounts.length} / 5</span>
              </div>

              <button
                type="button"
                onClick={() => setOpenCreate(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] active:scale-[0.98] cursor-pointer w-full sm:w-auto min-h-[40px] sm:min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>Add Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div
          className="flex flex-col min-h-0"
          style={{
            maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
          }}
        >
          <AccountTable
            accounts={accounts}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            tableContainerRef={tableContainerRef}
          />
        </div>

        {/* Create */}
        <AccountModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          title="Add Account"
        >
          <AccountForm
            mode="create"
            loading={loading}
            onSubmit={handleCreateAccount}
          />
        </AccountModal>

        {/* Update */}
        <AccountModal
          open={openUpdate}
          onClose={() => {
            setOpenUpdate(false);
            setSelectedAccount(null);
          }}
          title="Update Account"
        >
          <AccountForm
            mode="update"
            account={selectedAccount}
            loading={loading}
            onSubmit={handleUpdateAccount}
          />
        </AccountModal>

        {/* Delete */}
        <DeleteAccountModal
          open={openDelete}
          loading={loading}
          accountName={selectedAccount?.accountName}
          onClose={() => {
            setOpenDelete(false);
            setSelectedAccount(null);
          }}
          onDelete={handleDeleteAccount}
        />
      </div>
    </DashboardLayout>
  );
};

export default AccountPage;
