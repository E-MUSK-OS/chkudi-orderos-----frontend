"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Warehouse as WarehouseIcon,
  User,
  MapPin,
  Building2,
  Settings,
} from "lucide-react";
import SectionCard from "./SectionCard";

import {
  warehouseSchema,
  type WarehouseFormValues,
} from "../validations/warehouse.validation";

import { warehouseDefaultValues } from "../constants/warehouse.constants";

import type { Warehouse } from "../types/warehouse.types";
import { Checkbox } from "@/components/ui/checkbox";
import SettingCard from "./SettingCard";
import { useCreateWarehouse, useUpdateWarehouse } from "../hooks/useWarehouse";

interface Props {
  mode: "create" | "edit";
  warehouse?: Warehouse;
  onSuccess: () => void;
}

export default function WarehouseForm({
  mode,
  warehouse,
  //   onClose,
  onSuccess,
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: warehouseDefaultValues,
  });
  const { mutateAsync: createWarehouse, isPending } = useCreateWarehouse();
  const { mutateAsync: updateWarehouse, isPending: isUpdating } =
    useUpdateWarehouse();

  useEffect(() => {
    if (mode === "edit" && warehouse) {
      reset({
        warehouseName: warehouse.warehouseName,
        warehouseCode: warehouse.warehouseCode,
        description: warehouse.description ?? "",

        contactPerson: warehouse.contactPerson ?? "",
        phone: warehouse.phone ?? "",
        email: warehouse.email ?? "",

        addressLine1: warehouse.addressLine1 ?? "",
        addressLine2: warehouse.addressLine2 ?? "",

        city: warehouse.city ?? "",
        state: warehouse.state ?? "",
        country: warehouse.country ?? "",
        pincode: warehouse.pincode ?? "",

        gstNumber: warehouse.gstNumber ?? "",

        isDefault: warehouse.isDefault,
        isActive: warehouse.isActive,
      });
    } else {
      reset(warehouseDefaultValues);
    }
  }, [mode, warehouse, reset]);

  const onSubmit = async (values: WarehouseFormValues) => {
    try {
      if (mode === "create") {
        await createWarehouse(values);
      } else {
        if (!warehouse) return;

        await updateWarehouse({
          id: warehouse.id,
          data: values,
        });
      }

      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form
      id="warehouse-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 p-6"
    >
      {/* ================= Basic Information ================= */}

      <SectionCard
        icon={<WarehouseIcon size={20} />}
        title="Warehouse Information"
        description="Basic warehouse information and identification."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            name="warehouseName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Warehouse Name"
                error={errors.warehouseName?.message}
              />
            )}
          />

          <Controller
            name="warehouseCode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Warehouse Code"
                error={errors.warehouseCode?.message}
              />
            )}
          />
        </div>

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              label="Description"
              error={errors.description?.message}
            />
          )}
        />
      </SectionCard>

      {/* ================= Contact Information ================= */}

      <SectionCard
        icon={<User size={20} />}
        title="Contact Information"
        description="Primary contact details."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            name="contactPerson"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                label="Contact Person"
                error={errors.contactPerson?.message}
              />
            )}
          />

          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                label="Phone"
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                type="email"
                label="Email"
                error={errors.email?.message}
              />
            )}
          />
        </div>
      </SectionCard>

      {/* ================= Address ================= */}

      <SectionCard
        icon={<MapPin size={20} />}
        title="Address Details"
        description="Warehouse physical location."
      >
        <Controller
          name="addressLine1"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              label="Address Line 1"
              error={errors.addressLine1?.message}
            />
          )}
        />

        <Controller
          name="addressLine2"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              label="Address Line 2"
              error={errors.addressLine2?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            name="city"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                label="City"
                error={errors.city?.message}
              />
            )}
          />

          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                label="State"
                error={errors.state?.message}
              />
            )}
          />

          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                label="Country"
                error={errors.country?.message}
              />
            )}
          />

          <Controller
            name="pincode"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                label="Pincode"
                error={errors.pincode?.message}
              />
            )}
          />
        </div>
      </SectionCard>

      {/* ================= Business Details ================= */}

      <SectionCard
        icon={<Building2 size={20} />}
        title="Business Details"
        description="Business and tax information."
      >
        <Controller
          name="gstNumber"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              label="GST Number"
              error={errors.gstNumber?.message}
            />
          )}
        />
      </SectionCard>

      {/* ================= Settings ================= */}

      <SectionCard
        icon={<Settings size={20} />}
        title="Warehouse Settings"
        description="Configure warehouse behaviour."
      >
        {/* <div className="space-y-4">
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />

                <label className="text-sm font-medium text-slate-700">
                  Default Warehouse
                </label>
              </div>
            )}
          />

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />

                <label className="text-sm font-medium text-slate-700">
                  Active Warehouse
                </label>
              </div>
            )}
          />
        </div> */}

        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="isDefault"
            control={control}
            render={({ field }) => (
              <SettingCard
                checked={field.value}
                onCheckedChange={field.onChange}
                title="Default Warehouse"
                description="Use this warehouse as the default warehouse for newly created orders."
              />
            )}
          />
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <SettingCard
                checked={field.value}
                onCheckedChange={field.onChange}
                title="Active Warehouse"
                description="Allow this warehouse to receive inventory and process orders."
              />
            )}
          />
        </div>
      </SectionCard>
    </form>
  );
}
