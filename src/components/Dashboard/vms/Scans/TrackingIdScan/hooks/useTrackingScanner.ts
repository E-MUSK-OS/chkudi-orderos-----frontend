"use client";

import { useEffect, useRef, useState } from "react";
import { updatePackingScan } from "../services/vms.service";
import { useQueryClient } from "@tanstack/react-query";
import type { VMSItem, GetVMSResponse } from "../../VMS/Admin/types";

export const useTrackingScanner = (
  userId: string,
  refetch: () => Promise<unknown>,
  data: VMSItem[] = [],
) => {
  const queryClient = useQueryClient();
  const [scanValue, setScanValue] = useState("");
  const [message, setMessage] = useState("");
  const [missingIds, setMissingIds] = useState<string[]>([]);

  const warningSound = useRef<HTMLAudioElement | null>(null);
  const successSound = useRef<HTMLAudioElement | null>(null);
  const alreadyScannedSound = useRef<HTMLAudioElement | null>(null);

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

  const playSound = async (
    audioRef: React.MutableRefObject<HTMLAudioElement | null>,
  ) => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
        audio.currentTime = 0;
        await audio.play();
      } catch (error) {
        console.error("Audio playback error:", error);
      }
    }
  };

  const handleScan = async (trackingId: string, allTrackingIds?: string[]) => {
    const value = trackingId.trim();
    if (!value) return;

    setScanValue("");

    // Look for item in current VMS data
    const existing = data.find(
      (item) => item.trackingId.trim().toLowerCase() === value.toLowerCase(),
    );

    // If item is already marked as SCANNED
    if (existing && existing.packingScanStatus === "SCANNED") {
      setMessage("Tracking ID already scanned.");
      await playSound(alreadyScannedSound);
      return;
    }

    // If item is found locally and status is PENDING:
    if (existing) {
      // 1. INSTANT OPTIMISTIC UPDATE in React Query cache
      queryClient.setQueryData<GetVMSResponse>(["user-vms", userId], (old) => {
        if (!old || !old.data) return old;

        return {
          ...old,
          data: old.data.map((item) =>
            item.id === existing.id ||
            item.trackingId.trim().toLowerCase() === value.toLowerCase()
              ? { ...item, packingScanStatus: "SCANNED" }
              : item,
          ),
        };
      });

      // 2. Immediate feedback: sound + message (0ms latency!)
      setMessage("Tracking scanned successfully.");
      await playSound(successSound);

      // 3. Send update to server asynchronously
      try {
        await updatePackingScan({
          trackingId: existing.trackingId,
          userId,
        });
      } catch (error) {
        // Revert optimistic update only on error
        queryClient.setQueryData<GetVMSResponse>(["user-vms", userId], (old) => {
          if (!old || !old.data) return old;

          return {
            ...old,
            data: old.data.map((item) =>
              item.id === existing.id
                ? { ...item, packingScanStatus: existing.packingScanStatus }
                : item,
            ),
          };
        });

        if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("Failed to update packing scan.");
        }
      }
      return;
    }

    // If NOT found in local data:
    // Check with server directly in case it was just saved/uploaded
    try {
      const result = await updatePackingScan({
        trackingId: value,
        userId,
      });

      // Found and scanned on server!
      setMessage(result.message || "Tracking scanned successfully.");
      await playSound(successSound);

      // Add to cache or update
      if (result.data) {
        queryClient.setQueryData<GetVMSResponse>(["user-vms", userId], (old) => {
          if (!old || !old.data) return old;

          const exists = old.data.some((item) => item.id === result.data.id);
          if (exists) {
            return {
              ...old,
              data: old.data.map((item) =>
                item.id === result.data.id
                  ? { ...item, packingScanStatus: "SCANNED" }
                  : item,
              ),
            };
          }

          return {
            ...old,
            data: [
              { ...result.data, packingScanStatus: "SCANNED" },
              ...old.data,
            ],
            total: (old.total || 0) + 1,
          };
        });
      } else {
        await refetch();
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes("already scanned")) {
          setMessage("Tracking ID already scanned.");
          await playSound(alreadyScannedSound);
          return;
        }
      }

      // Record truly missing
      if (!missingIds.includes(value)) {
        setMissingIds((prev) => [...prev, value]);
      }
      setMessage("No VMS Record Found");
      await playSound(warningSound);
    }
  };

  return {
    scanValue,
    setScanValue,
    missingIds,
    message,
    handleScan,
  };
};

