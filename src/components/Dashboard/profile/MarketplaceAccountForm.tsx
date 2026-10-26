"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Store, User, Hash } from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ReactSelect, {
  SelectOption,
} from "@/components/ui/ReactSelect";
import { Switch } from "@/components/ui/switch";

import type {
  Marketplace,
  MarketplaceAccount,
  MarketplaceAccountPayload,
} from "@/services/marketplaceAccount/marketplaceAccount.types";

interface MarketplaceAccountFormProps {
  marketplaces: Marketplace[];

  account?: MarketplaceAccount | null;

  loading?: boolean;

  onSubmit: (
    data: MarketplaceAccountPayload
  ) => Promise<boolean>;

  onSuccess?: () => void;
}

export default function MarketplaceAccountForm({
  marketplaces,
  account,
  loading = false,
  onSubmit,
  onSuccess,
}: MarketplaceAccountFormProps) {
  const [form, setForm] =
    useState<MarketplaceAccountPayload>({
      marketplaceId: "",

      sellerName: "",

      sellerCode: "",

      displayName: "",

      isActive: true,
    });

  // ======================================================
  // Edit Mode
  // ======================================================

  useEffect(() => {
    if (!account) {
      setForm({
        marketplaceId: "",

        sellerName: "",

        sellerCode: "",

        displayName: "",

        isActive: true,
      });

      return;
    }

    setForm({
      marketplaceId: account.marketplaceId,

      sellerName: account.sellerName,

      sellerCode: account.sellerCode,

      displayName: account.displayName ?? "",

      isActive: account.isActive,
    });
  }, [account]);

  // ======================================================
  // Marketplace Options
  // ======================================================

  const marketplaceOptions: SelectOption[] =
    useMemo(
      () =>
        marketplaces.map((marketplace) => ({
          label: marketplace.marketplaceName,

          value: marketplace.id,
        })),
      [marketplaces]
    );

  // ======================================================
  // Validation
  // ======================================================

  const validate = () => {
    if (!form.marketplaceId) {
      toast.error("Please select marketplace.");
      return false;
    }

    if (!form.sellerName.trim()) {
      toast.error("Seller name is required.");
      return false;
    }

    if (!form.sellerCode.trim()) {
      toast.error("Seller code is required.");
      return false;
    }

    return true;
  };

  // ======================================================
  // Submit
  // ======================================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const success = await onSubmit(form);

    if (!success) {
      return;
    }

    onSuccess?.();

    if (!account) {
      setForm({
        marketplaceId: "",

        sellerName: "",

        sellerCode: "",

        displayName: "",

        isActive: true,
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 sm:space-y-6 py-2 sm:py-4 px-0.5 sm:px-1"
    >
      {/* Marketplace */}

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Marketplace
        </label>

        <ReactSelect
          placeholder="Select Marketplace"
          options={marketplaceOptions}
          value={
            marketplaceOptions.find(
              (option) =>
                option.value ===
                form.marketplaceId
            ) ?? null
          }
          onChange={(option) =>
            setForm((prev) => ({
              ...prev,

              marketplaceId:
                option?.value ?? "",
            }))
          }
        />
      </div>

      {/* Seller Name */}

      <Input
        label="Seller Name"
        leftIcon={<User size={18} />}
        value={form.sellerName}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,

            sellerName:
              e.target.value,
          }))
        }
      />

      {/* Seller Code */}

      <Input
        label="Seller Code"
        leftIcon={<Hash size={18} />}
        value={form.sellerCode}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,

            sellerCode:
              e.target.value,
          }))
        }
      />

      {/* Display Name */}

      <Input
        label="Display Name"
        leftIcon={<Store size={18} />}
        value={form.displayName}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,

            displayName:
              e.target.value,
          }))
        }
      />

      {/* Active */}

      <div className="flex items-center justify-between rounded-2xl border border-[#E7E0D2] p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
        <div>
          <h4 className="font-semibold text-[#0A0E1A] dark:text-white">
            Active Account
          </h4>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enable or disable this
            marketplace account.
          </p>
        </div>

        <Switch
          checked={form.isActive}
          onCheckedChange={(
            checked
          ) =>
            setForm((prev) => ({
              ...prev,

              isActive: checked,
            }))
          }
        />
      </div>

      {/* Footer */}

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-[#E7E0D2] pt-6 dark:border-white/[0.08] w-full">
        <Button
          type="submit"
          loading={loading}
          fullWidth={false}
          className="w-full sm:w-auto min-h-[42px] sm:min-h-[44px] h-11 px-6 rounded-2xl text-xs sm:text-sm font-bold active:scale-[0.98]"
        >
          {account
            ? "Update Account"
            : "Create Account"}
        </Button>
      </div>
    </form>
  );
}