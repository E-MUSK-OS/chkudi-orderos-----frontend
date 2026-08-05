"use client";

import {
  KeyRound,
  LockKeyhole,
  Building2,
  Globe,
} from "lucide-react";

import Input from "@/components/ui/Input";

export default function AmazonConnectionForm() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div>

        <h3 className="text-xl font-bold text-[#0A0E1A]">
          Amazon SP-API Configuration
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Enter your Amazon Seller Partner API credentials to establish a secure
          connection.
        </p>

      </div>

      {/* Credentials */}

      <div className="grid gap-6 md:grid-cols-2">

        <Input
          label="LWA Client ID"
          leftIcon={<KeyRound size={18} />}
        />

        <Input
          label="LWA Client Secret"
          type="password"
          leftIcon={<LockKeyhole size={18} />}
        />

        <Input
          label="Refresh Token"
          leftIcon={<KeyRound size={18} />}
        />

        <Input
          label="Seller ID"
          leftIcon={<Building2 size={18} />}
        />

        <Input
          label="Marketplace ID"
          leftIcon={<Globe size={18} />}
        />

        <Input
          label="AWS Region"
          leftIcon={<Globe size={18} />}
          placeholder="eu-west-1 / us-east-1"
        />

      </div>

      {/* Info */}

      <div className="rounded-lg border border-[#E8C16D] bg-[#FFF9EC] p-5">

        <h4 className="font-semibold">
          Before Connecting
        </h4>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">

          <li>
            Amazon SP-API must be approved.
          </li>

          <li>
            Generate Refresh Token from Seller Central.
          </li>

          <li>
            Keep your Client Secret secure.
          </li>

        </ul>

      </div>

    </div>
  );
}