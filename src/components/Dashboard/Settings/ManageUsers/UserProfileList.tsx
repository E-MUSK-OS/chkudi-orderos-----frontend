"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, AlertTriangle, RotateCcw, Users } from "lucide-react";
import UserCard from "./components/UserCard";
import UserToolbar from "./components/UserToolbar";
import UserViewModal from "./components/UserViewModal";
import Pagination from "@/components/ui/Pagination";
import { useUsers, useUpdateUserStatus, useDeleteUser } from "./hooks/useManageUsers";
import type { ManagedUser } from "./types/userManagement.types";
import { usePagePermissions } from "@/utils/pagePermissions";
import { toast } from "sonner";

export default function UserProfileList() {
  const router = useRouter();
  const { canCreate } = usePagePermissions("settings/manage-users");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("oldest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, isError, error, refetch } = useUsers({ search, sort, page, limit: pageSize });
  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  const users = data?.data || [];
  const totalRecords = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || Math.ceil(totalRecords / pageSize) || 1;

  // Scroll & Height coordinator refs & state
  const containerRef = useRef<HTMLDivElement>(null);
  const headerCardRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const [targetHeight, setTargetHeight] = useState<number | null>(null);
  const [tableMaxHeight, setTableMaxHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Calculate available height inside the scroll container so that when scrolled
  // past the Header Card on desktop (>= 1024px), the lower section (Toolbar + Cards)
  // fills the visible viewport exactly, stopping at Toolbar as shown in img-1.
  const calculateHeight = useCallback(() => {
    if (typeof window === "undefined" || window.innerWidth < 1024) {
      setTargetHeight(null);
      setTableMaxHeight(null);
      return;
    }
    if (!containerRef.current) return;
    const scrollContainer = containerRef.current.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const style = window.getComputedStyle(scrollContainer);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    const available = scrollContainer.clientHeight - paddingTop - paddingBottom;
    if (available > 320) {
      setTargetHeight(Math.floor(available));

      const toolbarHeight = toolbarRef.current?.offsetHeight || 60;
      const gap = 24; // gap-4 sm:gap-6
      const maxForCards = available - toolbarHeight - gap;
      if (maxForCards > 160) {
        setTableMaxHeight(Math.floor(maxForCards));
      }
    }
  }, []);

  useEffect(() => {
    calculateHeight();

    const timer = setTimeout(calculateHeight, 150);

    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    window.addEventListener("resize", calculateHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (scrollContainer && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateHeight();
      });
      resizeObserver.observe(scrollContainer);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
      resizeObserver?.disconnect();
    };
  }, [calculateHeight]);

  useEffect(() => {
    calculateHeight();
  }, [users.length, calculateHeight]);

  // Seamless scroll coordinator matching img-1:
  // 1. When scrolling down, outer page scrolls until Header Card is hidden and stops at the fixed position (Toolbar + Cards).
  // 2. Once at the fixed position, scrolling down over the cards scrolls the cards container internally.
  // 3. When scrolling up, cards container scrolls up to the first row; then scrolling up reveals Header Card.
  useEffect(() => {
    const scrollContainer = containerRef.current?.closest(".overflow-y-auto") as HTMLElement | null;
    if (!scrollContainer) return;

    const onWheel = (e: WheelEvent) => {
      if (window.innerWidth < 1024) return;
      const cardsContainer = cardsContainerRef.current;
      const maxPageScroll = Math.max(
        0,
        scrollContainer.scrollHeight - scrollContainer.clientHeight
      );
      if (maxPageScroll <= 0) return;

      const isPageAtBottom = scrollContainer.scrollTop >= maxPageScroll - 2;
      const isPageAtTop = scrollContainer.scrollTop <= 2;

      const isOverCards =
        cardsContainer &&
        (e.composedPath().includes(cardsContainer) ||
          cardsContainer.contains(e.target as Node));

      if (e.deltaY > 0) {
        // Scrolling DOWN
        if (!isPageAtBottom) {
          // Outer page has not reached the fixed view yet -> scroll page down
          e.preventDefault();
          scrollContainer.scrollTop = Math.min(
            maxPageScroll,
            scrollContainer.scrollTop + e.deltaY
          );
        } else if (!isOverCards) {
          // At the fixed point and outside the cards -> forward scroll to cards
          if (cardsContainer) {
            cardsContainer.scrollTop += e.deltaY;
          }
        }
      } else if (e.deltaY < 0) {
        // Scrolling UP
        if (!isOverCards) {
          // Cursor is outside cards -> scroll outer page up if not at top
          if (!isPageAtTop) {
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        } else {
          // Cursor is inside cards
          const isCardsAtTop = !cardsContainer || cardsContainer.scrollTop <= 1;
          if (isCardsAtTop && !isPageAtTop) {
            // Cards is at top row -> scroll outer page up to reveal Header Card
            e.preventDefault();
            scrollContainer.scrollTop = Math.max(
              0,
              scrollContainer.scrollTop + e.deltaY
            );
          }
        }
      }
    };

    scrollContainer.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scrollContainer.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    cardsContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, pageSize, search, sort]);

  const handleView = (user: ManagedUser) => {
    router.push(`/dashboard/settings/manage-users/user-profile/${user.id}`);
  };

  const handleEdit = (user: ManagedUser) => {
    router.push(`/dashboard/settings/manage-users/user-profile/edit-user/${user.id}`);
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: user.id,
        isActive: !user.isActive,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClick = (user: ManagedUser) => {
    if (user.role === "SUPERADMIN") {
      toast.error("Super Admin accounts cannot be deleted.");
      return;
    }
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (userToDelete.role === "SUPERADMIN") {
      toast.error("Super Admin accounts cannot be deleted.");
      setDeleteModalOpen(false);
      setUserToDelete(null);
      return;
    }
    try {
      setIsDeleting(true);
      await deleteUserMutation.mutateAsync(userToDelete.id);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-4 sm:gap-6 font-sans text-slate-900 dark:text-slate-100">
      {/* Top Header Card matching Material Profile & Company Profile */}
      <div
        ref={headerCardRef}
        className="shrink-0 rounded-2xl sm:rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] p-4 sm:p-7 shadow-sm"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5 min-w-0 max-w-2xl">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl md:text-[26px] font-black tracking-tight text-[#0A0E1A] dark:text-white">
                User Profile
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Manage users and rights
            </p>
          </div>

          {canCreate && (
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => router.push("/dashboard/settings/manage-users/user-profile/create-user")}
                className="inline-flex min-h-[38px] sm:h-12 items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-[#E8C16D] hover:bg-[#d8b05c] active:scale-[0.97] px-4 sm:px-6 py-1.5 sm:py-2.5 text-xs sm:text-sm font-bold text-[#0A0E1A] transition-all cursor-pointer shadow-sm shrink-0"
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Create User</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lower Section (Toolbar + Cards Grid Container) - stops scrolling from Toolbar as shown in img-1 */}
      <div
        className="flex flex-col gap-4 sm:gap-6 min-h-0"
        style={{
          maxHeight: isDesktop && targetHeight ? `${targetHeight}px` : undefined,
        }}
      >
        {/* Toolbar: Global Search + Sort */}
        <div ref={toolbarRef} className="shrink-0">
          <UserToolbar
            search={search}
            onSearchChange={(s) => {
              setSearch(s);
              setPage(1);
            }}
            sort={sort}
            onSortChange={(st) => {
              setSort(st);
              setPage(1);
            }}
            onReset={() => {
              setSearch("");
              setSort("oldest");
              setPage(1);
            }}
          />
        </div>

        {/* Cards Grid Container matching OrderOS layout */}
        <div
          className="flex flex-col min-h-0 flex-1"
          style={{
            maxHeight: isDesktop && tableMaxHeight ? `${tableMaxHeight}px` : undefined,
          }}
        >
          <div className="rounded-3xl border border-[#E7E0D2] dark:border-white/[0.08] bg-white dark:bg-[#0F1626] shadow-sm flex flex-col min-h-0 max-h-full overflow-hidden">
            <div
              ref={cardsContainerRef}
              className="w-full min-h-0 sm:overflow-y-auto custom-scrollbar flex-1 p-4 sm:p-7"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-48 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.06] bg-[#FFFDF8] dark:bg-[#080B11] p-5 animate-pulse"
                    />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
                    Unable to load user accounts
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mb-4">
                    {(error as any)?.message || "A network or server timeout occurred. Please retry."}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0E1A] dark:bg-white text-white dark:text-[#0A0E1A] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#FFF9EC] dark:bg-[#1A160E] border border-[#E8C16D]/30 flex items-center justify-center text-[#B88728] dark:text-[#E8C16D] mb-3">
                    <span className="text-2xl font-bold">∅</span>
                  </div>
                  <h3 className="text-base font-bold text-[#0A0E1A] dark:text-white">
                    No Admin or SuperAdmin Accounts Found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    {search
                      ? `No matching admin accounts found for "${search}".`
                      : "Create an admin user to get started."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {users.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onView={handleView}
                      onEdit={handleEdit}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              limit={pageSize}
              pageSize={pageSize}
              itemName="users"
              variant="dark"
              className="shrink-0 border-t border-[#F1E8D0] dark:border-white/[0.08] rounded-b-2xl sm:rounded-b-3xl bg-[#FEFAEE] dark:bg-none dark:bg-[#080B11] px-4 sm:px-6 py-3 sm:py-3.5"
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* User View Modal */}
      <UserViewModal
        user={selectedUser}
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedUser(null);
        }}
        onEdit={handleEdit}
      />

      {/* Delete User Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-red-200/80 dark:border-red-900/40 bg-white dark:bg-[#0B0F17] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0A0E1A] dark:text-white">
                    Delete User
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Permanent Account Removal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={isDeleting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#0A0E1A] dark:text-white font-extrabold">
                {userToDelete.fullName}
              </strong>{" "}
              ({userToDelete.email})? This user and their associated access mapping will be completely removed from the database.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                disabled={isDeleting}
                className="min-h-[40px] px-5 rounded-2xl text-xs font-bold border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="min-h-[40px] px-5 rounded-2xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity=".25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Delete User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
