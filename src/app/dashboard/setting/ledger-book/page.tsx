import LedgerBook from "@/components/Dashboard/Settings/ManageCompany/LedgerBook/LedgerBook";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ledger Book | OrderOS",
  description: "Manage account ledger's information, contact details, and balances.",
};

export default function SettingLedgerBookPage() {
  return <LedgerBook />;
}

