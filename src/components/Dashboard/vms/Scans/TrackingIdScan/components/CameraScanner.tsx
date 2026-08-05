"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface CameraScannerProps {
  onDetected: (trackingId: string) => void;
  onClose: () => void;
}

export default function CameraScanner({
  onDetected,
  onClose,
}: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("tracking-camera");

    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          {
            facingMode: "environment", // Rear Camera
          },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 120,
            },
          },
          (decodedText) => {
            console.log("Barcode:", decodedText);

            // હજુ API Call નથી કરવી
            onDetected(decodedText);
          },
          () => {
            // Ignore scan errors
          },
        );
      } catch (error) {
        console.error("Camera start failed:", error);
      }
    };

    startScanner();

    return () => {
      if (scanner.isScanning) {
        scanner
          .stop()
          .then(() => {
            scanner.clear();
          })
          .catch((err) => {
            console.error(err);
          });
      }
    };
  }, [onDetected]);

  return (
    <div className="rounded-lg border border-slate-700 bg-[#0F172A] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Camera Scanner
        </h2>

        <button
          onClick={onClose}
          className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Close
        </button>
      </div>

      <div
        id="tracking-camera"
        className="min-h-[350px] overflow-hidden rounded-lg border border-slate-700"
      />
    </div>
  );
}