import DashboardLayout from "../layout/DashboardLayout";
import ProfileForm from "./ProfileForm";
import AccountStatus from "./AccountStatus";
import MarketplaceAccounts from "./MarketplaceAccounts";

export default function Profile() {
  return (
    <DashboardLayout title="Profile">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-[#C89B3C]">
            Account Profile
          </p>

          <h2 className="mt-2 text-4xl font-bold">Profile</h2>

          <p className="mt-2 text-slate-600">
            View and manage your profile information.
          </p>
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
