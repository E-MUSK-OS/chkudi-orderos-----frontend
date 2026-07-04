import DashboardLayout from "../layout/DashboardLayout";

import WalletSummary from "./WalletSummary";
import WalletTabs from "./WalletTabs";

export default function Wallet() {
  return (
    <DashboardLayout title="Wallet">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

        <div>
          <p className="text-sm font-semibold uppercase text-[#C89B3C]">
            Wallet
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Wallet Management
          </h2>

          <p className="mt-2 text-slate-600">
            Track balance, payments and wallet usage.
          </p>
        </div>

        <button className="h-12 bg-[#0A0E1A] px-6 font-semibold text-white">
          + Add Balance
        </button>

      </div>

      <WalletSummary />

      <WalletTabs />

    </DashboardLayout>
  );
}