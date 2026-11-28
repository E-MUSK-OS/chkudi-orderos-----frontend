import JournalVoucherViewPage from "@/components/Dashboard/Account/Vouchers/JournalVoucherViewPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JournalVoucherViewPage voucherId={id} />;
}
