import CashVoucherFormPage from "@/components/Dashboard/Account/Vouchers/CashVoucherFormPage";

export default async function EditCashVoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CashVoucherFormPage mode="edit" voucherId={id} />;
}
