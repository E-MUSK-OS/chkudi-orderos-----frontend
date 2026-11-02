import LedgerBookViewPage from "@/components/Dashboard/Settings/ManageCompany/LedgerBook/LedgerBookViewPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Ledger | OrderOS",
  description: "View account ledger details.",
};

export default async function ViewLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LedgerBookViewPage id={id} />;
}
