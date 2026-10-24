"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Edit, Trash2, Store } from "lucide-react";
import { Account } from "../types/account";
import Pagination from "@/components/ui/Pagination";

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const total = accounts.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = total === 0 ? 0 : (page - 1) * limit;

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginatedAccounts = useMemo(() => {
    return accounts.slice(startIndex, startIndex + limit);
  }, [accounts, startIndex, limit]);

  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-12 text-center shadow-sm">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E8C16D] border-t-transparent mx-auto mb-2" />
        <p className="text-sm font-bold text-[#0A0E1A]">Loading accounts...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-12 text-center shadow-sm">
        <div className="mb-2 mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF9EC] border border-[#E8C16D]/30">
          <Store className="h-7 w-7 text-[#B88728]" />
        </div>
        <p className="text-base font-bold text-[#0A0E1A]">No Accounts Found</p>
      </div>
    );
  }

  return (
    <div className="border border-[#E7E0D2] bg-white shadow-sm overflow-hidden rounded-2xl sm:rounded-3xl flex flex-col justify-between">
      <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[600px] border-collapse text-left font-sans">
          <thead className="bg-[#0A0E1A] text-xs sm:text-sm font-semibold tracking-wider text-[#E8C16D] border-b border-[#E7E0D2]">
            <tr>
              <th className="px-5 py-3.5 sm:py-4 text-left font-semibold">
                Account Name
              </th>
              <th className="px-5 py-3.5 sm:py-4 text-center font-semibold w-32">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E7E0D2] bg-white text-xs sm:text-sm font-sans">
            {paginatedAccounts.map((account) => (
              <tr key={account.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 sm:py-4 font-semibold text-slate-900">
                  {account.accountName}
                </td>

                <td className="px-5 py-3.5 sm:py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(account)}
                      className="rounded-xl p-2 text-slate-600 hover:text-[#B88728] hover:bg-[#FFF9EC] transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(account)}
                      className="rounded-xl p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete"
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

      {/* Pagination Bar */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        options={[5, 10, 20, 50]}
        itemName="accounts"
        isLoading={loading}
        variant="dark"
        className="border-t border-slate-800 bg-[#0A0E1A] px-4 sm:px-6 py-3 sm:py-3.5"
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
      />
    </div>
  );
};

export default AccountTable;