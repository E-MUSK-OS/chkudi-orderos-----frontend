"use client";

import type { MarketplaceAccount } from "@/services/marketplaceAccount/marketplaceAccount.types";

import {
  AmazonConnectionForm,
  MyntraConnectionForm,
  FlipkartConnectionForm,
} from "./forms";

interface MarketplaceFormRendererProps {
  account: MarketplaceAccount;
}

export default function MarketplaceFormRenderer({
  account,
}: MarketplaceFormRendererProps) {
  switch (account.marketplace.marketplaceCode) {

    case "AMAZON":
      return <AmazonConnectionForm />;

    case "MYNTRA":
      return <MyntraConnectionForm />;

    case "FLIPKART":
      return <FlipkartConnectionForm />;

    default:
      return (
        <div className="rounded-lg border border-dashed border-[#E7E0D2] p-10 text-center dark:border-white/[0.1] dark:bg-white/[0.02]">
          <h3 className="text-lg font-semibold text-[#0A0E1A] dark:text-white">
            Marketplace Not Supported
          </h3>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Connection UI is not available for this marketplace yet.
          </p>
        </div>
      );
  }
}