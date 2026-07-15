"use client";

import { useState } from "react";
import { updatePackingScan } from "../services/vms.service";

export const useTrackingScanner = (
  userId: string,
  refetch: () => Promise<unknown>,
) => {
  const [scanValue, setScanValue] = useState("");

  const [message, setMessage] = useState("");

  const [missingIds, setMissingIds] = useState<string[]>([]);

  const handleScan = async (
    trackingId: string,
    allTrackingIds: string[],
  ) => {
    const value = trackingId.trim();

    if (!value) return;

    // Tracking ID not found in filtered records
    if (!allTrackingIds.includes(value)) {
      if (!missingIds.includes(value)) {
        setMissingIds((prev) => [...prev, value]);
      }

      setMessage("No VMS Record Found");

      setScanValue("");

      return;
    }

    try {
      const result = await updatePackingScan({
        trackingId: value,
        userId,
      });

      setMessage(result.message);

      // Reload latest data from DB
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