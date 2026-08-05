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
        <div className="rounded-lg border border-dashed border-[#E7E0D2] p-10 text-center">
          <h3 className="text-lg font-semibold">
            Marketplace Not Supported
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Connection UI is not available for this marketplace yet.
          </p>
        </div>
      );
  }
}