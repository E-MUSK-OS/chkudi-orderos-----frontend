"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket } from "@/lib/socket";
import {
  DROPDOWN_BROADCAST_CHANNEL,
  DROPDOWN_STORAGE_SYNC_KEY,
  DROPDOWN_SYNC_EVENT,
  invalidateAndSyncAllDropdowns,
  type DropdownSyncDetail,
} from "@/utils/dropdownOptions.utils";

export default function DropdownRealtimeSync() {
  const queryClient = useQueryClient();
  const lastNonceRef = useRef<string>("");

  useEffect(() => {
    const processRemoteSync = (detail?: DropdownSyncDetail | null) => {
      if (detail?.nonce) {
        if (lastNonceRef.current === detail.nonce) return;
        lastNonceRef.current = detail.nonce;
      }

      invalidateAndSyncAllDropdowns(
        queryClient,
        detail || { action: "sync" },
        { emitBroadcast: false, clearLocalCache: true }
      );

      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(
            new CustomEvent(DROPDOWN_SYNC_EVENT, { detail: detail || undefined })
          );
        } catch {}
      }
    };

    const joinUserRoom = () => {
      if (typeof window === "undefined") return;
      try {
        const rawUser = window.localStorage.getItem("user");
        if (!rawUser) return;
        const parsed = JSON.parse(rawUser);
        if (parsed?.id) {
          socket.emit("join:user", parsed.id);
        }
      } catch {}
    };

    const handleSocketUpdate = (payload: DropdownSyncDetail) => {
      processRemoteSync(payload);
    };

    if (socket.connected) {
      joinUserRoom();
    }

    socket.on("connect", joinUserRoom);
    socket.on("setting_masters:updated", handleSocketUpdate);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(DROPDOWN_BROADCAST_CHANNEL);
        channel.onmessage = (event) => {
          processRemoteSync(event?.data);
        };
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== DROPDOWN_STORAGE_SYNC_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && typeof parsed === "object") {
          processRemoteSync(parsed);
        } else {
          processRemoteSync({ action: "sync" });
        }
      } catch {
        processRemoteSync({ action: "sync" });
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      socket.off("connect", joinUserRoom);
      socket.off("setting_masters:updated", handleSocketUpdate);
      if (channel) {
        try {
          channel.close();
        } catch {}
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);

  return null;
}
