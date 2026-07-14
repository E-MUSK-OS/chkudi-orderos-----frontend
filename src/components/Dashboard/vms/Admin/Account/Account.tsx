"use client";

import React, { useEffect, useState } from "react";

import DashboardLayout from "../../../layout/DashboardLayout";

import Button from "@/components/ui/Button";

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
        {/* Header */}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Selling Accounts</h2>

            <p className="text-sm text-slate-500">
              Manage your selling accounts
            </p>
          </div>

          <Button fullWidth={false} onClick={() => setOpenCreate(true)}>
            + Add Account
          </Button>
        </div>

        {/* Summary */}

        <div className="border bg-[#0A0E1A] p-4">
          <p className="text-lg text-[#E8C16D]">Total Accounts</p>

          <h3 className="mt-1 text-2xl font-bold text-white">
            {accounts.length} / 5
          </h3>
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
