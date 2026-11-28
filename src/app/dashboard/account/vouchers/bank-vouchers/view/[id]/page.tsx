import BankVoucherViewPage from "@/components/Dashboard/Account/Vouchers/BankVoucherViewPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BankVoucherViewPage voucherId={id} />;
}
