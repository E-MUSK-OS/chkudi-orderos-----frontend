import MaterialReturnDebitNotePage from "@/components/Dashboard/Purchase/Material/DebitNote/MaterialReturnDebitNotePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debit Note [ Material & Service ] | OrderOS",
  description: "Manage Purchase Material & Service debit note",
};

export default function MaterialReturnDebitNoteListPage() {
  return <MaterialReturnDebitNotePage />;
}
