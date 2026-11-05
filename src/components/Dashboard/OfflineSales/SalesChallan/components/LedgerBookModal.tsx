"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Save,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  CreditCard,
  Check,
  Truck,
  Hash,
  ShieldCheck,
  Info,
  X,
  Tag,
  Layers,
} from "lucide-react";
import { Party, ACCOUNT_HEAD_OPTIONS } from "../types/challan.types";
import { challanService } from "../services/challan.service";
import ThemeSelectDropdown, { ThemeSelectOption } from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { toast } from "sonner";

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

const COUNTRY_OPTIONS: ThemeSelectOption[] = [
  { value: "India", label: "India" },
  { value: "USA", label: "USA" },
  { value: "UAE", label: "UAE" },
  { value: "UK", label: "UK" },
];

const ACCOUNT_HEAD_SELECT_OPTIONS: ThemeSelectOption[] = ACCOUNT_HEAD_OPTIONS.map((opt) => ({
  value: opt,
  label: opt,
}));

interface LedgerBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartyCreated: (party: Party) => void;
  initialName?: string;
  defaultAccountHead?: string;
  entityTitle?: string;
}

export default function LedgerBookModal({
  isOpen,
  onClose,
  onPartyCreated,
  initialName = "",
  defaultAccountHead = "Sundry Debtors",
  entityTitle,
}: LedgerBookModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "contact" | "accounting">(
    "general"
  );
  const [loading, setLoading] = useState(false);

  const isSupplier =
    entityTitle === "Supplier" ||
    defaultAccountHead === "Sundry Creditors";

  const entityName = entityTitle || (isSupplier ? "Supplier" : "Party");

  const todayStr = new Date().toISOString().split("T")[0];

  // Comprehensive Form State matching exact fields
  const [formData, setFormData] = useState({
    partyName: initialName,
    accountCode: "",
    alias: "",
    accountHead: defaultAccountHead,
    contactPerson: "",
    email: "",
    openingBalance: 0,
    balanceType: "Credit" as "Credit" | "Debit",
    joinDate: todayStr,
    isActive: true,

    // Billing Address
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    area: "",
    country: "India",
    pincode: "",
    state: "Gujarat",
    phone: "",
    city: "Surat",

    // Shipping Address
    shippingSameAsBilling: true,
    shippingAddress1: "",
    shippingAddress2: "",
    shippingAddress3: "",
    shippingArea: "",
    shippingCountry: "India",
    shippingPincode: "",
    shippingState: "Gujarat",
    shippingPhone: "",
    shippingCity: "Surat",

    // Accounting
    pan: "",
    gstin: "",
    gstDate: todayStr,
    cstNo: "",
    cstDate: todayStr,
    serviceTaxNo: "",
    serviceTaxDate: todayStr,
    otherTaxNo: "",
    otherTaxDate: todayStr,
    billDueDays: 0,
    creditLimit: 0.0,
    debitLimit: 0.0,

    bankName: "",
    accountNumber: "",
    ifsc: "",
  });

  useEffect(() => {
    if (initialName && !formData.partyName) {
      setFormData((prev) => ({ ...prev, partyName: initialName }));
    }
  }, [initialName]);

  if (!isOpen) return null;

  const handleChange = (field: string, val: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: val };

      // If user is editing billing fields and shippingSameAsBilling is checked, keep shipping in sync
      if (next.shippingSameAsBilling) {
        if (field === "addressLine1") next.shippingAddress1 = val;
        if (field === "addressLine2") next.shippingAddress2 = val;
        if (field === "addressLine3") next.shippingAddress3 = val;
        if (field === "area") next.shippingArea = val;
        if (field === "country") next.shippingCountry = val;
        if (field === "pincode") next.shippingPincode = val;
        if (field === "state") next.shippingState = val;
        if (field === "phone") next.shippingPhone = val;
        if (field === "city") next.shippingCity = val;
      }

      return next;
    });
  };

  const handleToggleShippingSameAsBilling = (checked: boolean) => {
    setFormData((prev) => {
      if (checked) {
        return {
          ...prev,
          shippingSameAsBilling: true,
          shippingAddress1: prev.addressLine1,
          shippingAddress2: prev.addressLine2,
          shippingAddress3: prev.addressLine3,
          shippingArea: prev.area,
          shippingCountry: prev.country,
          shippingPincode: prev.pincode,
          shippingState: prev.state,
          shippingPhone: prev.phone,
          shippingCity: prev.city,
        };
      }
      return {
        ...prev,
        shippingSameAsBilling: false,
      };
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.partyName.trim()) {
      toast.error("Account / Ledger / Party Name is required");
      setActiveTab("general");
      return;
    }

    const trimmedGstin = (formData.gstin || "").trim();
    if (trimmedGstin && !GSTIN_REGEX.test(trimmedGstin)) {
      toast.error("Invalid GST number format (15 characters, e.g. 24ABCDE1234F1Z5)");
      setActiveTab("accounting");
      return;
    }

    try {
      setLoading(true);
      const newParty = await challanService.createParty({
        ...formData,
        openingBalance: Number(formData.openingBalance) || 0,
        billDueDays: Number(formData.billDueDays) || 0,
        creditLimit: Number(formData.creditLimit) || 0,
        debitLimit: Number(formData.debitLimit) || 0,
      });

      toast.success(`${entityName} created successfully in Ledger Book!`);
      onPartyCreated(newParty);
      onClose();
    } catch (err: any) {
      toast.error(err.message || `Failed to create ${entityName.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-[28px] sm:rounded-[32px] overflow-hidden border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0A0E1A] shadow-2xl relative my-auto flex flex-col max-h-[92vh] transition-all">
        {/* Top Header - Exact Dark Banner from Screenshot */}
        <div className="bg-[#0A0E1A] dark:bg-[#080B11] border-b border-slate-800 dark:border-white/[0.08] px-5 sm:px-7 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E8C16D]/40 text-[#E8C16D] bg-[#FFF9EC]/10 shrink-0">
              <BookOpen className="w-4 h-4 text-[#E8C16D]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Ledger Book
              </h2>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Setting / Manage Company / Account / Ledger /{" "}
                <span className="text-[#E8C16D] font-bold">{entityName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={loading}
              title={`Save ${entityName}`}
              className="h-9 px-4.5 bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] rounded-full flex items-center gap-1.5 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? "Saving..." : `Save ${entityName}`}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Cancel"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar - Exact Pill Segments from Screenshot */}
        <div className="px-6 sm:px-7 pt-3.5 pb-2.5 bg-white dark:bg-[#0A0E1A] flex items-center gap-2 shrink-0 border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`rounded-full transition-all cursor-pointer text-xs font-bold px-5 py-2 ${
              activeTab === "general"
                ? "bg-[#0A0E1A] dark:bg-[#1A160E] text-[#E8C16D] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("contact")}
            className={`rounded-full transition-all cursor-pointer text-xs font-bold px-5 py-2 ${
              activeTab === "contact"
                ? "bg-[#0A0E1A] dark:bg-[#1A160E] text-[#E8C16D] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("accounting")}
            className={`rounded-full transition-all cursor-pointer text-xs font-bold px-5 py-2 ${
              activeTab === "accounting"
                ? "bg-[#0A0E1A] dark:bg-[#1A160E] text-[#E8C16D] shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
            }`}
          >
            Accounting
          </button>
        </div>

        {/* Tab Content Form */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1 bg-white dark:bg-[#0A0E1A] custom-scrollbar">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Card 1: PARTY IDENTITY & BASIC INFORMATION */}
              <div className="rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/80 transition-all">
                <div className="flex items-center gap-2 pb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D]">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0E1A] dark:text-white">
                    PARTY IDENTITY & BASIC INFORMATION
                  </h3>
                </div>

                {/* Account / Ledger / Party Name (Full Width Golden Pill) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Account / Ledger / Party Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                      REQUIRED
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.partyName}
                    onChange={(e) => handleChange("partyName", e.target.value)}
                    placeholder="Enter Account, Ledger, or Party Name..."
                    className="w-full h-12 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border-2 border-[#E8C16D]/70 dark:border-[#E8C16D]/80 rounded-full text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                  />
                </div>

                {/* Side-by-Side: Account Code & Alias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Account Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Account Code</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accountCode}
                      onChange={(e) => handleChange("accountCode", e.target.value)}
                      placeholder="e.g. ACC-001"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Alias */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>Alias</span>
                      </label>
                      <span className="text-[11px] font-medium text-[#B88728] dark:text-[#E8C16D]">
                        Set 'Marketplace' for channel sales
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.alias}
                      onChange={(e) => handleChange("alias", e.target.value)}
                      placeholder="e.g. Marketplace, Nickname"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Account Head / Group & Contact Person */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Account Head / Group */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Account Head / Group</span>
                    </label>
                    <ThemeSelectDropdown
                      value={formData.accountHead}
                      onChange={(val) => handleChange("accountHead", val)}
                      options={ACCOUNT_HEAD_SELECT_OPTIONS}
                      className="w-full"
                      buttonClassName="w-full justify-between h-11 px-5 text-xs sm:text-sm font-medium rounded-full border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                      menuClassName="w-full min-w-full !max-w-none rounded-2xl"
                    />
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Contact Person</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange("contactPerson", e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: FINANCIAL BALANCE & COMMUNICATION */}
              <div className="rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/80 transition-all">
                <div className="flex items-center gap-2 pb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D]">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0E1A] dark:text-white">
                    FINANCIAL BALANCE & COMMUNICATION
                  </h3>
                </div>

                {/* Side-by-Side: Email ID & Opening Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Email ID</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="party@example.com"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Opening Balance + Credit / Debit Toggle */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Opening Balance
                      </label>
                      <span className="text-[11px] text-slate-400 font-medium">Balance Type</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.openingBalance}
                          onChange={(e) => handleChange("openingBalance", e.target.value)}
                          className="w-full h-11 pl-8 pr-4 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="flex bg-slate-100 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full p-1 gap-1 shrink-0 h-11 items-center">
                        <button
                          type="button"
                          onClick={() => handleChange("balanceType", "Credit")}
                          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                            formData.balanceType === "Credit"
                              ? "bg-[#E8C16D] text-[#0A0E1A] shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Credit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("balanceType", "Debit")}
                          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                            formData.balanceType === "Debit"
                              ? "bg-[#E8C16D] text-[#0A0E1A] shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Debit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side: Join Date & Party Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Join Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Join Date</span>
                    </label>
                    <DatePicker
                      value={formData.joinDate}
                      onChange={(_, str) => handleChange("joinDate", str || "")}
                      placeholder="Select Join Date"
                      buttonClassName="h-11 px-5 rounded-full text-xs sm:text-sm font-medium"
                    />
                  </div>

                  {/* Party Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Party Status
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 h-11">
                      <button
                        type="button"
                        onClick={() => handleChange("isActive", true)}
                        className={`h-11 px-4 rounded-full border-2 flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                          formData.isActive
                            ? "border-emerald-400 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-xs"
                            : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            formData.isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange("isActive", false)}
                        className={`h-11 px-4 rounded-full border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                          !formData.isActive
                            ? "border-rose-400 bg-rose-50/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 shadow-xs"
                            : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            !formData.isActive ? "bg-rose-500" : "bg-slate-400"
                          }`}
                        />
                        Inactive
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT (Billing & Shipping Addresses Side by Side) */}
          {activeTab === "contact" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs sm:text-sm animate-in fade-in duration-150">
              {/* LEFT CARD: Billing Address */}
              <div className="space-y-4 rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/80 transition-all">
                <div className="flex items-center gap-2 pb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D]">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0E1A] dark:text-white">
                    Billing Address
                  </h3>
                </div>

                {/* Address 1 */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Address1
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange("addressLine1", e.target.value)}
                    placeholder="Building / Flat / Street..."
                    className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                  />
                </div>

                {/* Side-by-Side: Address 2 & Address 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Address2
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine2}
                      onChange={(e) => handleChange("addressLine2", e.target.value)}
                      placeholder="Locality / Landmark"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Address3
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine3}
                      onChange={(e) => handleChange("addressLine3", e.target.value)}
                      placeholder="Additional details"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Area & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Area
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => handleChange("area", e.target.value)}
                      placeholder="e.g. Varachha"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Country
                    </label>
                    <ThemeSelectDropdown
                      value={formData.country}
                      onChange={(val) => handleChange("country", val)}
                      options={COUNTRY_OPTIONS}
                      className="w-full"
                      buttonClassName="w-full justify-between h-11 px-5 text-xs sm:text-sm font-medium rounded-full border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white"
                      menuClassName="w-full min-w-full !max-w-none rounded-2xl"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Pincode & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleChange("pincode", e.target.value)}
                      placeholder="e.g. 395006"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      placeholder="e.g. Gujarat"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Phone No & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Phone No</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="e.g. Surat"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: Shipping Address */}
              <div className="space-y-4 rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/80 transition-all">
                <div className="flex items-center justify-between gap-2 pb-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D]">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0E1A] dark:text-white">
                      Shipping Address
                    </h3>
                  </div>
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-xs font-bold text-[#B88728] dark:text-[#E8C16D] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.shippingSameAsBilling}
                      onChange={(e) =>
                        handleToggleShippingSameAsBilling(e.target.checked)
                      }
                      className="rounded accent-[#E8C16D] w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Same as Billing</span>
                  </label>
                </div>

                {/* Address 1 */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Address1
                  </label>
                  <input
                    type="text"
                    disabled={formData.shippingSameAsBilling}
                    value={formData.shippingAddress1}
                    onChange={(e) =>
                      handleChange("shippingAddress1", e.target.value)
                    }
                    placeholder="Building / Flat / Street..."
                    className="w-full h-11 px-5 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                  />
                </div>

                {/* Side-by-Side: Address 2 & Address 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Address2
                    </label>
                    <input
                      type="text"
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingAddress2}
                      onChange={(e) =>
                        handleChange("shippingAddress2", e.target.value)
                      }
                      placeholder="Locality / Landmark"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Address3
                    </label>
                    <input
                      type="text"
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingAddress3}
                      onChange={(e) =>
                        handleChange("shippingAddress3", e.target.value)
                      }
                      placeholder="Additional details"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Area & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Area
                    </label>
                    <input
                      type="text"
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingArea}
                      onChange={(e) =>
                        handleChange("shippingArea", e.target.value)
                      }
                      placeholder="e.g. Varachha"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Country
                    </label>
                    <ThemeSelectDropdown
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingCountry}
                      onChange={(val) => handleChange("shippingCountry", val)}
                      options={COUNTRY_OPTIONS}
                      className="w-full"
                      buttonClassName="w-full justify-between h-11 px-5 text-xs sm:text-sm font-medium rounded-full border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-[#0A0E1A] dark:text-white disabled:bg-slate-100 dark:disabled:bg-white/[0.04] disabled:text-slate-400 dark:disabled:text-slate-600"
                      menuClassName="w-full min-w-full !max-w-none rounded-2xl"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Pincode & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Pincode
                    </label>
                    <input
                      type="text"
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingPincode}
                      onChange={(e) =>
                        handleChange("shippingPincode", e.target.value)
                      }
                      placeholder="e.g. 395006"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      State
                    </label>
                    <input
                      type="text"
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingState}
                      onChange={(e) =>
                        handleChange("shippingState", e.target.value)
                      }
                      placeholder="e.g. Gujarat"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Phone No & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Phone No</span>
                    </label>
                    <input
                      type="text"
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingPhone}
                      onChange={(e) =>
                        handleChange("shippingPhone", e.target.value)
                      }
                      placeholder="e.g. +91 9876543210"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      City
                    </label>
                    <input
                      type="text"
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingCity}
                      onChange={(e) =>
                        handleChange("shippingCity", e.target.value)
                      }
                      placeholder="e.g. Surat"
                      className="w-full h-11 px-5 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTING (Side-by-Side Cards for Tax, Limits & Banking) */}
          {activeTab === "accounting" && (
            <div className="space-y-5 text-xs sm:text-sm animate-in fade-in duration-150">
              {/* Card 1: Statutory & Tax Registrations */}
              <div className="rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/80 transition-all">
                <div className="flex items-center gap-2 pb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0E1A] dark:text-white">
                    Statutory & Tax Registrations
                  </h3>
                </div>

                {/* Side-by-Side: PAN & GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* PAN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Permanent Account Number (PAN)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={formData.pan}
                      onChange={(e) =>
                        handleChange("pan", e.target.value.toUpperCase())
                      }
                      placeholder="e.g. ABCDE1234F"
                      className="w-full h-11 px-5 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all uppercase font-mono text-xs sm:text-sm font-bold tracking-wider"
                    />
                  </div>

                  {/* GSTIN No + Date Combined */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        GSTIN Number & Date
                      </label>
                      {formData.gstin.trim().length === 15 &&
                        GSTIN_REGEX.test(formData.gstin.trim()) && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Valid GST
                          </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={15}
                          value={formData.gstin}
                          onChange={(e) =>
                            handleChange(
                              "gstin",
                              e.target.value.toUpperCase().replace(/\s+/g, "")
                            )
                          }
                          placeholder="e.g. 24ABCDE1234F1Z5"
                          className={`w-full h-11 px-5 bg-white dark:bg-[#080B11] border ${
                            formData.gstin.trim().length > 0 &&
                            !GSTIN_REGEX.test(formData.gstin.trim())
                              ? "border-rose-500 focus:border-rose-500"
                              : formData.gstin.trim().length === 15 &&
                                GSTIN_REGEX.test(formData.gstin.trim())
                              ? "border-emerald-500 focus:border-emerald-500"
                              : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D]"
                          } rounded-full focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none uppercase font-mono text-xs sm:text-sm font-bold tracking-wider`}
                        />
                      </div>
                      <div className="w-44 shrink-0">
                        <DatePicker
                          value={formData.gstDate}
                          onChange={(_, str) => handleChange("gstDate", str || "")}
                          placeholder="GST Date"
                          buttonClassName="h-11 px-4 rounded-full text-xs font-semibold"
                        />
                      </div>
                    </div>
                    {formData.gstin.trim().length > 0 &&
                      !GSTIN_REGEX.test(formData.gstin.trim()) && (
                        <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
                          Format: 15 alphanumeric characters (e.g. 24ABCDE1234F1Z5)
                        </p>
                      )}
                  </div>
                </div>

                {/* Side-by-Side: Central Sale Tax & Service Tax */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Central Sale Tax */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Central Sale Tax (CST)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.cstNo}
                        onChange={(e) => handleChange("cstNo", e.target.value)}
                        placeholder="Tax No"
                        className="flex-1 h-11 px-5 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                      <div className="w-44 shrink-0">
                        <DatePicker
                          value={formData.cstDate}
                          onChange={(_, str) => handleChange("cstDate", str || "")}
                          placeholder="CST Date"
                          buttonClassName="h-11 px-4 rounded-full text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Tax */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Service Tax
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.serviceTaxNo}
                        onChange={(e) => handleChange("serviceTaxNo", e.target.value)}
                        placeholder="Tax No"
                        className="flex-1 h-11 px-5 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                      <div className="w-44 shrink-0">
                        <DatePicker
                          value={formData.serviceTaxDate}
                          onChange={(_, str) => handleChange("serviceTaxDate", str || "")}
                          placeholder="Tax Date"
                          buttonClassName="h-11 px-4 rounded-full text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Tax */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Other Statutory Tax
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.otherTaxNo}
                        onChange={(e) => handleChange("otherTaxNo", e.target.value)}
                        placeholder="Other Tax ID"
                        className="flex-1 h-11 px-5 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                      <div className="w-44 shrink-0">
                        <DatePicker
                          value={formData.otherTaxDate}
                          onChange={(_, str) => handleChange("otherTaxDate", str || "")}
                          placeholder="Tax Date"
                          buttonClassName="h-11 px-4 rounded-full text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="p-4 bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 rounded-2xl text-xs text-[#0A0E1A] dark:text-slate-300 flex items-start gap-3 w-full mt-4 sm:mt-5 shadow-2xs">
                      <Info className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D] shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-medium">
                        Tax registrations will be automatically linked to invoices and delivery challans generated for this party.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Credit Terms & Limits */}
              <div className="rounded-2xl sm:rounded-3xl border border-[#E8C16D]/50 dark:border-[#E8C16D]/40 bg-white dark:bg-[#0F1626] p-5 sm:p-6 shadow-xs space-y-4 hover:border-[#E8C16D] dark:hover:border-[#E8C16D]/80 transition-all">
                <div className="flex items-center gap-2 pb-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/40 text-[#B88728] dark:text-[#E8C16D]">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0E1A] dark:text-white">
                    Credit Terms & Limits
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Bill Due Days */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Bill Due Days
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formData.billDueDays}
                        onChange={(e) => handleChange("billDueDays", e.target.value)}
                        placeholder="0"
                        className="w-full h-11 px-5 pr-14 text-right bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none font-bold text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-5 top-3.5 text-xs text-slate-400 font-bold pointer-events-none">
                        Days
                      </span>
                    </div>
                  </div>

                  {/* Credit Limit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Credit Limit (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.creditLimit}
                        onChange={(e) => handleChange("creditLimit", e.target.value)}
                        placeholder="0.00"
                        className="w-full h-11 px-5 pl-8 text-right bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none font-bold text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute left-5 top-3.5 text-xs text-slate-400 font-bold pointer-events-none">
                        ₹
                      </span>
                    </div>
                  </div>

                  {/* Debit Limit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Debit Limit (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.debitLimit}
                        onChange={(e) => handleChange("debitLimit", e.target.value)}
                        placeholder="0.00"
                        className="w-full h-11 px-5 pl-8 text-right bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-full text-[#0A0E1A] dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none font-bold text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute left-5 top-3.5 text-xs text-slate-400 font-bold pointer-events-none">
                        ₹
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer - Exact Layout from Screenshot */}
        <div className="px-6 sm:px-7 py-4 bg-white dark:bg-[#0A0E1A] border-t border-[#E7E0D2] dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 text-xs font-bold rounded-full border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-[#0A0E1A] dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={loading}
            className="h-10 px-6 bg-[#E8C16D] hover:bg-[#d4af5a] text-[#0A0E1A] rounded-full font-bold text-xs flex items-center gap-2 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving..." : `Save ${entityName}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
