"use client";

import { useEffect, useRef, useState } from "react";
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
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let mounted = true;

    const scanner = new Html5Qrcode("tracking-camera");

    scannerRef.current = scanner;

    async function startCamera() {
      try {
        const cameras = await Html5Qrcode.getCameras();

        if (!mounted) return;

        if (cameras.length === 0) {
          alert("No Camera Found");
          return;
        }

        // Rear camera શોધવાનો પ્રયત્ન
        const rearCamera =
          cameras.find((camera) =>
            camera.label.toLowerCase().includes("back"),
          ) ||
          cameras.find((camera) =>
            camera.label.toLowerCase().includes("rear"),
          ) ||
          cameras[cameras.length - 1];

        await scanner.start(
          rearCamera.id,
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 120,
            },
            aspectRatio: 1.777,
          },
          async (decodedText) => {
            console.log("Detected:", decodedText);

            await scanner.stop();

            onDetected(decodedText);
          },
          () => {},
        );

        setStarting(false);
      } catch (err) {
        console.error(err);

        alert("Camera Start Failed");
      }
    }

    startCamera();

    return () => {
      mounted = false;

      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
          });
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
        <h2 className="text-lg font-semibold text-white">
          Scan Tracking ID
        </h2>

        <button
          onClick={onClose}
          className="rounded bg-red-600 px-4 py-2 text-white"
        >
          Close
        </button>
      </div>

      {starting && (
        <div className="py-6 text-center text-white">
          Opening Camera...
        </div>
      )}

      <div
        id="tracking-camera"
        className="mx-auto mt-5 max-w-xl overflow-hidden rounded-lg"
      />
    </div>
  );
}