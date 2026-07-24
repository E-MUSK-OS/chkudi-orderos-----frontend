"use client";

import { Star, WarehouseIcon } from "lucide-react";
import type { Warehouse } from "../types/warehouse.types";
import WarehouseActionMenu from "./WarehouseActionMenu";
import { Switch } from "@/components/ui/switch";

interface Props {
  warehouses: Warehouse[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  onStatusChange: (warehouse: Warehouse, checked: boolean) => void;
}

// const warehouses: Warehouse[] = [
//   {
//     id: "1",
//     warehouseName: "Surat Warehouse",
//     warehouseCode: "SUR01",
//     description: "Main Warehouse",
//     contactPerson: "Kapil Sanghani",
//     phone: "9876543210",
//     email: "kapil@gmail.com",
//     addressLine1: "",
//     addressLine2: "",
//     city: "Surat",
//     state: "Gujarat",
//     country: "India",
//     pincode: "395006",
//     gstNumber: "",
//     isDefault: true,
//     isActive: true,
//     createdAt: "2026-07-24",
//     updatedAt: "2026-07-24",
//   },
//   {
//     id: "2",
//     warehouseName: "Ahmedabad Warehouse",
//     warehouseCode: "AMD01",
//     description: "North Zone Warehouse",
//     contactPerson: "Raj Patel",
//     phone: "9999999999",
//     email: "raj@gmail.com",
//     addressLine1: "",
//     addressLine2: "",
//     city: "Ahmedabad",
//     state: "Gujarat",
//     country: "India",
//     pincode: "380001",
//     gstNumber: "",
//     isDefault: false,
//     isActive: true,
//     createdAt: "2026-07-22",
//     updatedAt: "2026-07-22",
//   },
// ];

export default function WarehouseTable({
  warehouses,
  isLoading,
  isError,
  onEdit,
  onDelete,
  onStatusChange,
}: Props) {
  return (
    <div className="overflow-hidden border border-[#E7EAF0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-[#E7EAF0] bg-[#0A0E1A]">
            <tr>
              <th className="px-6 py-4 text-left text-lg font-semibold text-white">
                Warehouse
              </th>

              <th className="px-6 py-4 text-left text-lg font-semibold text-white">
                Contact
              </th>

              <th className="px-6 py-4 text-center text-lg font-semibold text-white">
                Default
              </th>

              <th className="px-6 py-4 text-center text-lg font-semibold text-white">
                Active
              </th>

              <th className="px-6 py-4 text-center text-lg font-semibold text-white">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {warehouses.map((warehouse) => (
              <tr
                key={warehouse.id}
                className="border-b border-[#EEF2F7] hover:bg-slate-50"
              >
                {/* Warehouse */}
                <td className="px-6 py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <WarehouseIcon className="h-5 w-5 text-slate-700" />
                    </div>

                    <div>
                      <p className="font-semibold">{warehouse.warehouseName}</p>

                      <p className="text-md text-slate-500">
                        {warehouse.warehouseCode}
                      </p>

                      {warehouse.description && (
                        <p className="mt-1 text-md text-slate-400">
                          {warehouse.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Contact */}
                <td className="px-6 py-5">
                  <div>
                    <p className="font-medium">{warehouse.contactPerson}</p>

                    <p className="text-sm text-slate-500">{warehouse.phone}</p>
                  </div>
                </td>

                {/* Default */}
                <td className="px-6 py-5 text-center">
                  {warehouse.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      <Star size={14} />
                      Default
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    <Switch
                      checked={warehouse.isActive}
                      onCheckedChange={(checked: boolean) => {
                        console.log("Switch:", checked);
                        onStatusChange(warehouse, checked);
                      }}
                    />
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-5">
                  <div className="flex items-center justify-center">
                    <WarehouseActionMenu
                      isActive={warehouse.isActive}
                      onEdit={() => onEdit(warehouse)}
                      onDelete={() => onDelete(warehouse)}
                      onStatusChange={() => {}}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
