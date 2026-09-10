"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Printer, Download, ExternalLink, ShieldCheck, CheckCheck, RefreshCw, AlertCircle } from "lucide-react";
import DiagnosticPanel from "./components/DiagnosticPanel";
import InstallationSteps from "./components/InstallationSteps";
import TroubleshootingRef from "./components/TroubleshootingRef";
import {
  DEFAULT_EXTENSION_ID,
  INSTALLER_URL,
  STORE_URL,
  VIRTUAL_PRINTERS,
  askExtension,
  hasExtensionMessaging,
  looksLikeWindows,
} from "./services/printBridgeDiagnostic.service";
import { DiagnosticRow, GetPrintersResponse, HostTestResponse, PingResponse, Verdict } from "./types";

export default function PrintBridgePage() {
  const [extensionId, setExtensionId] = useState(DEFAULT_EXTENSION_ID);
  const [isChecking, setIsChecking] = useState(false);
  const [isWindows, setIsWindows] = useState(true);
  const [siteHost, setSiteHost] = useState("chakudee.com");

  const [rows, setRows] = useState<{
    ext: DiagnosticRow;
    toggle: DiagnosticRow;
    host: DiagnosticRow;
    printer: DiagnosticRow;
  }>({
    ext: { state: "busy", note: "Checking…" },
    toggle: { state: "busy", note: "Waiting…" },
    host: { state: "busy", note: "Waiting…" },
    printer: { state: "busy", note: "Waiting…" },
  });

  const [verdict, setVerdict] = useState<Verdict>({
    state: "busy",
    title: "Checking this computer…",
    foot: "This check runs in your browser and talks only to the extension on this computer.",
  });

  useEffect(() => {
    setIsWindows(looksLikeWindows());
    if (typeof window !== "undefined") {
      setSiteHost(window.location.host || "chakudee.com");
    }
  }, []);

  const runDiagnostics = useCallback(async (currentExtId: string) => {
    setIsChecking(true);
    setRows({
      ext: { state: "busy", note: "Checking…" },
      toggle: { state: "busy", note: "Waiting…" },
      host: { state: "busy", note: "Waiting…" },
      printer: { state: "busy", note: "Waiting…" },
    });
    setVerdict({
      state: "busy",
      title: "Checking this computer…",
      foot: "This check runs in your browser and talks only to the extension on this computer.",
    });

    if (!hasExtensionMessaging()) {
      setRows({
        ext: { state: "fail", note: "This browser cannot run PrintBridge. Use Chrome, Edge, or Brave." },
        toggle: { state: "fail", note: "Needs a Chromium browser." },
        host: { state: "fail", note: "Needs a Chromium browser." },
        printer: { state: "fail", note: "Needs a Chromium browser." },
      });
      setVerdict({
        state: "fail",
        title: "Unsupported browser",
        foot: "PrintBridge works in Chrome, Edge, and Brave.",
      });
      setIsChecking(false);
      return;
    }

    // 1. Extension Check
    try {
      const pong = await askExtension<PingResponse>(currentExtId, { type: "PING" });
      const versionNote = pong.version ? ` · v${pong.version}` : "";
      setRows((prev) => ({
        ...prev,
        ext: { state: "ok", note: `Installed${versionNote}` },
      }));

      // 2. Toggle Switch Check
      const silentOn = pong.silentPrinting === true;
      setRows((prev) => ({
        ...prev,
        toggle: silentOn
          ? { state: "ok", note: "ON (Direct silent printing active)" }
          : { state: "warn", note: "OFF. Click the PrintBridge icon in Chrome toolbar and turn Silent Printing to ON." },
      }));

      // 3. Native Host Program Check
      try {
        const hostResult = await askExtension<HostTestResponse>(currentExtId, { type: "PRINT_PDF_TEST" });
        if (hostResult.success !== true) {
          setRows((prev) => ({
            ...prev,
            host: { state: "fail", note: hostResult.error || "The Windows program did not respond." },
            printer: { state: "fail", note: "Cannot check until the Windows program is installed." },
          }));
          setVerdict({
            state: "fail",
            title: "Windows program not installed",
            foot: "Download the installer below and follow step 3.",
          });
          setIsChecking(false);
          return;
        }

        const hostVersion = hostResult.version ? ` · v${hostResult.version}` : "";
        setRows((prev) => ({
          ...prev,
          host: { state: "ok", note: `Connected${hostVersion}` },
        }));

        // 4. Usable Printer Check
        try {
          const printerResult = await askExtension<GetPrintersResponse>(currentExtId, { type: "GET_PRINTERS" });
          const list = printerResult?.printers || [];
          const realPrinters = list.filter((p) => {
            const name = String(p.name || "").toLowerCase();
            return name && !VIRTUAL_PRINTERS.some((vp) => name.includes(vp));
          });

          let printerOk = false;
          if (!list.length) {
            setRows((prev) => ({
              ...prev,
              printer: { state: "fail", note: "Windows reports no printers on this computer." },
            }));
          } else if (!realPrinters.length) {
            setRows((prev) => ({
              ...prev,
              printer: {
                state: "warn",
                note: "Only virtual printers found. Add a real printer and set it as default in Windows.",
              },
            }));
          } else {
            printerOk = true;
            const chosen = realPrinters.find((p) => p.isDefault) || realPrinters[0];
            const extraCount = realPrinters.length > 1 ? ` (+${realPrinters.length - 1} more)` : "";
            setRows((prev) => ({
              ...prev,
              printer: { state: "ok", note: `${chosen.name}${extraCount}` },
            }));
          }

          if (!silentOn) {
            setVerdict({
              state: "warn",
              title: "Almost ready",
              foot: "Turn Silent Printing ON in the Chrome extension popup, then click Re-check.",
            });
          } else if (!printerOk) {
            setVerdict({
              state: "warn",
              title: "No usable printer",
              foot: "PrintBridge is installed, but Windows has no physical printer connected.",
            });
          } else {
            setVerdict({
              state: "ok",
              title: "Everything is ready",
              foot: `Printing from ${siteHost} will go straight to your thermal printer.`,
            });
          }
        } catch {
          setRows((prev) => ({
            ...prev,
            printer: { state: "warn", note: "Could not read the printer list." },
          }));
          setVerdict({
            state: "warn",
            title: "Almost ready",
            foot: "Turn Silent Printing ON in the extension popup, then re-check.",
          });
        }
      } catch {
        setRows((prev) => ({
          ...prev,
          host: { state: "fail", note: "No response. The Windows program is probably not installed." },
          printer: { state: "fail", note: "Cannot check until the Windows program is installed." },
        }));
        setVerdict({
          state: "fail",
          title: "Windows program not installed",
          foot: "Download the installer below and follow step 3.",
        });
      }
    } catch {
      setRows({
        ext: { state: "fail", note: "Not found in this browser." },
        toggle: { state: "fail", note: "Install the extension first." },
        host: { state: "fail", note: "Install the extension first." },
        printer: { state: "fail", note: "Install the extension first." },
      });
      setVerdict({
        state: "fail",
        title: "Extension not installed",
        foot: "Start with step 1 below.",
      });
    } finally {
      setIsChecking(false);
    }
  }, [siteHost]);

  useEffect(() => {
    runDiagnostics(extensionId);
  }, [extensionId, runDiagnostics]);

  const handleCopyText = (text: string, callback: () => void) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(callback, () => {
        fallbackCopy(text, callback);
      });
    } else {
      fallbackCopy(text, callback);
    }
  };

  const fallbackCopy = (text: string, callback: () => void) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "readonly");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand("copy");
      callback();
    } catch {
      // ignore
    }
    document.body.removeChild(field);
  };

  return (
    <main className="min-h-screen w-full bg-background py-8 text-foreground">
      <div className="mx-auto w-full max-w-[1750px] space-y-8 px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Masthead Header */}
        <header className="flex flex-wrap items-center justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0A0E1A] text-[#E8C16D] shadow-sm">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#0A0E1A] dark:text-white">
                  OrderOS PrintBridge
                </span>
                <span className="rounded-md bg-[#E8C16D]/20 px-2 py-0.5 text-xs font-bold text-[#0A0E1A] dark:text-[#E8C16D]">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                1-Click Direct Silent Printing Subsystem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 font-mono text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Windows 10/11 64-bit Compatible
          </div>
        </header>

        {/* Hero Section */}
        <div className="space-y-2 border-l-4 border-[#E8C16D] bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A0E1A] dark:text-white sm:text-3xl">
            Set Up 1-Click Silent Printing
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            PrintBridge enables <strong>{siteHost}</strong> to send shipping labels and tax invoices
            directly to your thermal printer (TSC, Zebra, DA310) without triggering Chrome print dialog popups.
          </p>
        </div>

        {!isWindows && (
          <div className="flex items-center gap-3 border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>
              You appear to be visiting from a non-Windows OS. The PrintBridge Windows background installer is required on the PC connected to your thermal printer.
            </span>
          </div>
        )}

        {/* Diagnostic Panel */}
        <DiagnosticPanel
          verdict={verdict}
          rows={rows}
          isChecking={isChecking}
          onRecheck={() => runDiagnostics(extensionId)}
        />

        {/* Primary Download Card */}
        <div className="flex flex-col gap-4 border border-[#E7E0D2] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:bg-card">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#0A0E1A] dark:text-white">
              Download PrintBridge Windows Package
            </h3>
            <p className="text-xs text-muted-foreground">
              Includes native messaging host service & Sumatra silent PDF print engine (37.8 MB).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              id="installExtBtn"
              href={STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 border border-[#0A0E1A] bg-[#0A0E1A] px-6 text-sm font-bold text-white transition hover:bg-[#E8C16D] hover:text-[#0A0E1A] dark:border-white dark:bg-slate-800 dark:hover:bg-[#E8C16D] dark:hover:text-[#0A0E1A]"
            >
              <ExternalLink className="h-4 w-4" />
              Install Extension
            </a>

            <a
              id="downloadBtn"
              href={INSTALLER_URL}
              download
              className="inline-flex h-12 items-center justify-center gap-2 border border-[#E8C16D] bg-[#E8C16D] px-6 text-sm font-bold text-[#0A0E1A] transition hover:bg-[#0A0E1A] hover:text-[#E8C16D]"
            >
              <Download className="h-4 w-4" />
              Download PrintBridge Setup
            </a>
          </div>
        </div>

        {/* Chrome Safe Browsing Helper Note */}
        <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300">
          <ShieldCheck className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Chrome Download Note:</strong> If Chrome displays <em>"This file isn't commonly downloaded"</em>, click <strong>Download suspicious file</strong> (or <strong>Keep</strong>) to complete the download. This occurs because the installer is a custom internal <code>.exe</code> file.
          </span>
        </div>

        {/* Installation Steps */}
        <InstallationSteps
          extensionId={extensionId}
          onApplyExtensionId={(newId) => setExtensionId(newId)}
          onCopyText={handleCopyText}
        />

        {/* Troubleshooting Reference */}
        <TroubleshootingRef onCopyText={handleCopyText} />
      </div>
    </main>
  );
}
