"use client";

import { useEffect } from "react";

import { useOperatorAuth } from "./useOperatorAuth";

export const useHeartbeat = () => {
  const { heartbeat, isAuthenticated } = useOperatorAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // First heartbeat immediately
    heartbeat();

    const interval = setInterval(() => {
      heartbeat();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);
};