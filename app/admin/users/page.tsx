"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import {
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  CheckCircle2,
  Wallet,
  Ban,
  ChevronDown,
} from "lucide-react";

type UserStatus = "ACTIVE" | "NOCASH" | "BANNED";

interface User {
  id: number;
  number: string;
  fullName: string | null;
  username: string | null;
  email: string | null;
  createdAt: string;
  profileComplete: boolean;
  status: UserStatus;
}

const STATUS_META: Record<
  UserStatus,
  { label: string; pill: string; dot: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ACTIVE: {
    label: "Faol",
    pill: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    icon: CheckCircle2,
  },
  NOCASH: {
    label: "To'lov yo'q",
    pill: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    icon: Wallet,
  },
  BANNED: {
    label: "Bloklangan",
    pill: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    icon: Ban,
  },
};

const STATUS_OPTIONS: UserStatus[] = ["ACTIVE", "NOCASH", "BANNED"];

interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusMenuFor, setStatusMenuFor] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRecentUsers();
  }, []);

  useEffect(() => {
    if (showAllUsers) {
      fetchAllUsers(currentPage);
    }
  }, [showAllUsers, currentPage]);

  const fetchRecentUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/users/recent?limit=10`);
      setRecentUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("Foydalanuvchilarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (page: number) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/admin/users?page=${page}&limit=20`,
      );
      setAllUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("Foydalanuvchilarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (userId: number, status: UserStatus) => {
    try {
      setUpdatingId(userId);
      await axios.patch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        status,
      });
      setRecentUsers((list) =>
        list.map((u) => (u.id === userId ? { ...u, status } : u)),
      );
      setAllUsers((prev) =>
        prev
          ? {
              ...prev,
              users: prev.users.map((u) =>
                u.id === userId ? { ...u, status } : u,
              ),
            }
          : prev,
      );
      setStatusMenuFor(null);
    } catch (err) {
      console.error(err);
      setError("Statusni yangilab bo'lmadi");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const sourceUsers = showAllUsers ? allUsers?.users ?? [] : recentUsers;
  const displayedUsers = query.trim()
    ? sourceUsers.filter((u) => {
        const q = query.trim().toLowerCase();
        return (
          (u.fullName || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          u.number.toLowerCase().includes(q) ||
          String(u.id).includes(q)
        );
      })
    : sourceUsers;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
          {allUsers && showAllUsers && (
            <p className="text-sm text-gray-500">Jami: {allUsers.total} ta</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            {showAllUsers ? "Barcha foydalanuvchilar" : "Oxirgi 10 ta foydalanuvchi"}
          </h2>
          <div className="flex items-center gap-2 flex-1 sm:justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Qidirish (ism, tel, email...)"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            {showAllUsers && (
              <button
                onClick={() => {
                  setShowAllUsers(false);
                  setCurrentPage(1);
                }}
                className="text-sm text-green-600 hover:text-green-700 font-medium whitespace-nowrap"
              >
                ← Oxirgi 10
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-green-500 mx-auto animate-spin" />
            <p className="text-gray-500 mt-3 text-sm">Yuklanmoqda...</p>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Foydalanuvchilar topilmadi
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 font-medium">ID</th>
                    <th className="px-4 py-3 font-medium">Ism</th>
                    <th className="px-4 py-3 font-medium">Telefon</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Ro&apos;yxat</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedUsers.map((user) => {
                    const meta = STATUS_META[user.status] ?? STATUS_META.ACTIVE;
                    const StatusIcon = meta.icon;
                    const menuOpen = statusMenuFor === user.id;
                    const busy = updatingId === user.id;
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 text-sm">#{user.id}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="font-medium text-gray-900 hover:text-green-600 text-sm"
                          >
                            {user.fullName || "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{user.number}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {user.email || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                setStatusMenuFor((p) => (p === user.id ? null : user.id))
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${meta.pill} hover:brightness-95 disabled:opacity-60`}
                            >
                              {busy ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <StatusIcon className="w-3 h-3" />
                              )}
                              {meta.label}
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>
                            {menuOpen && (
                              <>
                                <button
                                  type="button"
                                  className="fixed inset-0 z-40 cursor-default"
                                  onClick={() => setStatusMenuFor(null)}
                                  aria-label="Yopish"
                                />
                                <div className="absolute z-50 mt-1 left-0 min-w-[150px] bg-white rounded-xl border border-gray-100 shadow-lg py-1">
                                  {STATUS_OPTIONS.map((opt) => {
                                    const o = STATUS_META[opt];
                                    const OIcon = o.icon;
                                    const isCurrent = opt === user.status;
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => changeStatus(user.id, opt)}
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 ${
                                          isCurrent ? "text-gray-400" : "text-gray-700"
                                        }`}
                                        disabled={isCurrent}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${o.dot}`} />
                                        <OIcon className="w-3.5 h-3.5" />
                                        {o.label}
                                        {isCurrent && (
                                          <span className="ml-auto text-[10px]">hozir</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-white hover:bg-green-600 px-3 py-1.5 rounded-lg border border-green-200 hover:border-green-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ko&apos;rish
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {showAllUsers && allUsers && allUsers.totalPages > 1 ? (
              <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Sahifa {currentPage} / {allUsers.totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(allUsers.totalPages, p + 1))
                  }
                  disabled={currentPage === allUsers.totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : !showAllUsers ? (
              <div className="p-4 border-t border-gray-100 text-center">
                <button
                  onClick={() => setShowAllUsers(true)}
                  className="bg-green-500 text-white px-6 py-2.5 rounded-xl hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Barcha foydalanuvchilarni ko&apos;rish
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
