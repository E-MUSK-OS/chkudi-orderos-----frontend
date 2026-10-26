import DashboardLayout from "../layout/DashboardLayout";
import ProfileForm from "./ProfileForm";
import AccountStatus from "./AccountStatus";
import MarketplaceAccounts from "./MarketplaceAccounts";

export default function Profile() {
  return (
    <DashboardLayout title="Profile">
      <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C89B3C] dark:text-[#F5C451]">
              Account Profile
            </p>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A0E1A] dark:text-white">Profile</h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              View and manage your profile information.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <ProfileForm />
        </div>

        <AccountStatus />
      </div>
      <div className="mt-8">
        <MarketplaceAccounts />
      </div>
    </DashboardLayout>
  );
}
