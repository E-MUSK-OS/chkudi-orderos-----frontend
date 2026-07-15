"use client";

import { useEffect, useRef, useState } from "react";
import { updatePackingScan } from "../services/vms.service";

export const useTrackingScanner = (
  userId: string,
  refetch: () => Promise<unknown>,
) => {
  const [scanValue, setScanValue] = useState("");
  const [message, setMessage] = useState("");
  const [missingIds, setMissingIds] = useState<string[]>([]);

  const warningSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    warningSound.current = new Audio("/sounds/warning.wav");

    return () => {
      warningSound.current = null;
    };
  }, []);

  const handleScan = async (trackingId: string, allTrackingIds: string[]) => {
    const value = trackingId.trim();

    if (!value) return;

    // ============================
    // Missing Tracking ID
    // ============================

    if (!allTrackingIds.includes(value)) {
      if (!missingIds.includes(value)) {
        setMissingIds((prev) => [...prev, value]);

        const audio = warningSound.current;

        if (audio) {
          try {
            audio.pause();
            audio.currentTime = 0;

            await audio.play();
          } catch (error) {
            console.error("Warning sound failed:", error);
          }
        }
      }

      setMessage("No VMS Record Found");
      setScanValue("");

      return;
    }

    // ============================
    // Update Packing Scan
    // ============================

    try {
      const result = await updatePackingScan({
        trackingId: value,
        userId,
      });

      setMessage(result.message);

      await refetch();
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Something went wrong.");
      }
    }

    setScanValue("");
  };

  return {
    scanValue,
    setScanValue,
    missingIds,
    message,
    handleScan,
  };
};
