"use client";

import React, { useEffect, useState } from "react";
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
      <div className="space-y-6">
        {/* Header Card (Matching Amazon Analytics UI) */}
        <div className="rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0A0E1A] dark:text-white">
                Selling Accounts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                Manage your selling accounts
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
              <div
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E8C16D] bg-[#FFF9EC] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs ring-2 ring-[#E8C16D]/30"
                title="Total Accounts"
              >
                <Store className="h-4 w-4 text-[#B88728]" />
                <span>Total Accounts: {accounts.length} / 5</span>
              </div>

              <button
                type="button"
                onClick={() => setOpenCreate(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-transparent bg-[#E8C16D] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all shadow-xs hover:bg-[#d4af5a] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <AccountTable
          accounts={accounts}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

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
