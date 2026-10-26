"use client";

import { CheckCircle2, Pencil, Trash2, XCircle } from "lucide-react";

import type { MarketplaceAccount } from "@/services/marketplaceAccount/marketplaceAccount.types";
import { MARKETPLACE_LOGOS } from "@/constants/marketplaces";
import { Switch } from "@/components/ui/switch";
import Button from "@/components/ui/Button";

interface Props {
  accounts: MarketplaceAccount[];

  onEdit: (account: MarketplaceAccount) => void;

  onDelete: (account: MarketplaceAccount) => void;

  onToggleStatus: (account: MarketplaceAccount) => void;

  onConnect: (account: MarketplaceAccount) => void;
}

export default function MarketplaceAccountTable({
  accounts,
  onEdit,
  onDelete,
  onToggleStatus,
  onConnect,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#0A0E1A] text-white dark:bg-[#080B11] dark:text-[#E8C16D] border-b border-slate-200 dark:border-white/[0.08]">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                Marketplace
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                Seller
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                Seller Code
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                Display Name
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                Status
              </th>

              <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                Connection
              </th>

              <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#EEF2F7] dark:divide-white/[0.06]">
            {accounts.map((account) => (
              <tr key={account.id} className="border-t border-[#E7E0D2] transition hover:bg-[#FCFBF8] dark:border-white/[0.04] dark:hover:bg-white/[0.06]">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/[0.04] p-1.5 border border-slate-200/60 dark:border-white/[0.08] shrink-0">
                      <img
                        src={
                          MARKETPLACE_LOGOS[
                            account.marketplace.marketplaceCode
                          ] || "/marketplaces/default.png"
                        }
                        alt={account.marketplace.marketplaceName}
                        className="h-10 w-10 object-contain"
                      />
                    </div>

                    <div>
                      <p className="font-bold text-[#0A0E1A] text-sm dark:text-slate-100">
                        {account.marketplace.marketplaceName}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {account.marketplace.marketplaceCode}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{account.sellerName}</td>

                <td className="px-5 py-3.5 text-sm font-mono font-medium text-slate-700 dark:text-slate-300">
                  {account.sellerCode}
                </td>

                <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300">
                  {account.displayName || "--"}
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={account.isActive}
                      onCheckedChange={() => onToggleStatus(account)}
                    />

                    <span
                      className={`text-xs font-bold ${
                        account.isActive ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {account.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>

                <td className="px-5 py-3.5">
                  {account.connectionStatus === "CONNECTED" ? (
                    <Button
                      variant="secondary"
                      fullWidth={false}
                      size="sm"
                      onClick={() => onConnect(account)}
                    >
                      Reconnect
                    </Button>
                  ) : (
                    <Button
                      fullWidth={false}
                      size="sm"
                      onClick={() => onConnect(account)}
                    >
                      Connect
                    </Button>
                  )}
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(account)}
                      title="Edit Account"
                      className="grid h-8.5 w-8.5 place-items-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] hover:bg-[#FFF9EC] dark:hover:bg-[#E8C16D]/10 hover:text-[#B88728] dark:hover:text-[#F5C451] transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(account)}
                      title="Delete Account"
                      className="grid h-8.5 w-8.5 place-items-center rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
