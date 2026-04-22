"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Truck,
  Phone,
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User as UserIcon,
  Crown,
  UserCog,
  TrendingUp,
} from "lucide-react";

type Role = "ADMIN" | "COURIER";

interface Staff {
  id: number;
  fullName: string | null;
  number: string;
  role: Role;
  createdAt: string;
}

// =========== Role meta ===========
const ROLE_META: Record<
  Role,
  {
    label: string;
    short: string;
    icon: any;
    pill: string;
    dot: string;
    tint: string;
    accent: string;
    iconBg: string;
    description: string;
  }
> = {
  ADMIN: {
    label: "Administrator",
    short: "Admin",
    icon: Crown,
    pill: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    tint: "from-violet-500 to-purple-600",
    accent: "text-violet-600",
    iconBg: "bg-violet-50",
    description: "Tizimni boshqarish, barcha bo'limlarga kirish",
  },
  COURIER: {
    label: "Kuryer",
    short: "Kuryer",
    icon: Truck,
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    tint: "from-emerald-500 to-green-600",
    accent: "text-emerald-600",
    iconBg: "bg-emerald-50",
    description: "Buyurtmalarni yetkazib berish",
  },
};

// =========== Helpers ===========
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const normalizePhone = (raw: string) => {
  let v = raw.replace(/[^\d+]/g, "");
  if (!v.startsWith("+")) v = "+" + v.replace(/^\+?/, "");
  return v;
};

const isValidPhone = (v: string) => /^\+998\d{9}$/.test(v);

const getInitials = (name: string | null, fallback: string) => {
  if (!name) return fallback.slice(-2).toUpperCase();
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] || "") + (parts[1]?.[0] || "")
  ).toUpperCase() || fallback.slice(-2).toUpperCase();
};

// =========== StatCard ===========
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  tint: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} opacity-10`}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub && (
            <p className="mt-1 text-[11px] text-gray-400 font-medium">{sub}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

// =========== Main page ===========
export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/staff`);
      setStaffList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const onClick = () => setMenuOpen(null);
    if (menuOpen !== null) {
      document.addEventListener("click", onClick);
      return () => document.removeEventListener("click", onClick);
    }
  }, [menuOpen]);

  // Stats
  const stats = useMemo(() => {
    const admins = staffList.filter((s) => s.role === "ADMIN").length;
    const couriers = staffList.filter((s) => s.role === "COURIER").length;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = staffList.filter(
      (s) => new Date(s.createdAt).getTime() >= weekAgo,
    ).length;
    return { total: staffList.length, admins, couriers, recent };
  }, [staffList]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffList.filter((s) => {
      if (roleFilter !== "ALL" && s.role !== roleFilter) return false;
      if (q) {
        const hay = `${s.fullName || ""} ${s.number}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [staffList, search, roleFilter]);

  const handleChangeRole = async (staff: Staff, newRole: Role) => {
    if (staff.role === newRole) return;
    try {
      await axios.patch(`${API_BASE_URL}/admin/staff/${staff.id}`, {
        role: newRole,
      });
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || "Rolni o'zgartirishda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
            <UserCog className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Xodimlar</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Adminlar va kuryerlarni boshqarish
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all"
        >
          <UserPlus size={18} />
          Yangi xodim
        </button>
      </div>

      {/* ============ STATS ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Jami xodimlar"
          value={stats.total}
          tint="from-slate-500 to-slate-700"
          accent="bg-slate-50 text-slate-600"
        />
        <StatCard
          icon={Crown}
          label="Adminlar"
          value={stats.admins}
          tint="from-violet-500 to-purple-600"
          accent="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={Truck}
          label="Kuryerlar"
          value={stats.couriers}
          tint="from-emerald-500 to-green-600"
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Oxirgi 7 kun"
          value={stats.recent}
          sub="yangi qo'shilgan"
          tint="from-blue-500 to-indigo-600"
          accent="bg-blue-50 text-blue-600"
        />
      </div>

      {/* ============ TOOLBAR ============ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism yoki telefon bo'yicha qidirish..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Role tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {(["ALL", "ADMIN", "COURIER"] as const).map((r) => {
              const active = roleFilter === r;
              const meta = r === "ALL" ? null : ROLE_META[r];
              const count =
                r === "ALL"
                  ? staffList.length
                  : r === "ADMIN"
                  ? stats.admins
                  : stats.couriers;
              return (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {meta && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                    />
                  )}
                  {r === "ALL" ? "Barchasi" : meta!.short}
                  <span
                    className={`px-1.5 rounded-md text-[10px] ${
                      active
                        ? "bg-gray-100 text-gray-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============ STAFF GRID ============ */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-emerald-500" size={36} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
            <Users className="text-emerald-600" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {search || roleFilter !== "ALL"
              ? "Xodim topilmadi"
              : "Hali xodim yo'q"}
          </h3>
          <p className="text-gray-500 text-sm mb-5 max-w-sm mx-auto">
            {search || roleFilter !== "ALL"
              ? "Filtrlarni o'zgartirib ko'ring"
              : "Birinchi adminingiz yoki kuryerni qo'shing"}
          </p>
          {!search && roleFilter === "ALL" && (
            <button
              onClick={() => {
                setEditing(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm"
            >
              <UserPlus size={18} />
              Birinchi xodimni qo'shish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((staff) => {
            const meta = ROLE_META[staff.role];
            const Icon = meta.icon;
            const initials = getInitials(staff.fullName, staff.number);
            return (
              <div
                key={staff.id}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Colored top strip */}
                <div
                  className={`h-1 bg-gradient-to-r ${meta.tint}`}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.tint} flex items-center justify-center text-white font-bold text-lg shadow-sm`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {staff.fullName || "Ism kiritilmagan"}
                        </h3>
                        <a
                          href={`tel:${staff.number}`}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <Phone size={12} />
                          <span className="truncate">{staff.number}</span>
                        </a>
                      </div>
                    </div>

                    {/* 3-dot menu */}
                    <div
                      className="relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === staff.id ? null : staff.id)
                        }
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {menuOpen === staff.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden">
                          <button
                            onClick={() => {
                              setMenuOpen(null);
                              setEditing(staff);
                              setShowModal(true);
                            }}
                            className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Pencil size={14} />
                            Tahrirlash
                          </button>
                          {staff.role !== "ADMIN" && (
                            <button
                              onClick={() => {
                                setMenuOpen(null);
                                handleChangeRole(staff, "ADMIN");
                              }}
                              className="w-full px-4 py-2.5 text-sm text-left text-violet-700 hover:bg-violet-50 flex items-center gap-2"
                            >
                              <Crown size={14} />
                              Admin qilish
                            </button>
                          )}
                          {staff.role !== "COURIER" && (
                            <button
                              onClick={() => {
                                setMenuOpen(null);
                                handleChangeRole(staff, "COURIER");
                              }}
                              className="w-full px-4 py-2.5 text-sm text-left text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                            >
                              <Truck size={14} />
                              Kuryer qilish
                            </button>
                          )}
                          <div className="h-px bg-gray-100" />
                          <button
                            onClick={() => {
                              setMenuOpen(null);
                              setDeleteTarget(staff);
                            }}
                            className="w-full px-4 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Xodimlikdan olish
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role badge */}
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.pill}`}
                    >
                      <Icon size={12} />
                      {meta.label}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <Calendar size={11} />
                      {formatDate(staff.createdAt)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                    {meta.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============ CREATE / EDIT MODAL ============ */}
      {showModal && (
        <StaffModal
          editing={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditing(null);
            fetchStaff();
          }}
        />
      )}

      {/* ============ DELETE CONFIRM ============ */}
      {deleteTarget && (
        <DeleteModal
          staff={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await axios.delete(
                `${API_BASE_URL}/admin/staff/${deleteTarget.id}`,
              );
              setDeleteTarget(null);
              fetchStaff();
            } catch (err: any) {
              alert(err.response?.data?.message || "O'chirishda xatolik");
            }
          }}
        />
      )}
    </div>
  );
}

// ======================= Create/Edit Modal =======================
function StaffModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Staff | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(editing?.fullName || "");
  const [number, setNumber] = useState(editing?.number || "+998");
  const [role, setRole] = useState<Role>(editing?.role || "COURIER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("F.I.SH majburiy");
      return;
    }
    const normalized = normalizePhone(number);
    if (!editing && !isValidPhone(normalized)) {
      setError("Telefon raqam formati: +998XXXXXXXXX");
      return;
    }

    try {
      setSaving(true);
      if (editing) {
        await axios.patch(`${API_BASE_URL}/admin/staff/${editing.id}`, {
          fullName: fullName.trim(),
          role,
        });
      } else {
        await axios.post(`${API_BASE_URL}/admin/staff`, {
          fullName: fullName.trim(),
          number: normalized,
          role,
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
              <UserCog className="text-white" size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "Xodimni tahrirlash" : "Yangi xodim"}
              </h2>
              <p className="text-xs text-gray-500">
                {editing
                  ? `#${editing.id} — ma'lumotlarni yangilash`
                  : "Admin yoki kuryer qo'shish"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-5"
        >
          {/* Full name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <UserIcon size={15} className="text-emerald-600" />
              F.I.SH <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Eshmatov Toshmat"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Phone size={15} className="text-emerald-600" />
              Telefon raqami{" "}
              {!editing && <span className="text-red-500">*</span>}
            </label>
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={!!editing}
              required
              placeholder="+998901234567"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
            {editing && (
              <p className="mt-1.5 text-xs text-gray-500">
                Telefon raqamni o'zgartirib bo'lmaydi
              </p>
            )}
          </div>

          {/* Role picker */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Shield size={15} className="text-emerald-600" />
              Rol <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["COURIER", "ADMIN"] as Role[]).map((r) => {
                const meta = ROLE_META[r];
                const Icon = meta.icon;
                const active = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`inline-flex p-2 rounded-lg mb-2 ${
                        active
                          ? "bg-white/20"
                          : `${meta.iconBg} ${meta.accent}`
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <p className="font-bold text-sm">{meta.label}</p>
                    <p
                      className={`text-[11px] mt-1 leading-snug ${
                        active ? "text-white/70" : "text-gray-500"
                      }`}
                    >
                      {meta.description}
                    </p>
                    {active && (
                      <CheckCircle2
                        size={16}
                        className="absolute top-3 right-3 text-white"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-800">
              <AlertTriangle
                size={16}
                className="flex-shrink-0 mt-0.5 text-red-500"
              />
              <span>{error}</span>
            </div>
          )}
        </form>

        <div className="p-4 border-t border-gray-100 flex gap-2.5 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 bg-white rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saqlanmoqda...
              </>
            ) : editing ? (
              <>
                <CheckCircle2 size={18} />
                Saqlash
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Qo'shish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ======================= Delete Modal =======================
function DeleteModal({
  staff,
  onCancel,
  onConfirm,
}: {
  staff: Staff;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const meta = ROLE_META[staff.role];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-red-50">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Xodimni olib tashlash
              </h3>
              <p className="text-sm text-gray-500">
                Rol o'zgaradi — tarix saqlanadi
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 mb-4 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.tint} flex items-center justify-center text-white font-bold text-sm`}
            >
              {getInitials(staff.fullName, staff.number)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-900 truncate">
                {staff.fullName || "Ism kiritilmagan"}
              </p>
              <p className="text-xs text-gray-500">
                {staff.number} · {meta.label}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            <strong>{staff.fullName}</strong> oddiy foydalanuvchiga aylantiriladi.
            Admin panelga va xodimlar funksiyasiga kira olmaydi.
          </p>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 border border-gray-300 bg-white rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            onClick={async () => {
              setDeleting(true);
              await onConfirm();
              setDeleting(false);
            }}
            disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {deleting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                O'chirilmoqda
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Olib tashlash
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
