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
  const successSound = useRef<HTMLAudioElement | null>(null);
  const alreadyScannedSound = useRef<HTMLAudioElement | null>(null);

  //   useEffect(() => {
  //     warningSound.current = new Audio("/sounds/warning.wav");

  //     return () => {
  //       warningSound.current = null;
  //     };
  //   }, []);
  useEffect(() => {
    warningSound.current = new Audio("/sounds/warning.wav");
    successSound.current = new Audio("/sounds/success.wav");
    alreadyScannedSound.current = new Audio("/sounds/alreadyScanne.wav");

    return () => {
      warningSound.current = null;
      successSound.current = null;
      alreadyScannedSound.current = null;
    };
  }, []);

  const handleScan = async (trackingId: string, allTrackingIds: string[]) => {
    const value = trackingId.trim();

    if (!value) return;

    setScanValue("");

    // ============================
    // Missing Tracking ID
    // ============================

    if (!allTrackingIds.includes(value)) {
      if (!missingIds.includes(value)) {
        setMissingIds((prev) => [...prev, value]);
      }

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

      setMessage("No VMS Record Found");
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

      // ============================
      // Success Sound
      // ============================

      const successAudio = successSound.current;

      if (successAudio) {
        try {
          successAudio.pause();
          successAudio.currentTime = 0;

          await successAudio.play();
        } catch (error) {
          console.error("Success sound failed:", error);
        }
      }

      await refetch();
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);

        // ============================
        // Already Scanned Sound
        // ============================

        if (error.message.toLowerCase().includes("already scanned")) {
          const audio = alreadyScannedSound.current;

          if (audio) {
            try {
              audio.pause();
              audio.currentTime = 0;

              await audio.play();
            } catch (err) {
              console.error("Already scanned sound failed:", err);
            }
          }

          await refetch();
        }
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
