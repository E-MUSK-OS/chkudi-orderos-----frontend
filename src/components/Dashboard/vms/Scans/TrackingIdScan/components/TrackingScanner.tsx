"use client";

import { useEffect, useRef, useState } from "react";
import CameraScanner from "./CameraScanner";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onScan: () => void;
  message?: string;
}

export default function TrackingScanner({
  value,
  onChange,
  onScan,
  message,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="border border-slate-700 bg-[#0F172A] p-5">
      <div className="space-y-4">
        <div>
          <div className="mb-4 lg:hidden">
            <button
              onClick={() => setCameraOpen(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              📷 Scan By Camera
            </button>
          </div>
          <label className="mb-2 block text-lg font-medium text-white">
            Scan Tracking ID
          </label>

          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Scan barcode or enter tracking ID..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                onScan();

                setTimeout(() => {
                  inputRef.current?.focus();
                }, 2);
              }
            }}
            className="
              h-12
              w-full
              border
              border-slate-700
              bg-[#111827]
              px-4
              text-white
              outline-none
              transition
              focus:border-[#E8C16D]
            "
          />
        </div>

        {message && (
          <div className="rounded-md bg-slate-800 px-4 py-3 text-sm text-gray-300">
            {message}
          </div>
        )}
      </div>
      {cameraOpen && (
        <div className="lg:hidden">
          <CameraScanner
            onClose={() => setCameraOpen(false)}
            onDetected={(trackingId) => {
              console.log(trackingId);
            }}
          />
        </div>
      )}
    </div>
  );
}
