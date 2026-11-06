"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Store,
  Building2,
  CreditCard,
  Settings as SettingsIcon,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Camera,
  Upload,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  Webstore,
  MARKETPLACE_CHANNELS,
} from "../types/webstore.types";
import { MarketplaceLogo } from "../utils/marketplaceLogos";
import { webstoreService } from "../services/webstore.service";
import ThemeSelectDropdown, {
  ThemeSelectOption,
} from "@/components/ui/ThemeSelectDropdown";
import DatePicker from "@/components/ui/DatePicker";
import { uploadImageToServer } from "@/components/Dashboard/Labels/Designer/utils/uploadImage";

const marketplaceOptions: ThemeSelectOption[] = MARKETPLACE_CHANNELS.map(
  (ch) => ({
    value: ch,
    label: ch,
  })
);

const parentOrChildOptions: ThemeSelectOption[] = [
  { value: "Parent", label: "Parent" },
  { value: "Child", label: "Child" },
];

const yesNoOptions: ThemeSelectOption[] = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const noYesOptions: ThemeSelectOption[] = [
  { value: "No", label: "No" },
  { value: "Yes", label: "Yes" },
];

interface WebstoreFormProps {
  initialData?: Webstore | null;
  nextCode?: number;
  onSave: (payload: Partial<Webstore> & Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function WebstoreForm({
  initialData,
  nextCode = 1,
  onSave,
  onCancel,
  isSaving,
}: WebstoreFormProps) {
  const isEdit = Boolean(initialData?.id);

  // 1. Basic Fields
  const [code, setCode] = useState<number>(initialData?.code ?? nextCode);
  const [marketplaceName, setMarketplaceName] = useState<string>(
    initialData?.marketplaceName || "Amazon"
  );
  const [marketplaceLogo, setMarketplaceLogo] = useState<string>(
    initialData?.marketplaceLogo || ""
  );
  const [storeName, setStoreName] = useState<string>(
    initialData?.storeName ?? "Chakudee Fashion - DROPSHIP"
  );
  const [parentOrChild, setParentOrChild] = useState<string>(
    initialData?.parentOrChild || "Parent"
  );
  const [registeredEmail, setRegisteredEmail] = useState<string>(
    initialData?.registeredEmail ?? "seller@domain.com"
  );
  const [contactUsEmail, setContactUsEmail] = useState<string>(
    initialData?.contactUsEmail ?? "support@domain.com"
  );
  const [registeredPhone, setRegisteredPhone] = useState<string>(
    initialData?.registeredPhone ?? "+91 9876543210"
  );
  const [contactUsPhone, setContactUsPhone] = useState<string>(
    initialData?.contactUsPhone ?? "+91 9876543210"
  );
  const [registrationDate, setRegistrationDate] = useState<string>(
    initialData?.registrationDate
      ? new Date(initialData.registrationDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  // 2. Address Fields
  const [billTo, setBillTo] = useState<string>(
    initialData?.billTo ?? "Chakudee Fashion Pvt Ltd"
  );
  const [address1, setAddress1] = useState<string>(
    initialData?.address1 ?? "101, Textile Market"
  );
  const [address2, setAddress2] = useState<string>(
    initialData?.address2 ?? "Ring Road"
  );
  const [city, setCity] = useState<string>(initialData?.city ?? "Surat");
  const [pincode, setPincode] = useState<string>(
    initialData?.pincode ?? "395002"
  );
  const [state, setState] = useState<string>(
    initialData?.state ?? "Gujarat"
  );
  const [gstNo, setGstNo] = useState<string>(
    initialData?.gstNo ?? "24AAAAA0000A1Z5"
  );

  // 3. Account Fields
  const [bankAccount, setBankAccount] = useState<string>(
    initialData?.bankAccount || "BOI Saving A/C 7199"
  );
  const [bankIfscCode, setBankIfscCode] = useState<string>(
    initialData?.bankIfscCode ?? "BKID0002199"
  );
  const [lastPaymentDate, setLastPaymentDate] = useState<string>(
    initialData?.lastPaymentDate
      ? new Date(initialData.lastPaymentDate).toISOString().split("T")[0]
      : ""
  );

  // 4. Configuration Fields
  const [isActive, setIsActive] = useState<boolean>(
    initialData?.isActive ?? true
  );
  const [returnActive, setReturnActive] = useState<boolean>(
    initialData?.returnActive ?? true
  );
  const [isOnTpBased, setIsOnTpBased] = useState<boolean>(
    initialData?.isOnTpBased ?? false
  );
  const [isOnResellerBased, setIsOnResellerBased] = useState<boolean>(
    initialData?.isOnResellerBased ?? false
  );
  const [validateStoreBeforeUploading, setValidateStoreBeforeUploading] =
    useState<boolean>(initialData?.validateStoreBeforeUploading ?? false);
  const [isManifestBasedSalesInvoice, setIsManifestBasedSalesInvoice] =
    useState<boolean>(initialData?.isManifestBasedSalesInvoice ?? false);
  const [warehouseCode, setWarehouseCode] = useState<string>(
    initialData?.warehouseCode ?? "WH-001"
  );

  // 5. Legacy API Configuration
  const [sellerId, setSellerId] = useState<string>(initialData?.sellerId || "");
  const [secretKey, setSecretKey] = useState<string>(
    initialData?.secretKey || ""
  );
  const [marketplaceId, setMarketplaceId] = useState<string>(
    initialData?.marketplaceId || ""
  );
  const [authToken, setAuthToken] = useState<string>(
    initialData?.authToken || ""
  );
  const [awsAccessKey, setAwsAccessKey] = useState<string>(
    initialData?.awsAccessKey || ""
  );
  const [endPoints, setEndPoints] = useState<string>(
    initialData?.endPoints || "https://mws.amazonservices.in"
  );

  // 6. SP-API Configuration
  const [spapiOauthCode, setSpapiOauthCode] = useState<string>(
    initialData?.spapiOauthCode || ""
  );
  const [sellingPartnerId, setSellingPartnerId] = useState<string>(
    initialData?.sellingPartnerId || ""
  );
  const [mwsAuthToken, setMwsAuthToken] = useState<string>(
    initialData?.mwsAuthToken || ""
  );
  const [refreshToken, setRefreshToken] = useState<string>(
    initialData?.refreshToken || ""
  );
  const [accessToken, setAccessToken] = useState<string>(
    initialData?.accessToken || ""
  );
  const [spMarketplaceId, setSpMarketplaceId] = useState<string>(
    initialData?.spMarketplaceId || "A21TJRUUN4KGV"
  );
  const [spClientId, setSpClientId] = useState<string>(
    initialData?.spClientId ?? "amzn1.application-oa2-client.a1b2c3d4e5f6"
  );
  const [spClientSecret, setSpClientSecret] = useState<string>(
    initialData?.spClientSecret || ""
  );
  const [spAwsAccessKey, setSpAwsAccessKey] = useState<string>(
    initialData?.spAwsAccessKey ?? "AKIA5HMFMRHKSOFGVNET"
  );
  const [spAwsSecretKey, setSpAwsSecretKey] = useState<string>(
    initialData?.spAwsSecretKey || ""
  );

  // Visibility toggles for keys
  const [showSpClientSecret, setShowSpClientSecret] = useState(false);
  const [showSpAwsSecretKey, setShowSpAwsSecretKey] = useState(false);
  const [showLegacySecretKey, setShowLegacySecretKey] = useState(false);

  // SP-API Test Connection state
  const [isTestingSpapi, setIsTestingSpapi] = useState(false);
  const [spapiTestResult, setSpapiTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Keep state synchronized with initialData (e.g. when modify fetches fresh data or user switches stores)
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(initialData.code ?? nextCode);
      setMarketplaceName(initialData.marketplaceName || "Amazon");
      setMarketplaceLogo(initialData.marketplaceLogo || "");
      setStoreName(initialData.storeName || "");
      setParentOrChild(initialData.parentOrChild || "Parent");
      setRegisteredEmail(initialData.registeredEmail || "");
      setContactUsEmail(initialData.contactUsEmail || "");
      setRegisteredPhone(initialData.registeredPhone || "");
      setContactUsPhone(initialData.contactUsPhone || "");
      setRegistrationDate(
        initialData.registrationDate
          ? new Date(initialData.registrationDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setBillTo(initialData.billTo || "");
      setAddress1(initialData.address1 || "");
      setAddress2(initialData.address2 || "");
      setCity(initialData.city || "");
      setPincode(initialData.pincode || "");
      setState(initialData.state || "");
      setGstNo(initialData.gstNo || "");
      setBankAccount(initialData.bankAccount || "BOI Saving A/C 7199");
      setBankIfscCode(initialData.bankIfscCode || "");
      setLastPaymentDate(
        initialData.lastPaymentDate
          ? new Date(initialData.lastPaymentDate).toISOString().split("T")[0]
          : ""
      );
      setIsActive(initialData.isActive ?? true);
      setReturnActive(initialData.returnActive ?? true);
      setIsOnTpBased(initialData.isOnTpBased ?? false);
      setIsOnResellerBased(initialData.isOnResellerBased ?? false);
      setValidateStoreBeforeUploading(
        initialData.validateStoreBeforeUploading ?? false
      );
      setIsManifestBasedSalesInvoice(
        initialData.isManifestBasedSalesInvoice ?? false
      );
      setWarehouseCode(initialData.warehouseCode || "");
      setSellerId(initialData.sellerId || "");
      setSecretKey(initialData.secretKey || "");
      setMarketplaceId(initialData.marketplaceId || "");
      setAuthToken(initialData.authToken || "");
      setAwsAccessKey(initialData.awsAccessKey || "");
      setEndPoints(initialData.endPoints || "https://mws.amazonservices.in");
      setSpapiOauthCode(initialData.spapiOauthCode || "");
      setSellingPartnerId(initialData.sellingPartnerId || "");
      setMwsAuthToken(initialData.mwsAuthToken || "");
      setRefreshToken(initialData.refreshToken || "");
      setAccessToken(initialData.accessToken || "");
      setSpMarketplaceId(initialData.spMarketplaceId || "A21TJRUUN4KGV");
      setSpClientId(initialData.spClientId || "");
      setSpClientSecret(initialData.spClientSecret || "");
      setSpAwsAccessKey(initialData.spAwsAccessKey || "");
      setSpAwsSecretKey(initialData.spAwsSecretKey || "");
    } else {
      setCode(nextCode);
      setMarketplaceName("Amazon");
      setMarketplaceLogo("");
      setStoreName(nextCode > 1 ? `Chakudee Fashion - DROPSHIP ${nextCode}` : "Chakudee Fashion - DROPSHIP");
      setParentOrChild("Parent");
      setRegisteredEmail("seller@domain.com");
      setContactUsEmail("support@domain.com");
      setRegisteredPhone("+91 9876543210");
      setContactUsPhone("+91 9876543210");
      setRegistrationDate(new Date().toISOString().split("T")[0]);
      setBillTo("Chakudee Fashion Pvt Ltd");
      setAddress1("101, Textile Market");
      setAddress2("Ring Road");
      setCity("Surat");
      setPincode("395002");
      setState("Gujarat");
      setGstNo("24AAAAA0000A1Z5");
      setBankAccount("BOI Saving A/C 7199");
      setBankIfscCode("BKID0002199");
      setLastPaymentDate("");
      setIsActive(true);
      setReturnActive(true);
      setIsOnTpBased(false);
      setIsOnResellerBased(false);
      setValidateStoreBeforeUploading(false);
      setIsManifestBasedSalesInvoice(false);
      setWarehouseCode("WH-001");
      setSellerId("");
      setSecretKey("");
      setMarketplaceId("");
      setAuthToken("");
      setAwsAccessKey("");
      setEndPoints("https://mws.amazonservices.in");
      setSpapiOauthCode("");
      setSellingPartnerId("");
      setMwsAuthToken("");
      setRefreshToken("");
      setAccessToken("");
      setSpMarketplaceId("A21TJRUUN4KGV");
      setSpClientId("amzn1.application-oa2-client.a1b2c3d4e5f6");
      setSpClientSecret("");
      setSpAwsAccessKey("AKIA5HMFMRHKSOFGVNET");
      setSpAwsSecretKey("");
    }
    setSpapiTestResult(null);
  }, [initialData, nextCode]);

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should not exceed 5MB.");
      return;
    }

    // 1. Instant local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setMarketplaceLogo(event.target.result);
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload to server
    try {
      setIsUploadingLogo(true);
      const uploadedUrl = await uploadImageToServer(file);
      if (uploadedUrl) {
        setMarketplaceLogo(uploadedUrl);
        toast.success("Logo uploaded successfully.");
      }
    } catch (err: unknown) {
      console.warn("Server upload failed, using local base64 preview:", err);
      toast.info("Custom logo loaded.");
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleResetLogo = () => {
    setMarketplaceLogo("");
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    toast.info("Reset to default channel logo.");
  };

  const handleTestSpapiConnection = async () => {
    if (!spClientId.trim() || !spClientSecret.trim() || !refreshToken.trim()) {
      toast.error(
        "Please enter Client ID, Client Secret, and Refresh Token to test connection."
      );
      return;
    }
    try {
      setIsTestingSpapi(true);
      setSpapiTestResult(null);
      const res = await webstoreService.testSpapiConnection({
        spClientId: spClientId.trim(),
        spClientSecret: spClientSecret.trim(),
        refreshToken: refreshToken.trim(),
      });
      setSpapiTestResult({ success: true, message: res.message });
      toast.success(res.message);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to verify SP-API connection.";
      setSpapiTestResult({
        success: false,
        message,
      });
      toast.error(message);
    } finally {
      setIsTestingSpapi(false);
    }
  };


  const handleFillDemoData = () => {
    setMarketplaceName("Amazon");
    setStoreName("Chakudee Fashion - DROPSHIP");
    setParentOrChild("Parent");
    setRegisteredEmail("seller@domain.com");
    setContactUsEmail("support@domain.com");
    setRegisteredPhone("+91 9876543210");
    setContactUsPhone("+91 9876543210");
    setRegistrationDate(new Date().toISOString().split("T")[0]);
    setBillTo("Chakudee Fashion Pvt Ltd");
    setAddress1("101, Textile Market");
    setAddress2("Ring Road");
    setCity("Surat");
    setPincode("395002");
    setState("Gujarat");
    setGstNo("24AAAAA0000A1Z5");
    setBankAccount("BOI Saving A/C 7199");
    setBankIfscCode("BKID0002199");
    setIsActive(true);
    setReturnActive(true);
    setIsOnTpBased(false);
    setIsOnResellerBased(false);
    setValidateStoreBeforeUploading(false);
    setIsManifestBasedSalesInvoice(false);
    setWarehouseCode("WH-001");
    setEndPoints("https://mws.amazonservices.in");
    setSpMarketplaceId("A21TJRUUN4KGV");
    setSpClientId("amzn1.application-oa2-client.a1b2c3d4e5f6");
    setSpAwsAccessKey("AKIA5HMFMRHKSOFGVNET");
    toast.success("Sample webstore information populated.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName.trim()) {
      toast.error("Please enter a Web Store name.");
      return;
    }
    if (!marketplaceName.trim()) {
      toast.error("Please select a Marketplace channel.");
      return;
    }

    const payload = {
      code: Number(code) || 0,
      marketplaceName: marketplaceName.trim(),
      marketplaceLogo: marketplaceLogo.trim() || undefined,
      storeName: storeName.trim(),
      parentOrChild,
      registeredEmail: registeredEmail.trim() || undefined,
      contactUsEmail: contactUsEmail.trim() || undefined,
      registeredPhone: registeredPhone.trim() || undefined,
      contactUsPhone: contactUsPhone.trim() || undefined,
      registrationDate: registrationDate ? new Date(registrationDate).toISOString() : undefined,

      billTo: billTo.trim() || undefined,
      address1: address1.trim() || undefined,
      address2: address2.trim() || undefined,
      city: city.trim() || undefined,
      pincode: pincode.trim() || undefined,
      state: state.trim() || undefined,
      gstNo: gstNo.trim() || undefined,

      bankAccount: bankAccount.trim() || undefined,
      bankIfscCode: bankIfscCode.trim() || undefined,
      lastPaymentDate: lastPaymentDate ? new Date(lastPaymentDate).toISOString() : undefined,

      isActive,
      returnActive,
      isOnTpBased,
      isOnResellerBased,
      validateStoreBeforeUploading,
      isManifestBasedSalesInvoice,
      warehouseCode: warehouseCode.trim() || undefined,

      sellerId: sellerId.trim() || undefined,
      secretKey: secretKey.trim() || undefined,
      marketplaceId: marketplaceId.trim() || undefined,
      authToken: authToken.trim() || undefined,
      awsAccessKey: awsAccessKey.trim() || undefined,
      endPoints: endPoints.trim() || undefined,

      spapiOauthCode: spapiOauthCode.trim() || undefined,
      sellingPartnerId: sellingPartnerId.trim() || undefined,
      mwsAuthToken: mwsAuthToken.trim() || undefined,
      refreshToken: refreshToken.trim() || undefined,
      accessToken: accessToken.trim() || undefined,
      spMarketplaceId: spMarketplaceId.trim() || undefined,
      spClientId: spClientId.trim() || undefined,
      spClientSecret: spClientSecret.trim() || undefined,
      spAwsAccessKey: spAwsAccessKey.trim() || undefined,
      spAwsSecretKey: spAwsSecretKey.trim() || undefined,
    };

    await onSave(payload);
  };

  const inputClass =
    "w-full h-9 px-3 text-xs rounded-xl border border-[#E7E0D2] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#E8C16D] focus:ring-2 focus:ring-[#E8C16D]/30 dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100 dark:focus:border-[#E8C16D] dark:focus:ring-[#E8C16D]/30 transition-all";

  const labelClass =
    "text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap text-right pr-2 min-w-[140px]";

  const fieldsetClass =
    "rounded-2xl sm:rounded-3xl border border-[#E7E0D2] bg-white p-4 sm:p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#0F1626]";

  const legendClass =
    "px-2.5 py-0.5 rounded-full text-xs font-bold text-[#B88728] dark:text-[#E8C16D] bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 inline-flex items-center gap-1.5";

  return (
    <form id="webstore-form" onSubmit={handleSubmit} className="space-y-4">
      {/* Autofill Demo Data Helper Banner */}
      {!isEdit && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-[#E7E0D2] dark:border-white/[0.08] bg-[#FFF9EC]/80 dark:bg-[#1A160E]/50 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-[#B88728] dark:text-[#E8C16D]">Quick Setup:</span>
            <span>Pre-populate starter configuration and credentials matching your marketplace specifications.</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemoData}
            className="px-4 py-1.5 rounded-full bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-95 text-[#0A0E1A] font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
          >
            Auto-fill Sample Info
          </button>
        </div>
      )}

      {/* 2-Column Top Layout matching Screenshot 3 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ===================== LEFT COLUMN ===================== */}
        <div className="space-y-4">
          {/* 1. Basic Fieldset */}
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>
              <Store className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Basic:</span>
            </legend>

            <div className="space-y-2.5 mt-1">
              {/* Code */}
              <div className="flex items-center">
                <label className={labelClass}>Code</label>
                <input
                  type="text"
                  value={code}
                  readOnly
                  disabled
                  className={`${inputClass} bg-slate-100 text-slate-500 cursor-not-allowed dark:bg-white/[0.04]`}
                />
              </div>

              {/* Marketplace Name */}
              <div className="flex items-center">
                <label className={labelClass}>Marketplace Name *</label>
                <div className="flex-1 w-full">
                  <ThemeSelectDropdown
                    value={marketplaceName}
                    onChange={(val) => setMarketplaceName(val)}
                    options={marketplaceOptions}
                    placeholder="Select Channel"
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs font-normal justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                    menuClassName="w-full min-w-[220px]"
                  />
                </div>
              </div>

              {/* Marketplace Logo Preview & Upload */}
              <div className="flex items-center">
                <label className={labelClass}>Marketplace Logo</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {/* Clickable Logo Box */}
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    title="Click to upload custom logo"
                    className="group relative cursor-pointer p-1 rounded-xl border border-[#E7E0D2] dark:border-white/[0.12] bg-slate-50 dark:bg-black/30 hover:border-[#E8C16D] dark:hover:border-[#E8C16D] transition-all shadow-xs"
                  >
                    <MarketplaceLogo
                      name={marketplaceName}
                      logoUrl={marketplaceLogo}
                      className="w-10 h-10"
                    />

                    {/* Hover Overlay with Camera/Upload Icon */}
                    <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      {isUploadingLogo ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#E8C16D]" />
                      ) : (
                        <Camera className="w-4 h-4 text-[#E8C16D]" />
                      )}
                    </div>
                  </div>

                  {/* Actions & Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-[#E7E0D2] dark:border-white/[0.1] bg-white dark:bg-[#080B11] text-slate-700 dark:text-slate-200 hover:border-[#E8C16D] dark:hover:border-[#E8C16D] hover:text-[#B88728] dark:hover:text-[#E8C16D] transition-all cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8C16D]" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-[#B88728] dark:text-[#E8C16D]" />
                          <span>{marketplaceLogo ? "Change Logo" : "Upload Logo"}</span>
                        </>
                      )}
                    </button>

                    {marketplaceLogo && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        title="Revert to default channel logo"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}

                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                      {marketplaceLogo ? "CUSTOM LOGO" : "CHANNEL LOGO"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Web Store Name */}
              <div className="flex items-center">
                <label className={labelClass}>Web Store *</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Chakudee Fashion-DROPSHIP"
                  required
                  className={inputClass}
                />
              </div>

              {/* Parent Or Child */}
              <div className="flex items-center">
                <label className={labelClass}>Parent Or Child</label>
                <div className="flex-1 w-full">
                  <ThemeSelectDropdown
                    value={parentOrChild}
                    onChange={(val) => setParentOrChild(val)}
                    options={parentOrChildOptions}
                    placeholder="Select..."
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs font-normal justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                    menuClassName="w-full min-w-[160px]"
                  />
                </div>
              </div>

              {/* Registered Email */}
              <div className="flex items-center">
                <label className={labelClass}>Registered Email</label>
                <input
                  type="email"
                  value={registeredEmail}
                  onChange={(e) => setRegisteredEmail(e.target.value)}
                  placeholder="seller@domain.com"
                  className={inputClass}
                />
              </div>

              {/* Contact Us Email */}
              <div className="flex items-center">
                <label className={labelClass}>Contactus Email</label>
                <input
                  type="email"
                  value={contactUsEmail}
                  onChange={(e) => setContactUsEmail(e.target.value)}
                  placeholder="support@domain.com"
                  className={inputClass}
                />
              </div>

              {/* Registered Contact No */}
              <div className="flex items-center">
                <label className={labelClass}>Registered Contact No</label>
                <input
                  type="text"
                  value={registeredPhone}
                  onChange={(e) => setRegisteredPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className={inputClass}
                />
              </div>

              {/* Contact Us Contact No */}
              <div className="flex items-center">
                <label className={labelClass}>Contactus Contact No</label>
                <input
                  type="text"
                  value={contactUsPhone}
                  onChange={(e) => setContactUsPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className={inputClass}
                />
              </div>

              {/* Date of Registration */}
              <div className="flex items-center">
                <label className={labelClass}>Date of Registration</label>
                <div className="flex-1 w-full">
                  <DatePicker
                    allowInput
                    value={registrationDate}
                    onChange={(_, dateStr) => setRegistrationDate(dateStr || "")}
                    placeholder="YYYY-MM-DD"
                    dateFormat="yyyy-MM-dd"
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* 3. Account Fieldset */}
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>
              <CreditCard className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Account:</span>
            </legend>

            <div className="space-y-2.5 mt-1">
              {/* Bank Account */}
              <div className="flex items-center">
                <label className={labelClass}>Bank Account</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. BOI Saving A/C 7199"
                  className={inputClass}
                />
              </div>

              {/* Bank IFSC Code */}
              <div className="flex items-center">
                <label className={labelClass}>Bank IFSC Code</label>
                <input
                  type="text"
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value)}
                  placeholder="BKID0007199"
                  className={inputClass}
                />
              </div>

              {/* Last Payment Date */}
              <div className="flex items-center">
                <label className={labelClass}>Last Payment Date</label>
                <div className="flex-1 w-full">
                  <DatePicker
                    allowInput
                    value={lastPaymentDate}
                    onChange={(_, dateStr) => setLastPaymentDate(dateStr || "")}
                    placeholder="YYYY-MM-DD"
                    dateFormat="yyyy-MM-dd"
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          </fieldset>
        </div>

        {/* ===================== RIGHT COLUMN ===================== */}
        <div className="space-y-4">
          {/* 2. Address Fieldset */}
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>
              <Building2 className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Address:</span>
            </legend>

            <div className="space-y-2.5 mt-1">
              {/* Bill To */}
              <div className="flex items-center">
                <label className={labelClass}>Bill To.</label>
                <input
                  type="text"
                  value={billTo}
                  onChange={(e) => setBillTo(e.target.value)}
                  placeholder="Company Billing Name"
                  className={inputClass}
                />
              </div>

              {/* Address 1 */}
              <div className="flex items-center">
                <label className={labelClass}>Address 1</label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="Flat/Premises No."
                  className={inputClass}
                />
              </div>

              {/* Address 2 */}
              <div className="flex items-center">
                <label className={labelClass}>Address 2</label>
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="Street / Landmark"
                  className={inputClass}
                />
              </div>

              {/* City */}
              <div className="flex items-center">
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Surat"
                  className={inputClass}
                />
              </div>

              {/* Pincode */}
              <div className="flex items-center">
                <label className={labelClass}>Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="395002"
                  className={inputClass}
                />
              </div>

              {/* State */}
              <div className="flex items-center">
                <label className={labelClass}>State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Gujarat"
                  className={inputClass}
                />
              </div>

              {/* GST No */}
              <div className="flex items-center">
                <label className={labelClass}>GST No.</label>
                <input
                  type="text"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  placeholder="24AAAAA0000A1Z5"
                  className={inputClass}
                />
              </div>
            </div>
          </fieldset>

          {/* 4. Configuration Fieldset */}
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>
              <SettingsIcon className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
              <span>Configuration:</span>
            </legend>

            <div className="space-y-2.5 mt-1">
              {/* Active */}
              <div className="flex items-center">
                <label className={labelClass}>Active</label>
                <div className="flex-1 w-full">
                  <ThemeSelectDropdown
                    value={isActive ? "Yes" : "No"}
                    onChange={(val) => setIsActive(val === "Yes")}
                    options={yesNoOptions}
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs font-normal justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                    menuClassName="w-full min-w-[140px]"
                  />
                </div>
              </div>

              {/* Return Active */}
              <div className="flex items-center">
                <label className={labelClass}>Return Active</label>
                <div className="flex-1 w-full">
                  <ThemeSelectDropdown
                    value={returnActive ? "Yes" : "No"}
                    onChange={(val) => setReturnActive(val === "Yes")}
                    options={yesNoOptions}
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs font-normal justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                    menuClassName="w-full min-w-[140px]"
                  />
                </div>
              </div>

              {/* Is On TP based */}
              <div className="flex items-center">
                <label className={labelClass}>Is On TP based</label>
                <div className="flex-1 w-full">
                  <ThemeSelectDropdown
                    value={isOnTpBased ? "Yes" : "No"}
                    onChange={(val) => setIsOnTpBased(val === "Yes")}
                    options={noYesOptions}
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs font-normal justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                    menuClassName="w-full min-w-[140px]"
                  />
                </div>
              </div>

              {/* Is On Re-seller based */}
              <div className="flex items-center">
                <label className={labelClass}>Is On Re-seller based</label>
                <div className="flex-1 w-full">
                  <ThemeSelectDropdown
                    value={isOnResellerBased ? "Yes" : "No"}
                    onChange={(val) => setIsOnResellerBased(val === "Yes")}
                    options={noYesOptions}
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs font-normal justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                    menuClassName="w-full min-w-[140px]"
                  />
                </div>
              </div>

              {/* Validate Store before Uploading */}
              <div className="flex items-center">
                <label className={labelClass}>Validate Store before Uploading</label>
                <div className="flex-1 w-full">
                  <ThemeSelectDropdown
                    value={validateStoreBeforeUploading ? "Yes" : "No"}
                    onChange={(val) =>
                      setValidateStoreBeforeUploading(val === "Yes")
                    }
                    options={noYesOptions}
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs font-normal justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                    menuClassName="w-full min-w-[140px]"
                  />
                </div>
              </div>

              {/* Is Manifest Based Sales Invoice */}
              <div className="flex items-center">
                <label className={labelClass}>Is Manifest Based Sales Invoice.</label>
                <div className="flex-1 w-full">
                  <ThemeSelectDropdown
                    value={isManifestBasedSalesInvoice ? "Yes" : "No"}
                    onChange={(val) =>
                      setIsManifestBasedSalesInvoice(val === "Yes")
                    }
                    options={noYesOptions}
                    className="w-full"
                    buttonClassName="w-full h-9 px-3 rounded-xl text-xs font-normal justify-between border-[#E7E0D2] dark:border-white/[0.12] dark:bg-[#080B11] dark:text-slate-100"
                    menuClassName="w-full min-w-[140px]"
                  />
                </div>
              </div>

              {/* Warehouse Code */}
              <div className="flex items-center">
                <label className={labelClass}>Warehouse Code.</label>
                <input
                  type="text"
                  value={warehouseCode}
                  onChange={(e) => setWarehouseCode(e.target.value)}
                  placeholder="WH-001"
                  className={inputClass}
                />
              </div>
            </div>
          </fieldset>
        </div>
      </div>

      {/* ===================== 5. API CONFIGURATION (FULL WIDTH) ===================== */}
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>
          <Key className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
          <span>API Configuration:</span>
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 mt-1">
          {/* Seller ID */}
          <div className="flex items-center">
            <label className={labelClass}>Seller ID.</label>
            <input
              type="text"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Secret Key */}
          <div className="flex items-center">
            <label className={labelClass}>Secret Key.</label>
            <div className="relative w-full">
              <input
                type={showLegacySecretKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className={`${inputClass} pr-8`}
              />
              <button
                type="button"
                onClick={() => setShowLegacySecretKey(!showLegacySecretKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showLegacySecretKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Marketplace ID */}
          <div className="flex items-center">
            <label className={labelClass}>Marketplace ID.</label>
            <input
              type="text"
              value={marketplaceId}
              onChange={(e) => setMarketplaceId(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Auth Token */}
          <div className="flex items-center">
            <label className={labelClass}>Auth Token.</label>
            <input
              type="text"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* AWS Access Key */}
          <div className="flex items-center">
            <label className={labelClass}>AWS Access Key.</label>
            <input
              type="text"
              value={awsAccessKey}
              onChange={(e) => setAwsAccessKey(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* End Points */}
          <div className="flex items-center">
            <label className={labelClass}>End Points</label>
            <input
              type="text"
              value={endPoints}
              onChange={(e) => setEndPoints(e.target.value)}
              placeholder="https://mws.amazonservices.in"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      {/* ===================== 6. SP-API CONFIGURATION (FULL WIDTH) ===================== */}
      <fieldset className={fieldsetClass}>
        <legend className={legendClass}>
          <ShieldCheck className="h-3.5 w-3.5 text-[#B88728] dark:text-[#E8C16D]" />
          <span>Selling Partner API Configuration:</span>
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 mt-1">
          {/* Spapi Oauth Code */}
          <div className="flex items-center">
            <label className={labelClass}>Spapi Oauth Code</label>
            <input
              type="text"
              value={spapiOauthCode}
              onChange={(e) => setSpapiOauthCode(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Marketplace ID */}
          <div className="flex items-center">
            <label className={labelClass}>Marketplace ID</label>
            <input
              type="text"
              value={spMarketplaceId}
              onChange={(e) => setSpMarketplaceId(e.target.value)}
              placeholder="A21TJRUUN4KGV"
              className={inputClass}
            />
          </div>

          {/* Selling Partner ID */}
          <div className="flex items-center">
            <label className={labelClass}>Selling Partner ID</label>
            <input
              type="text"
              value={sellingPartnerId}
              onChange={(e) => setSellingPartnerId(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Client ID */}
          <div className="flex items-center">
            <label className={labelClass}>Client ID</label>
            <input
              type="text"
              value={spClientId}
              onChange={(e) => setSpClientId(e.target.value)}
              placeholder="amzn1.application-oa2-client..."
              className={inputClass}
            />
          </div>

          {/* MWS Auth Token */}
          <div className="flex items-center">
            <label className={labelClass}>MWS Auth Token</label>
            <input
              type="text"
              value={mwsAuthToken}
              onChange={(e) => setMwsAuthToken(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Client Secret */}
          <div className="flex items-center">
            <label className={labelClass}>Client Secret</label>
            <div className="relative w-full">
              <input
                type={showSpClientSecret ? "text" : "password"}
                value={spClientSecret}
                onChange={(e) => setSpClientSecret(e.target.value)}
                className={`${inputClass} pr-8`}
              />
              <button
                type="button"
                onClick={() => setShowSpClientSecret(!showSpClientSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showSpClientSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Refresh Token */}
          <div className="flex items-center">
            <label className={labelClass}>Refresh Token</label>
            <input
              type="text"
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* AWS Access Key */}
          <div className="flex items-center">
            <label className={labelClass}>AWS Access Key</label>
            <input
              type="text"
              value={spAwsAccessKey}
              onChange={(e) => setSpAwsAccessKey(e.target.value)}
              placeholder="AKIA5MFMHRH3OFIGYNET"
              className={inputClass}
            />
          </div>

          {/* Access Token */}
          <div className="flex items-center">
            <label className={labelClass}>Access Token</label>
            <input
              type="text"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* AWS Secret Key */}
          <div className="flex items-center">
            <label className={labelClass}>AWS Secret Key</label>
            <div className="relative w-full">
              <input
                type={showSpAwsSecretKey ? "text" : "password"}
                value={spAwsSecretKey}
                onChange={(e) => setSpAwsSecretKey(e.target.value)}
                className={`${inputClass} pr-8`}
              />
              <button
                type="button"
                onClick={() => setShowSpAwsSecretKey(!showSpAwsSecretKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showSpAwsSecretKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* SP-API Test Connection & Validation Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestSpapiConnection}
              disabled={isTestingSpapi}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-[#B88728] bg-[#FFF9EC] hover:bg-[#FDF3DC] border border-[#E8C16D]/40 transition-all cursor-pointer dark:text-[#E8C16D] dark:bg-[#1A160E] dark:border-[#E8C16D]/30 disabled:opacity-60"
            >
              {isTestingSpapi ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Connecting with Amazon Auth...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Test SP-API Connection</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-400">
              Validates LWA Token with Amazon OAuth
            </span>
          </div>

          {/* Test Result Message */}
          {spapiTestResult && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                spapiTestResult.success
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40"
                  : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40"
              }`}
            >
              {spapiTestResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="truncate max-w-sm">{spapiTestResult.message}</span>
            </div>
          )}
        </div>
      </fieldset>

      {/* Form Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E7E0D2] dark:border-white/[0.08]">
        <button
          type="button"


          onClick={onCancel}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center px-6 rounded-full text-xs sm:text-sm font-bold border border-[#E7E0D2] bg-white text-slate-800 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-[#080B11] dark:text-slate-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Cancel</span>
        </button>

        <button
          type="submit"


          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 px-7 rounded-full text-xs sm:text-sm font-bold bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] text-[#0A0E1A] transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{isSaving ? "Saving..." : isEdit ? "Update Webstore" : "Create Webstore"}</span>
        </button>
      </div>
    </form>
  );
}
