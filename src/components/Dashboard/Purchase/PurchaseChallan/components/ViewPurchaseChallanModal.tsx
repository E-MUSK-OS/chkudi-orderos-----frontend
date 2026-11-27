"use client";

import React, { useMemo } from "react";
import { Plane } from "lucide-react";
import { PurchaseChallan } from "../types/purchaseChallan.types";
import type { Company } from "@/components/Dashboard/Settings/ManageCompany/CompanyProfile/types/company.types";

function formatDate(dateVal: any): string {
  if (!dateVal) return "-";
  const str = String(dateVal);
  const ymd = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}-${ymd[2]}-${ymd[1]}`;
  const dmy = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmy) return `${dmy[1]}-${dmy[2]}-${dmy[3]}`;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return str;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatQty(num: number | string | undefined | null): string {
  const n = Number(num || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

const KNOWN_SIZES = new Set([
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "6XL",
  "FREE",
  "FS",
]);

function extractSizeFromSku(sku?: string | null): string {
  if (!sku) return "-";
  const parts = sku.trim().split("-");
  if (parts.length < 2) return "-";
  const last = parts[parts.length - 1].trim().toUpperCase();
  if (KNOWN_SIZES.has(last) || /^\d{2,3}$/.test(last)) {
    return last;
  }
  return "-";
}

interface PurchaseChallanSheetProps {
  challan: PurchaseChallan;
  company: Company | null;
}

export function PurchaseChallanSheet({ challan, company }: PurchaseChallanSheetProps) {
  const companyName =
    challan.companyName || company?.legalName || company?.companyName || "Company Name";
  const companyAddressLines = useMemo(() => {
    if (!company) return [];
    return [
      company.billingAddress1 || company.addressLine1,
      company.billingAddress2 || company.addressLine2,
      company.billingAddress3 || company.billingArea,
      [
        company.billingCity || company.city,
        company.billingState || company.state,
        company.billingPincode || company.pincode,
      ]
        .filter(Boolean)
        .join(", "),
    ].filter((l): l is string => Boolean(l && l.trim()));
  }, [company]);

  const supplierAddressLines = useMemo(() => {
    const p = challan.supplier;
    if (!p) return [];
    return [
      p.addressLine1,
      p.addressLine2,
      p.addressLine3 || p.area,
      [p.city, p.state, p.pincode].filter(Boolean).join(" "),
    ].filter((l): l is string => Boolean(l && String(l).trim()));
  }, [challan.supplier]);

  const items = Array.isArray(challan.items) ? challan.items : [];
  const contactName = company?.billingContactName || company?.ownerName || "";
  const contactPhone = company?.billingContactNo || company?.phone || "";
  const supplierDisplayName = challan.supplier?.partyName || challan.supplierName || "-";
  const supplierGstn = challan.supplier?.gstin || "-";
  const supplierContact = challan.contactNo || challan.supplier?.phone || "-";
  const dispatchedFrom = challan.supplier?.city || "-";
  const destination = challan.stockIn || company?.billingCity || company?.city || "-";
  const normalizedFor = (challan.challanFor || "").trim().toLowerCase();
  const headerBadge =
    !normalizedFor ||
    normalizedFor === "purchase" ||
    normalizedFor === "finish goods"
      ? "PURCHASE - PRODUCT"
      : `PURCHASE - ${challan.challanFor.toUpperCase()}`;

  const computedTotalQty = useMemo(() => {
    if (challan.totalReceivedQty !== undefined && challan.totalReceivedQty !== null) {
      return Number(challan.totalReceivedQty);
    }
    return items.reduce((sum, it) => sum + Number(it.receivedQty || 0), 0);
  }, [challan.totalReceivedQty, items]);

  return (
    <div className="print-invoice-sheet mx-auto max-w-[794px] min-h-[1080px] bg-white text-slate-900 rounded-md shadow-sm border border-slate-200 px-7 py-6 text-[12px] leading-relaxed flex flex-col">
      {/* Top Title Row */}
      <div className="relative flex items-center justify-center mb-4">
        <h1 className="text-base font-bold tracking-wide text-slate-900 uppercase">
          PURCHASE CHALLAN
        </h1>
        <span className="absolute right-0 text-sm font-semibold tracking-wider text-slate-300 uppercase">
          {headerBadge}
        </span>
      </div>

      {/* Company Header + Date & Challan No */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3.5">
          {company?.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={companyName}
              className="h-16 w-16 rounded-lg object-contain border border-slate-200 bg-slate-950 p-1 shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-[#0A0E1A] text-[#E8C16D] flex items-center justify-center font-bold text-lg tracking-wider shrink-0">
              {companyName
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </div>
          )}

          <div className="space-y-0.5 text-[11.5px] text-slate-700">
            <div className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
              {companyName}
            </div>
            {challan.branchName && (
              <div className="font-semibold text-slate-800">
                Branch. {challan.branchName}
              </div>
            )}
            {companyAddressLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
            {company?.gstNumber && (
              <div className="font-bold text-slate-900">GSTN. {company.gstNumber}</div>
            )}
            {(contactName || contactPhone) && (
              <div className="font-semibold text-slate-900">
                {contactName ? `Contact. ${contactName}` : ""}
                {contactName && contactPhone ? " | " : ""}
                {contactPhone ? `No. ${contactPhone}` : ""}
              </div>
            )}
          </div>
        </div>

        <div className="text-right text-[11.5px] text-slate-700 shrink-0 pt-2 space-y-0.5">
          <div>Date. {formatDate(challan.challanDate)}</div>
          <div className="font-medium text-slate-900">No. {challan.challanNo}</div>
        </div>
      </div>

      {/* Supplier Detail & Ref / Courier / Dispatch */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4 border-b border-slate-200">
        <div className="sm:col-span-5 sm:border-r sm:border-slate-200 sm:pr-4 space-y-0.5 text-[11.5px] text-slate-700">
          <div className="text-xs font-bold text-slate-900 mb-1">Supplier Detail.</div>
          <div className="font-medium text-slate-900 uppercase">{supplierDisplayName}</div>
          {supplierAddressLines.length > 0 && (
            <div>
              <span className="font-bold text-slate-800">Address. </span>
              {supplierAddressLines.join(", ")}
            </div>
          )}
          <div>
            <span className="font-bold text-slate-800">GSTN. </span>
            {supplierGstn}
          </div>
          <div>
            <span className="font-bold text-slate-800">Contact. </span>
            {supplierContact}
          </div>
        </div>

        <div className="sm:col-span-7 flex flex-col justify-between gap-3">
          {/* Courier / LR No & Party Challan No */}
          <div className="border border-slate-200 rounded-md px-3.5 py-2.5 flex items-center justify-between gap-4 text-[11px]">
            <div>
              <span className="text-slate-500">Courier / LR. </span>
              <span className="font-bold text-slate-900 uppercase">
                {[challan.courierPartner, challan.lrNo].filter(Boolean).join(" / ") || "-"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500">Party Challan No. </span>
              <span className="font-bold text-slate-900">{challan.partyChallanNo || "-"}</span>
            </div>
          </div>

          {/* Received / Checked By */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-[11px]">
            <span className="text-[10.5px] font-semibold text-slate-500 uppercase">
              RECEIVED BY.
            </span>
            <span className="font-medium text-slate-800">{challan.receivedBy || "-"}</span>
          </div>

          {/* Dispatched From -> Destination */}
          <div className="flex items-center justify-between gap-2 px-2 text-[11px] pt-1">
            <div className="text-center min-w-[90px]">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">
                DISPATCHED FROM.
              </div>
              <div className="font-medium text-slate-900 uppercase">{dispatchedFrom}</div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-300" />
              <Plane className="w-4 h-4 text-slate-700 shrink-0 rotate-45" />
              <div className="h-px flex-1 bg-slate-300" />
            </div>
            <div className="text-center min-w-[90px]">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">DESTINATION.</div>
              <div className="font-medium text-slate-900">{destination}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mt-4">
        <table className="w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="bg-[#F3F5F8] text-slate-900 font-bold border-y border-slate-200">
              <th className="py-2 px-2.5 text-left w-14">Sr.</th>
              <th className="py-2 px-2 text-left">SKU.</th>
              <th className="py-2 px-2 text-left w-28">Size.</th>
              <th className="py-2 px-2.5 text-right w-28">Qty.</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">
                  No items found in this challan.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-slate-200">
                  <td className="py-2 px-2.5 text-slate-700">{item.itemNo || idx + 1}</td>
                  <td className="py-2 px-2 font-medium text-slate-900">
                    {item.sku || item.name || "-"}
                  </td>
                  <td className="py-2 px-2 text-slate-800">{extractSizeFromSku(item.sku)}</td>
                  <td className="py-2 px-2.5 text-right text-slate-900">
                    {formatQty(item.receivedQty)} Pcs
                  </td>
                </tr>
              ))
            )}
            <tr className="border-b border-slate-200 font-bold text-slate-900">
              <td colSpan={3} className="py-2 px-2 text-right pr-8">
                Total
              </td>
              <td className="py-2 px-2.5 text-right">{formatQty(computedTotalQty)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature & Footer */}
      <div className="print-bottom-section mt-auto pt-8">
        <div className="flex justify-end mb-4">
          <div className="text-center space-y-1 min-w-[160px]">
            {company?.signatureUrl ? (
              <div className="border-b border-slate-300 pb-1">
                <img
                  src={company.signatureUrl}
                  alt="Signature"
                  className="h-10 mx-auto object-contain"
                />
              </div>
            ) : (
              <div className="text-[11px] italic text-slate-400 border-b border-slate-300 pb-1">
                signature
              </div>
            )}
            <div className="text-[11.5px] font-bold text-slate-900 uppercase pt-0.5">
              For {companyName}
            </div>
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
              AUTHORIZED SIGNATORY
            </div>
          </div>
        </div>

        <div className="print-page-footer border-t border-slate-200 pt-3 text-center text-[10.5px] text-slate-600">
          <div>
            Thank you for your business! For any inquiries, please contact us at 8200705348 or
            netuorderos@gmail.com. Visit our website:
          </div>
          <div>netuorderos.io</div>
        </div>
      </div>
    </div>
  );
}

export default function ViewPurchaseChallanModal() {
  return null;
}
