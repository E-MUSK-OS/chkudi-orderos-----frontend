import BankVoucherFormPage from "@/components/Dashboard/Account/Vouchers/BankVoucherFormPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BankVoucherFormPage mode="edit" voucherId={id} />;
}
