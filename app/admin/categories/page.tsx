"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FolderTree,
  Check,
  X,
  Layers,
  Globe2,
  Power,
  AlertTriangle,
} from "lucide-react";

interface CategoryTranslation {
  id: number;
  lang: "UZ" | "RU" | "EN";
  name: string;
}

interface Category {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  translations: CategoryTranslation[];
}

type LangTab = "UZ" | "RU" | "EN";

const LANG_META: Record<
  LangTab,
  { flag: string; label: string; placeholder: string; required: boolean }
> = {
  UZ: {
    flag: "🇺🇿",
    label: "O'zbekcha",
    placeholder: "Masalan: Vitaminlar",
    required: true,
  },
  RU: {
    flag: "🇷🇺",
    label: "Ruscha",
    placeholder: "Например: Витамины",
    required: false,
  },
  EN: {
    flag: "🇬🇧",
    label: "Inglizcha",
    placeholder: "For example: Vitamins",
    required: false,
  },
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<LangTab>("UZ");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/category`);
      setCategories(res.data);
    } catch (error) {
      console.error(error);
      alert("Kategoriyalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openForm = (cat?: Category) => {
    setActiveLang("UZ");
    if (cat) {
      setEditingId(cat.id);
      setName(cat.name);
      const ruT = cat.translations?.find((t) => t.lang === "RU");
      const enT = cat.translations?.find((t) => t.lang === "EN");
      setNameRu(ruT?.name || "");
      setNameEn(enT?.name || "");
    } else {
      setEditingId(null);
      setName("");
      setNameRu("");
      setNameEn("");
    }
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingId(null);
    setName("");
    setNameRu("");
    setNameEn("");
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("O'zbekcha nomi majburiy");
      setActiveLang("UZ");
      return;
    }
    setSaving(true);

    const payload = {
      name: name.trim(),
      translations: {
        ru: nameRu.trim() ? { name: nameRu.trim() } : undefined,
        en: nameEn.trim() ? { name: nameEn.trim() } : undefined,
      },
    };

    try {
      if (editingId) {
        await axios.patch(`${API_BASE_URL}/admin/category/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/admin/category`, payload);
      }
      closeForm();
      fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(`${API_BASE_URL}/admin/category/${id}`, {
        isActive: !currentStatus,
      });
      fetchCategories();
    } catch (error) {
      alert("Holatni o'zgartirishda xatolik");
    }
  };

  const confirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/category/${deletingId}`);
      setDeletingId(null);
      fetchCategories();
    } catch (error: any) {
      alert(
        error?.response?.data?.message ||
          "O'chirishda xatolik yuz berdi. Kategoriyaga bog'liq mahsulotlar bo'lishi mumkin."
      );
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((c) => {
      if (statusFilter === "active" && !c.isActive) return false;
      if (statusFilter === "inactive" && c.isActive) return false;
      if (!q) return true;
      if (c.name.toLowerCase().includes(q)) return true;
      return c.translations?.some((t) =>
        t.name?.toLowerCase().includes(q)
      );
    });
  }, [categories, search, statusFilter]);

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.isActive).length;
    const withTranslations = categories.filter(
      (c) => (c.translations?.length ?? 0) > 0
    ).length;
    return { total, active, inactive: total - active, withTranslations };
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
            <FolderTree size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Kategoriyalar
            </h1>
            <p className="text-sm text-gray-500">
              Mahsulotlarni guruhlash uchun kategoriyalarni boshqaring
            </p>
          </div>
        </div>
        <button
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-colors"
        >
          <Plus size={18} />
          Yangi kategoriya
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Layers size={18} />}
          label="Jami"
          value={stats.total}
          color="bg-slate-100 text-slate-700"
        />
        <StatCard
          icon={<Check size={18} />}
          label="Faol"
          value={stats.active}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          icon={<X size={18} />}
          label="Faol emas"
          value={stats.inactive}
          color="bg-rose-50 text-rose-700"
        />
        <StatCard
          icon={<Globe2 size={18} />}
          label="Tarjima bilan"
          value={stats.withTranslations}
          color="bg-blue-50 text-blue-700"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nomi yoki tarjimasi bo'yicha qidiring..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === s
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {s === "all" ? "Barchasi" : s === "active" ? "Faol" : "Faol emas"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <FolderTree size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">
              {search || statusFilter !== "all"
                ? "Filtrga mos kategoriya topilmadi"
                : "Hali kategoriya qo'shilmagan"}
            </p>
            {!search && statusFilter === "all" && (
              <button
                onClick={() => openForm()}
                className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
              >
                <Plus size={16} />
                Birinchi kategoriyani qo'shish
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                onEdit={() => openForm(cat)}
                onDelete={() => setDeletingId(cat.id)}
                onToggle={() => toggleStatus(cat.id, cat.isActive)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal — Create/Edit */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeForm}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  O'zbekcha nomi majburiy, tarjimalar ixtiyoriy
                </p>
              </div>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveCategory} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">
                {/* Language tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {(Object.keys(LANG_META) as LangTab[]).map((lang) => {
                    const meta = LANG_META[lang];
                    const val =
                      lang === "UZ" ? name : lang === "RU" ? nameRu : nameEn;
                    const hasValue = val.trim().length > 0;
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          activeLang === lang
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <span>{meta.flag}</span>
                        <span className="hidden sm:inline">{meta.label}</span>
                        {hasValue && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                        {meta.required && (
                          <span className="text-[10px] text-rose-500">*</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active language input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {LANG_META[activeLang].flag} Kategoriya nomi
                    {LANG_META[activeLang].required && (
                      <span className="text-rose-500 ml-1">*</span>
                    )}
                  </label>
                  {activeLang === "UZ" && (
                    <input
                      autoFocus
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={LANG_META.UZ.placeholder}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition"
                    />
                  )}
                  {activeLang === "RU" && (
                    <input
                      autoFocus
                      type="text"
                      value={nameRu}
                      onChange={(e) => setNameRu(e.target.value)}
                      placeholder={LANG_META.RU.placeholder}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
                    />
                  )}
                  {activeLang === "EN" && (
                    <input
                      autoFocus
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder={LANG_META.EN.placeholder}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition"
                    />
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    {activeLang === "UZ"
                      ? "Saytda asosiy til sifatida ishlatiladi."
                      : "Foydalanuvchi tilni o'zgartirsa shu nom ko'rsatiladi."}
                  </p>
                </div>

                {/* Summary of other languages */}
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(LANG_META) as LangTab[])
                    .filter((l) => l !== activeLang)
                    .map((lang) => {
                      const val =
                        lang === "UZ" ? name : lang === "RU" ? nameRu : nameEn;
                      return (
                        <button
                          type="button"
                          key={lang}
                          onClick={() => setActiveLang(lang)}
                          className="text-left p-3 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition"
                        >
                          <div className="text-xs text-gray-500 flex items-center gap-1 mb-0.5">
                            <span>{LANG_META[lang].flag}</span>
                            <span>{LANG_META[lang].label}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {val || (
                              <span className="text-gray-300">kiritilmagan</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saqlanmoqda
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      {editingId ? "Saqlash" : "Qo'shish"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Kategoriyani o'chirmoqchimisiz?
              </h3>
              <p className="text-sm text-gray-500">
                Bu amalni qaytarib bo'lmaydi. Agar kategoriyaga bog'liq
                mahsulotlar bo'lsa, o'chirish amalga oshmaydi.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-xl font-extrabold text-gray-900 leading-none mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  cat,
  onEdit,
  onDelete,
  onToggle,
}: {
  cat: Category;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const ruName = cat.translations?.find((t) => t.lang === "RU")?.name;
  const enName = cat.translations?.find((t) => t.lang === "EN")?.name;

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 hover:bg-gray-50/70 transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-gray-400">#{cat.id}</span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
              cat.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                cat.isActive ? "bg-emerald-500" : "bg-gray-400"
              }`}
            ></span>
            {cat.isActive ? "Faol" : "Faol emas"}
          </span>
        </div>
        <div className="text-base font-bold text-gray-900 truncate">
          {cat.name}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          {ruName && (
            <span className="inline-flex items-center gap-1">
              🇷🇺 <span className="font-medium text-gray-700">{ruName}</span>
            </span>
          )}
          {enName && (
            <span className="inline-flex items-center gap-1">
              🇬🇧 <span className="font-medium text-gray-700">{enName}</span>
            </span>
          )}
          {!ruName && !enName && (
            <span className="text-gray-400 italic">Tarjimalar qo'shilmagan</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          title={cat.isActive ? "Nofaol qilish" : "Faol qilish"}
          className={`p-2 rounded-lg transition ${
            cat.isActive
              ? "text-emerald-600 hover:bg-emerald-50"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          }`}
        >
          <Power size={18} />
        </button>
        <button
          onClick={onEdit}
          title="Tahrirlash"
          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={onDelete}
          title="O'chirish"
          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
