"use client";

import React from "react";
import { Edit, Trash2 } from "lucide-react";

import { Account } from "../types/account";

interface Props {
  accounts: Account[];
  loading?: boolean;

  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const AccountTable: React.FC<Props> = ({
  accounts,
  loading = false,
  onEdit,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="border bg-white p-10 text-center">
        Loading accounts...
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="border bg-white p-10 text-center text-gray-500">
        No Accounts Found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border bg-white">
      <table className="min-w-full">
        <thead className="bg-[#0A0E1A] text-white">
          <tr>
            <th className="px-5 py-4 text-left text-lg">
              Account Name
            </th>

            <th className="px-5 py-4 text-center text-lg">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {accounts.map((account) => (
            <tr
              key={account.id}
              className="border-t hover:bg-gray-50"
            >
              <td className="px-5 py-4 font-medium">
                {account.accountName}
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(account)}
                    className="rounded-lg p-2 transition hover:bg-blue-100"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(account)}
                    className="rounded-lg p-2 transition hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountTable;