"use client";

import React, { useState } from "react";
import { ExternalLink, Copy, Check, Key, Download, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { isValidExtensionId } from "../services/printBridgeDiagnostic.service";

interface InstallationStepsProps {
  extensionId: string;
  onApplyExtensionId: (newId: string) => void;
  onCopyText: (text: string, callback: () => void) => void;
}

export default function InstallationSteps({
  extensionId,
  onApplyExtensionId,
  onCopyText,
}: InstallationStepsProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [altIdInput, setAltIdInput] = useState("");
  const [altIdMsg, setAltIdMsg] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  const handleCopyExtId = () => {
    onCopyText(extensionId, () => {
      setCopiedId(true);
      toast.success("Extension ID copied to clipboard!");
      setTimeout(() => setCopiedId(false), 1800);
    });
  };

  const handleApplyAltId = () => {
    const val = altIdInput.trim().toLowerCase();
    if (!isValidExtensionId(val)) {
      setIsInvalid(true);
      setAltIdMsg("That is not a valid ID. It must be exactly 32 letters, a to p.");
      toast.error("Invalid Extension ID format.");
      return;
    }
    setIsInvalid(false);
    setAltIdMsg("");
    onApplyExtensionId(val);
    toast.success("Extension ID updated!");
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-xl font-bold tracking-tight text-[#0A0E1A] dark:text-white">
          Installation Guide
        </h2>
        <p className="text-xs text-muted-foreground">
          Follow these 3 simple steps to complete 1-click silent printing setup on your PC.
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className="border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0A0E1A] text-sm font-bold text-[#E8C16D]">
              1
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-bold text-[#0A0E1A] dark:text-white">
                  Add the Chrome Extension
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Install PrintBridge from the Chrome Web Store, then open it once from your browser
                  toolbar and turn <strong>Silent Printing</strong> to ON.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`https://chromewebstore.google.com/detail/printbridge/${extensionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 bg-[#0A0E1A] px-4 text-xs font-semibold text-[#E8C16D] transition hover:bg-[#161D2E]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Chrome Web Store
                </a>
                <span className="text-xs text-muted-foreground">
                  Works on Google Chrome, Microsoft Edge, and Brave.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0A0E1A] text-sm font-bold text-[#E8C16D]">
              2
            </div>

            <div className="w-full space-y-3">
              <div>
                <h3 className="text-lg font-bold text-[#0A0E1A] dark:text-white">
                  Copy Your Extension ID
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The Windows installer requires this unique extension ID to securely pair with your
                  browser.
                </p>
              </div>

              {/* Copy Row */}
              <div className="flex w-full max-w-2xl items-center border border-border bg-muted/30">
                <code className="flex-1 overflow-x-auto px-4 py-2.5 font-mono text-xs font-semibold text-[#0A0E1A] dark:text-white">
                  {extensionId}
                </code>
                <button
                  type="button"
                  onClick={handleCopyExtId}
                  className="flex h-10 items-center gap-1.5 border-l border-border bg-[#0A0E1A] px-4 text-xs font-semibold text-[#E8C16D] transition hover:bg-[#161D2E]"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy ID
                    </>
                  )}
                </button>
              </div>

              {/* Collapsible unpack override */}
              <details className="group mt-2">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground transition hover:text-[#0A0E1A] dark:hover:text-white">
                  Need to use a custom or unpacked extension ID?
                </summary>
                <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground">
                    If loaded unpacked, copy the 32-letter ID from{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      chrome://extensions
                    </code>
                    .
                  </p>
                  <div className="flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      maxLength={32}
                      placeholder="Enter 32-letter ID (a-p)"
                      value={altIdInput}
                      onChange={(e) => setAltIdInput(e.target.value)}
                      className={`h-10 flex-1 border bg-background px-3 font-mono text-xs text-foreground outline-none transition focus:border-[#E8C16D] ${
                        isInvalid ? "border-rose-500" : "border-border"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleApplyAltId}
                      className="h-10 border border-[#E8C16D] bg-[#0A0E1A] px-4 text-xs font-semibold text-[#E8C16D] transition hover:bg-[#E8C16D] hover:text-[#0A0E1A]"
                    >
                      Verify ID
                    </button>
                  </div>
                  {altIdMsg && <p className="text-xs text-rose-500">{altIdMsg}</p>}
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0A0E1A] text-sm font-bold text-[#E8C16D]">
              3
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-bold text-[#0A0E1A] dark:text-white">
                  Run Windows Setup Installer
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Launch <strong>PrintBridge-Setup.exe</strong> on Windows and paste your Extension ID
                  when prompted.
                </p>
              </div>

              <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p>
                  • Requires Windows Administrator permissions.
                  <br />• Bundles all native printing components (no extra dependencies needed).
                  <br />• After installation completes, reopen your browser and click{" "}
                  <strong>Re-check Connection</strong> above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
