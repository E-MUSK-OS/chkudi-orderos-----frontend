import JournalVoucherFormPage from "@/components/Dashboard/Account/Vouchers/JournalVoucherFormPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JournalVoucherFormPage mode="edit" voucherId={id} />;
}
