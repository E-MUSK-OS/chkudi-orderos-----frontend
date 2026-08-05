"use client";

import { KeyRound, LockKeyhole, Hash } from "lucide-react";

import Input from "@/components/ui/Input";
import ReactSelect from "@/components/ui/ReactSelect";

export default function MyntraConnectionForm() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div>
        <h3 className="text-xl font-bold text-[#0A0E1A]">
          Myntra API Configuration
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Enter your Myntra Seller API credentials to establish a secure
          connection.
        </p>
      </div>

      {/* Credentials */}

      <div className="grid gap-6 md:grid-cols-2">

        <Input
          label="API Key"
          leftIcon={<KeyRound size={18} />}
        />

        <Input
          label="API Secret"
          type="password"
          leftIcon={<LockKeyhole size={18} />}
        />

        <Input
          label="Seller Code"
          leftIcon={<Hash size={18} />}
        />

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Environment
          </label>

          <ReactSelect
            placeholder="Select Environment"
            options={[
              {
                label: "Sandbox",
                value: "SANDBOX",
              },
              {
                label: "Production",
                value: "PRODUCTION",
              },
            ]}
          />
        </div>

      </div>

      {/* Information */}

      <div className="rounded-lg border border-[#E8C16D] bg-[#FFF9EC] p-5">

        <h4 className="font-semibold text-[#0A0E1A]">
          Before Connecting
        </h4>

        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
          <li>API access must be enabled in your Myntra Seller Portal.</li>

          <li>Use Production credentials for live order syncing.</li>

          <li>Keep your API Secret secure.</li>
        </ul>

      </div>

    </div>
  );
}