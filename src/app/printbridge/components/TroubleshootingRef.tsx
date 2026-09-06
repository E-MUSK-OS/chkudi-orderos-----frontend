"use client";

import React, { useState } from "react";
import { HelpCircle, Copy, Check, FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface TroubleshootingRefProps {
  onCopyText: (text: string, callback: () => void) => void;
}

export default function TroubleshootingRef({ onCopyText }: TroubleshootingRefProps) {
  const [copiedLogPath, setCopiedLogPath] = useState(false);
  const logPathText = "C:\\ProgramData\\PrintBridge\\logs\\host.log";

  const handleCopyLogPath = () => {
    onCopyText(logPathText, () => {
      setCopiedLogPath(true);
      toast.success("Log path copied to clipboard!");
      setTimeout(() => setCopiedLogPath(false), 1800);
    });
  };

  const faqs = [
    {
      q: "The check says the extension is missing, but it is installed",
      a: (
        <>
          The Extension ID on this page may not match your browser instance. Open{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
            chrome://extensions
          </code>
          , turn on Developer Mode, and verify the 32-letter ID under PrintBridge in Step 2.
        </>
      ),
    },
    {
      q: "The check says the Windows program is missing",
      a: "Either the installer was not run on this computer, or it was configured with a different Extension ID. Re-run PrintBridge-Setup.exe, paste your exact Extension ID, and restart your browser.",
    },
    {
      q: "Printing starts but nothing comes out on paper",
      a: "Virtual printers (like Microsoft Print to PDF, OneNote, XPS Writer) are filtered out because they require a filename dialog. Ensure a physical thermal label printer (e.g. TSC, Zebra, Xprinter) is connected and powered on.",
    },
    {
      q: "The installer will not run",
      a: (
        <>
          The installer requires administrator permissions. Right-click{" "}
          <strong>PrintBridge-Setup.exe</strong> and choose <strong>Run as administrator</strong>.
        </>
      ),
    },
  ];

  return (
    <div className="space-y-6 pt-6">
      <div className="border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-[#E8C16D]" />
          <h2 className="text-xl font-bold tracking-tight text-[#0A0E1A] dark:text-white">
            Troubleshooting & Diagnostics
          </h2>
        </div>
      </div>

      {/* FAQs Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {faqs.map((faq, idx) => (
          <div key={idx} className="border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">{faq.q}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* Log File Path Box */}
      <div className="border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#E8C16D]" />
            <h3 className="text-sm font-bold text-[#0A0E1A] dark:text-white">
              Host Diagnostic Log File
            </h3>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          If silent printing fails, inspect host logs to verify native messaging activity:
        </p>

        <div className="mt-3 flex max-w-xl items-center border border-border bg-muted/30">
          <code className="flex-1 overflow-x-auto px-4 py-2 font-mono text-xs text-[#0A0E1A] dark:text-white">
            {logPathText}
          </code>
          <button
            type="button"
            onClick={handleCopyLogPath}
            className="flex h-9 items-center gap-1.5 border-l border-border bg-[#0A0E1A] px-4 text-xs font-semibold text-[#E8C16D] transition hover:bg-[#161D2E]"
          >
            {copiedLogPath ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Path
              </>
            )}
          </button>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="mt-8 flex flex-wrap items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-[#0A0E1A] dark:text-white">PrintBridge v0.3.1</span>
          <span>•</span>
          <span>Target: C:\Program Files\PrintBridge</span>
        </div>
        <div>Supported Browsers: Google Chrome · Microsoft Edge · Brave</div>
      </footer>
    </div>
  );
}
