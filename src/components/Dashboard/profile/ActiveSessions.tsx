"use client";

import { useCallback, useEffect, useState } from "react";
import { Laptop, LogOut, Shield, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth/auth.service";
import type { ActiveDeviceSession } from "@/services/auth/auth.types";
import { logout } from "@/utils/auth";

export default function ActiveSessions() {
  const [sessions, setSessions] = useState<ActiveDeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.getSessions();
      setSessions(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevokeOne = async (session: ActiveDeviceSession) => {
    try {
      setRevokingId(session.id);
      await authService.revokeSession(session.id);
      toast.success(`Signed out "${session.deviceLabel}"`);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke device session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    try {
      setRevokingAll(true);
      await authService.revokeAllSessions();
      toast.success("Signed out from all devices");
      await logout();
    } catch (err: any) {
      toast.error(err?.message || "Failed to sign out of all devices");
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF9EC] text-[#B88728] dark:bg-[#F5C451]/10 dark:text-[#F5C451]">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0A0E1A] dark:text-white">
              Active Persistent Devices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Devices signed in with &ldquo;Remember me&rdquo; (up to 15 days). Persistent login uses a secure HttpOnly cookie.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleRevokeAll}
            disabled={revokingAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 cursor-pointer"
          >
            <LogOut size={13} />
            {revokingAll ? "Signing out..." : "Log out of all devices"}
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Loading active persistent devices...
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
            No persistent &ldquo;Remember me&rdquo; devices are currently active for this account.
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-[#0B0F17]/60"
            >
              <div className="flex items-start gap-3">
                <Laptop
                  size={18}
                  className="mt-0.5 shrink-0 text-[#B88728] dark:text-[#F5C451]"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0A0E1A] dark:text-white">
                      {s.deviceLabel}
                    </span>
                    {s.isCurrentDevice && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                        This Device
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    IP: {s.ipTruncated} · Last active:{" "}
                    {new Date(s.lastUsedAt).toLocaleString()} · Expires:{" "}
                    {new Date(s.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRevokeOne(s)}
                disabled={revokingId === s.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 border border-rose-200/70 dark:border-rose-500/20 cursor-pointer self-start sm:self-center"
              >
                <Trash2 size={13} />
                {revokingId === s.id ? "Revoking..." : "Revoke"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
