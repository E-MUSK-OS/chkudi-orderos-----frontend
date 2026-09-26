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
    <div className="overflow-hidden border border-[#E7E0D2]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#0A0E1A] text-white">
            <tr>
              <th className="px-5 py-4 text-left text-md font-semibold uppercase">
                Marketplace
              </th>

              <th className="px-5 py-4 text-left text-md font-semibold uppercase">
                Seller
              </th>

              <th className="px-5 py-4 text-left text-md font-semibold uppercase">
                Seller Code
              </th>

              <th className="px-5 py-4 text-left text-md font-semibold uppercase">
                Display Name
              </th>

              <th className="px-5 py-4 text-left text-md font-semibold uppercase">
                Status
              </th>

              <th className="px-5 py-4 text-left text-md font-semibold uppercase">
                Connection
              </th>

              <th className="px-5 py-4 text-center text-md font-semibold uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-t hover:bg-[#FCFBF8]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-18 w-18 items-center justify-center ">
                      <img
                        src={
                          MARKETPLACE_LOGOS[
                            account.marketplace.marketplaceCode
                          ] || "/marketplaces/default.png"
                        }
                        alt={account.marketplace.marketplaceName}
                        className="h-18 w-18 object-contain"
                      />
                    </div>

                    <div>
                      <p className="font-semibold text-[#0A0E1A] text-lg">
                        {account.marketplace.marketplaceName}
                      </p>

                      <p className="text-sm text-slate-500">
                        {account.marketplace.marketplaceCode}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-lg">{account.sellerName}</td>

                <td className="px-5 py-4 text-lg font-medium">
                  {account.sellerCode}
                </td>

                <td className="px-5 py-4 text-lg">
                  {account.displayName || "--"}
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={account.isActive}
                      onCheckedChange={() => onToggleStatus(account)}
                    />

                    <span
                      className={`text-sm font-semibold ${
                        account.isActive ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {account.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>

                {/* <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold ${
                      account.connectionStatus === "CONNECTED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {account.connectionStatus === "CONNECTED" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}

                    {account.connectionStatus}
                  </span>
                </td> */}

                <td className="px-5 py-4">
                  {account.connectionStatus === "CONNECTED" ? (
                    <Button
                      variant="secondary"
                      fullWidth={false}
                      onClick={() => onConnect(account)}
                    >
                      Reconnect
                    </Button>
                  ) : (
                    <Button
                      fullWidth={false}
                      onClick={() => onConnect(account)}
                    >
                      Connect
                    </Button>
                  )}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(account)}
                      className="border p-2 hover:border-[#C89B3C]"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={() => onDelete(account)}
                      className="bg-red-600 p-2 text-white hover:bg-red-700"
                    >
                      <Trash2 size={16} />
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
