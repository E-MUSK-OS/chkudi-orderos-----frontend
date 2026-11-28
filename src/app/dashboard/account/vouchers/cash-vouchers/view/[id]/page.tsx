import CashVoucherViewPage from "@/components/Dashboard/Account/Vouchers/CashVoucherViewPage";

export default async function ViewCashVoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CashVoucherViewPage voucherId={id} />;
}
