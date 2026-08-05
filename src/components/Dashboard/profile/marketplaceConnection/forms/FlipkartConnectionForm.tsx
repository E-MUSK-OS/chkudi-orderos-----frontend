"use client";

import {
  KeyRound,
  LockKeyhole,
  Building2,
} from "lucide-react";

import Input from "@/components/ui/Input";

export default function FlipkartConnectionForm() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div>

        <h3 className="text-xl font-bold text-[#0A0E1A]">
          Flipkart Seller API Configuration
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Enter your Flipkart Seller API credentials to connect your seller
          account.
        </p>

      </div>

      {/* Credentials */}

      <div className="grid gap-6 md:grid-cols-2">

        <Input
          label="Application ID"
          leftIcon={<Building2 size={18} />}
        />

        <Input
          label="Application Secret"
          type="password"
          leftIcon={<LockKeyhole size={18} />}
        />

        <Input
          label="Seller ID"
          leftIcon={<Building2 size={18} />}
        />

        <Input
          label="API Key"
          leftIcon={<KeyRound size={18} />}
        />

      </div>

      {/* Info */}

      <div className="rounded-lg border border-[#E8C16D] bg-[#FFF9EC] p-5">

        <h4 className="font-semibold">
          Before Connecting
        </h4>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">

          <li>
            API access must be enabled in Flipkart Seller Hub.
          </li>

          <li>
            Use valid Application ID and Secret.
          </li>

          <li>
            Keep your API credentials secure.
          </li>

        </ul>

      </div>

    </div>
  );
}