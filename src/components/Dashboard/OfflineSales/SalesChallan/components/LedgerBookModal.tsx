"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Save,
  Undo2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  CreditCard,
  Check,
  FileText,
  Truck,
  Hash,
  ShieldCheck,
  Info,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#0F1626] rounded-3xl shadow-2xl border border-[#E7E0D2] dark:border-white/[0.08] w-full max-w-5xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-white dark:bg-[#0F1626] border-b border-[#E7E0D2] dark:border-white/[0.08] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF9EC] dark:bg-[#E8C16D]/10 border border-[#E8C16D]/30 text-[#B88728] dark:text-[#E8C16D]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Ledger Book
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Setting / Manage Company / Account / Ledger /{" "}
                <span className="text-[#B88728] dark:text-[#E8C16D] font-semibold">{entityName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave()}
              disabled={loading}
              title={`Save ${entityName}`}
              className="h-9 px-4 bg-[#0A0E1A] hover:bg-[#161D2E] text-white dark:bg-[#F5C451] dark:text-[#080B11] dark:hover:bg-[#E8B83D] rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving..." : `Save ${entityName}`}</span>
            </button>
            <button
              onClick={onClose}
              title="Cancel"
              className="h-9 w-9 border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl flex items-center justify-center transition-colors cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Header */}
        <div className="border-b border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/80 dark:bg-black/20 px-5 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2.5 rounded-t-xl border-t-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                activeTab === "general"
                  ? "bg-white dark:bg-[#0F1626] border-t-[#E8C16D] border-x border-[#E7E0D2] dark:border-white/[0.08] text-slate-900 dark:text-[#E8C16D] -mb-px shadow-xs"
                  : "border-t-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>General</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contact")}
              className={`px-4 py-2.5 rounded-t-xl border-t-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                activeTab === "contact"
                  ? "bg-white dark:bg-[#0F1626] border-t-[#E8C16D] border-x border-[#E7E0D2] dark:border-white/[0.08] text-slate-900 dark:text-[#E8C16D] -mb-px shadow-xs"
                  : "border-t-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Contact</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("accounting")}
              className={`px-4 py-2.5 rounded-t-xl border-t-2 transition-all cursor-pointer flex items-center gap-2 font-bold ${
                activeTab === "accounting"
                  ? "bg-white dark:bg-[#0F1626] border-t-[#E8C16D] border-x border-[#E7E0D2] dark:border-white/[0.08] text-slate-900 dark:text-[#E8C16D] -mb-px shadow-xs"
                  : "border-t-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Accounting</span>
            </button>
          </div>
        </div>

        {/* Tab Content Form */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#0F1626] max-h-[72vh] overflow-y-auto custom-scrollbar">
          {/* TAB 1: GENERAL (Side-by-Side Modern Card Layout) */}
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Card 1: Basic Identity */}
              <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
                  <Building2 className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Party Identity & Basic Information
                  </h3>
                </div>

                {/* Hero Field: Account / Ledger / Party Name (Full Width) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Account / Ledger / Party Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] text-rose-500 dark:text-rose-400 font-medium">
                      Required
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.partyName}
                      onChange={(e) => handleChange("partyName", e.target.value)}
                      placeholder="Enter Account, Ledger, or Party Name..."
                      className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Account Code & Alias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Account Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>Account Code</span>
                    </label>
                    <input
                      type="text"
                      value={formData.accountCode}
                      onChange={(e) => handleChange("accountCode", e.target.value)}
                      placeholder="e.g. ACC-001"
                      className="w-full h-9.5 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Alias */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Alias
                      </label>
                      <span className="text-[10px] text-[#B88728] dark:text-[#E8C16D] font-medium">
                        Set 'Marketplace' for channel sales
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.alias}
                      onChange={(e) => handleChange("alias", e.target.value)}
                      placeholder="e.g. Marketplace, Nickname"
                      className="w-full h-9.5 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Account Head / Group & Contact Person */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Account Head / Group */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Account Head / Group
                    </label>
                    <ThemeSelectDropdown
                      value={formData.accountHead}
                      onChange={(val) => handleChange("accountHead", val)}
                      options={ACCOUNT_HEAD_SELECT_OPTIONS}
                      className="w-full"
                      buttonClassName="w-full justify-between h-9.5 px-3 text-xs sm:text-sm font-medium rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-800 dark:text-white"
                      menuClassName="w-full min-w-full !max-w-none"
                    />
                  </div>

                  {/* Contact Person */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact Person</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleChange("contactPerson", e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full h-9.5 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Contact, Financial & Status */}
              <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
                  <Wallet className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Financial Balance & Communication
                  </h3>
                </div>

                {/* Side-by-Side: Email ID & Opening Balance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email ID</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="party@example.com"
                      className="w-full h-9.5 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Opening Balance + Credit / Debit Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Opening Balance</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-400">Balance Type</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-semibold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.openingBalance}
                          onChange={(e) => handleChange("openingBalance", e.target.value)}
                          className="w-full h-9.5 pl-7 pr-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium"
                        />
                      </div>
                      <div className="flex bg-slate-100 dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl p-1 gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleChange("balanceType", "Credit")}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            formData.balanceType === "Credit"
                              ? "bg-[#E8C16D] text-slate-950 shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Credit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange("balanceType", "Debit")}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            formData.balanceType === "Debit"
                              ? "bg-[#E8C16D] text-slate-950 shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Debit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side: Join Date & Is Active */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Join Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                      <span>Join Date</span>
                    </label>
                    <DatePicker
                      value={formData.joinDate}
                      onChange={(_, str) => handleChange("joinDate", str || "")}
                      placeholder="Select Join Date"
                      buttonClassName="h-9.5 px-3 rounded-xl text-xs sm:text-sm font-medium"
                    />
                  </div>

                  {/* Is Active Status Switch */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Party Status
                    </label>
                    <div className="grid grid-cols-2 gap-2 h-9.5">
                      <button
                        type="button"
                        onClick={() => handleChange("isActive", true)}
                        className={`h-9.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                          formData.isActive
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                            : "border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            formData.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange("isActive", false)}
                        className={`h-9.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                          !formData.isActive
                            ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-xs"
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs sm:text-sm">
              {/* LEFT CARD: Billing Address */}
              <div className="space-y-3 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
                  <MapPin className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Billing Address
                  </h3>
                </div>

                {/* Address 1 */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                    Address1
                  </label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange("addressLine1", e.target.value)}
                    placeholder="Building / Flat / Street..."
                    className="w-full h-9 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Side-by-Side: Address 2 & Address 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Address2
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine2}
                      onChange={(e) => handleChange("addressLine2", e.target.value)}
                      placeholder="Locality / Landmark"
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Address3
                    </label>
                    <input
                      type="text"
                      value={formData.addressLine3}
                      onChange={(e) => handleChange("addressLine3", e.target.value)}
                      placeholder="Additional details"
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Area & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Area
                    </label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => handleChange("area", e.target.value)}
                      placeholder="e.g. Varachha"
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Country
                    </label>
                    <ThemeSelectDropdown
                      value={formData.country}
                      onChange={(val) => handleChange("country", val)}
                      options={COUNTRY_OPTIONS}
                      className="w-full"
                      buttonClassName="w-full justify-between h-9 px-3 text-xs sm:text-sm font-medium rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-800 dark:text-white"
                      menuClassName="w-full min-w-full !max-w-none"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Pincode & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => handleChange("pincode", e.target.value)}
                      placeholder="e.g. 395006"
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      placeholder="e.g. Gujarat"
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Phone No & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>Phone No</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      placeholder="e.g. Surat"
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: Shipping Address */}
              <div className="space-y-3 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#E7E0D2]/60 dark:border-white/[0.06] flex-wrap">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Shipping Address
                    </h3>
                  </div>
                  <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.shippingSameAsBilling}
                      onChange={(e) =>
                        handleToggleShippingSameAsBilling(e.target.checked)
                      }
                      className="rounded accent-[#E8C16D] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-medium">Same as Billing</span>
                  </label>
                </div>

                {/* Address 1 */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
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
                    className="w-full h-9 px-3 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Side-by-Side: Address 2 & Address 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
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
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
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
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Area & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
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
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      Country
                    </label>
                    <ThemeSelectDropdown
                      disabled={formData.shippingSameAsBilling}
                      value={formData.shippingCountry}
                      onChange={(val) => handleChange("shippingCountry", val)}
                      options={COUNTRY_OPTIONS}
                      className="w-full"
                      buttonClassName="w-full justify-between h-9 px-3 text-xs sm:text-sm font-medium rounded-xl border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#080B11] text-slate-800 dark:text-white disabled:bg-slate-100 dark:disabled:bg-white/[0.04] disabled:text-slate-400 dark:disabled:text-slate-600"
                      menuClassName="w-full min-w-full !max-w-none"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Pincode & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
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
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
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
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Side-by-Side: Phone No & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
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
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
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
                      className="w-full h-9 px-3 text-xs sm:text-sm bg-white disabled:bg-slate-100 dark:bg-[#080B11] dark:disabled:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white disabled:text-slate-400 dark:disabled:text-slate-600 focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTING (Side-by-Side Cards for Tax, Limits & Banking) */}
          {activeTab === "accounting" && (
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Card 1: Tax Registrations & Identification */}
              <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
                  <ShieldCheck className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Statutory & Tax Registrations
                  </h3>
                </div>

                {/* Side-by-Side: PAN & GSTIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* PAN */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                      className="w-full h-9.5 px-3 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none transition-all uppercase font-mono text-xs sm:text-sm"
                    />
                  </div>

                  {/* GSTIN No + Date Combined */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        GSTIN Number & Date
                      </label>
                      {formData.gstin.trim().length === 15 &&
                        GSTIN_REGEX.test(formData.gstin.trim()) && (
                          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
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
                          className={`w-full h-9.5 px-3 bg-white dark:bg-[#080B11] border ${
                            formData.gstin.trim().length > 0 &&
                            !GSTIN_REGEX.test(formData.gstin.trim())
                              ? "border-rose-500 focus:border-rose-500"
                              : formData.gstin.trim().length === 15 &&
                                GSTIN_REGEX.test(formData.gstin.trim())
                              ? "border-emerald-500 focus:border-emerald-500"
                              : "border-slate-200 dark:border-white/[0.08] focus:border-[#E8C16D]"
                          } rounded-xl focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none uppercase font-mono text-xs sm:text-sm`}
                        />
                      </div>
                      <div className="w-40 shrink-0">
                        <DatePicker
                          value={formData.gstDate}
                          onChange={(_, str) => handleChange("gstDate", str || "")}
                          placeholder="GST Date"
                          buttonClassName="h-9.5 px-2.5 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                    {formData.gstin.trim().length > 0 &&
                      !GSTIN_REGEX.test(formData.gstin.trim()) && (
                        <p className="text-[11px] text-rose-500 dark:text-rose-400">
                          Format: 15 alphanumeric characters (e.g. 24ABCDE1234F1Z5)
                        </p>
                      )}
                  </div>
                </div>

                {/* Side-by-Side: Central Sale Tax & Service Tax */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Central Sale Tax */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Central Sale Tax (CST)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.cstNo}
                        onChange={(e) => handleChange("cstNo", e.target.value)}
                        placeholder="Tax No"
                        className="flex-1 h-9.5 px-3 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none text-xs sm:text-sm"
                      />
                      <div className="w-40 shrink-0">
                        <DatePicker
                          value={formData.cstDate}
                          onChange={(_, str) => handleChange("cstDate", str || "")}
                          placeholder="CST Date"
                          buttonClassName="h-9.5 px-2.5 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Tax */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Service Tax
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.serviceTaxNo}
                        onChange={(e) => handleChange("serviceTaxNo", e.target.value)}
                        placeholder="Tax No"
                        className="flex-1 h-9.5 px-3 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none text-xs sm:text-sm"
                      />
                      <div className="w-40 shrink-0">
                        <DatePicker
                          value={formData.serviceTaxDate}
                          onChange={(_, str) => handleChange("serviceTaxDate", str || "")}
                          placeholder="Tax Date"
                          buttonClassName="h-9.5 px-2.5 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Tax */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Other Statutory Tax
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formData.otherTaxNo}
                        onChange={(e) => handleChange("otherTaxNo", e.target.value)}
                        placeholder="Other Tax ID"
                        className="flex-1 h-9.5 px-3 bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none text-xs sm:text-sm"
                      />
                      <div className="w-40 shrink-0">
                        <DatePicker
                          value={formData.otherTaxDate}
                          onChange={(_, str) => handleChange("otherTaxDate", str || "")}
                          placeholder="Tax Date"
                          buttonClassName="h-9.5 px-2.5 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="p-3 bg-amber-500/5 dark:bg-[#E8C16D]/5 border border-[#E8C16D]/20 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2 w-full mt-5">
                      <Info className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D] shrink-0 mt-0.5" />
                      <span>
                        Tax registrations will be automatically linked to invoices and delivery challans generated for this party.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Credit Limits & Terms */}
              <div className="rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E0D2]/60 dark:border-white/[0.06]">
                  <CreditCard className="w-4 h-4 text-[#B88728] dark:text-[#E8C16D]" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Credit Terms & Limits
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Bill Due Days */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Bill Due Days
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={formData.billDueDays}
                        onChange={(e) => handleChange("billDueDays", e.target.value)}
                        placeholder="0"
                        className="w-full h-9.5 px-3 pr-12 text-right bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none font-semibold text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                        Days
                      </span>
                    </div>
                  </div>

                  {/* Credit Limit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                        className="w-full h-9.5 px-3 pl-7 text-right bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none font-semibold text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                        ₹
                      </span>
                    </div>
                  </div>

                  {/* Debit Limit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                        className="w-full h-9.5 px-3 pl-7 text-right bg-white dark:bg-[#080B11] border border-slate-200 dark:border-white/[0.08] rounded-xl text-slate-800 dark:text-white focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/20 focus:outline-none font-semibold text-xs sm:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                        ₹
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-black/20 border-t border-[#E7E0D2] dark:border-white/[0.08] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="h-9.5 px-4 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={loading}
            className="h-9.5 px-5 bg-[#0A0E1A] hover:bg-[#161D2E] text-white dark:bg-[#F5C451] dark:text-[#080B11] dark:hover:bg-[#E8B83D] rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving..." : `Save ${entityName}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
