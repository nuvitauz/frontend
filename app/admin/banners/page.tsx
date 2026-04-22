"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Image as ImageIcon,
  AlertCircle,
  X,
  Upload,
  RefreshCw,
  ExternalLink,
  Pencil,
  Images,
  Layers,
  Link2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  MonitorPlay,
} from "lucide-react";

interface Banner {
  id: number;
  image: string;
  link: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

const MAX_BANNERS = 5;
const RECOMMENDED_WIDTH = 2458;
const RECOMMENDED_HEIGHT = 1024;
const DEFAULT_LINK = "https://nuvita.uz/";
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

// ---------- Helpers ----------
const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// ---------- StatCard ----------
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number | string;
  color: "emerald" | "blue" | "amber" | "slate";
}) {
  const gradClass =
    color === "emerald"
      ? "from-emerald-500 to-green-600"
      : color === "blue"
      ? "from-blue-500 to-indigo-600"
      : color === "amber"
      ? "from-amber-500 to-orange-600"
      : "from-slate-500 to-slate-700";
  const iconBg =
    color === "emerald"
      ? "bg-emerald-50 text-emerald-600"
      : color === "blue"
      ? "bg-blue-50 text-blue-600"
      : color === "amber"
      ? "bg-amber-50 text-amber-600"
      : "bg-slate-50 text-slate-600";

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradClass} opacity-10`}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function BannerPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [link, setLink] = useState(DEFAULT_LINK);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/banner`);
      setBanners(res.data);
    } catch (error) {
      console.error("Bannerlarni yuklashda xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const stats = useMemo(() => {
    const active = banners.filter((b) => b.isActive).length;
    const inactive = banners.length - active;
    const slots = MAX_BANNERS - banners.length;
    return { total: banners.length, active, inactive, slots };
  }, [banners]);

  const openModal = (banner?: Banner) => {
    setFormError(null);
    if (banner) {
      setEditingBanner(banner);
      setLink(banner.link || DEFAULT_LINK);
      setIsActive(banner.isActive);
      setPreviewUrl(`${API_BASE_URL}${banner.image}`);
    } else {
      setEditingBanner(null);
      setLink(DEFAULT_LINK);
      setIsActive(true);
      setPreviewUrl(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBanner(null);
    setImageFile(null);
    setPreviewUrl(null);
    setLink(DEFAULT_LINK);
    setIsActive(true);
    setFormError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      setFormError("Faqat JPG, PNG yoki WebP formatdagi rasmlar qabul qilinadi");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Rasm hajmi 10MB dan oshmasligi kerak");
      return;
    }
    setFormError(null);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const saveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!editingBanner && !imageFile) {
      setFormError("Iltimos, banner rasmini yuklang");
      return;
    }

    const finalLink = link.trim() || DEFAULT_LINK;
    if (finalLink && !isValidUrl(finalLink)) {
      setFormError("Havola noto'g'ri formatda. Masalan: https://nuvita.uz/");
      return;
    }

    setUploading(true);

    try {
      if (editingBanner) {
        if (imageFile) {
          const formData = new FormData();
          formData.append("image", imageFile);
          await axios.patch(
            `${API_BASE_URL}/admin/banner/${editingBanner.id}/image`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
        }
        await axios.patch(`${API_BASE_URL}/admin/banner/${editingBanner.id}`, {
          link: finalLink,
          isActive,
        });
      } else {
        const formData = new FormData();
        formData.append("image", imageFile!);
        formData.append("link", finalLink);
        await axios.post(`${API_BASE_URL}/admin/banner`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      closeModal();
      fetchBanners();
    } catch (error: any) {
      setFormError(
        error.response?.data?.message || "Saqlashda xatolik yuz berdi",
      );
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await axios.delete(`${API_BASE_URL}/admin/banner/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchBanners();
    } catch {
      alert("O'chirishda xatolik yuz berdi");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (banner: Banner) => {
    try {
      await axios.patch(`${API_BASE_URL}/admin/banner/${banner.id}`, {
        isActive: !banner.isActive,
      });
      fetchBanners();
    } catch {
      alert("Holatni o'zgartirishda xatolik");
    }
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragging(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOver(index);
  };

  const handleDragEnd = async () => {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      const newBanners = [...banners];
      const [removed] = newBanners.splice(dragging, 1);
      newBanners.splice(dragOver, 0, removed);

      setBanners(newBanners);

      try {
        await axios.post(`${API_BASE_URL}/admin/banner/reorder`, {
          orderedIds: newBanners.map((b) => b.id),
        });
      } catch {
        fetchBanners();
      }
    }

    setDragging(null);
    setDragOver(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-500" size={36} />
      </div>
    );
  }

  const slotsLeft = MAX_BANNERS - banners.length;

  return (
    <div className="space-y-6">
      {/* ===================== HEADER ===================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
            <MonitorPlay className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bannerlar</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Bosh sahifadagi slayd bannerlarni boshqaring
            </p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          disabled={banners.length >= MAX_BANNERS}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all"
        >
          <Plus size={18} />
          Yangi banner
        </button>
      </div>

      {/* ===================== STATS ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Images}
          label="Jami bannerlar"
          value={`${stats.total}/${MAX_BANNERS}`}
          color="slate"
        />
        <StatCard
          icon={CheckCircle2}
          label="Faol"
          value={stats.active}
          color="emerald"
        />
        <StatCard
          icon={EyeOff}
          label="Nofaol"
          value={stats.inactive}
          color="amber"
        />
        <StatCard
          icon={Layers}
          label="Bo'sh slotlar"
          value={stats.slots}
          color="blue"
        />
      </div>

      {/* ===================== INFO ===================== */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-white shadow-sm h-fit">
            <AlertCircle className="text-blue-500" size={18} />
          </div>
          <div className="flex-1">
            <p className="text-blue-900 font-semibold text-sm">
              Bannerlar haqida
            </p>
            <p className="text-blue-700 text-sm mt-1 leading-relaxed">
              Tavsiya etilgan o'lcham:{" "}
              <strong>
                {RECOMMENDED_WIDTH}×{RECOMMENDED_HEIGHT}
              </strong>{" "}
              piksel. Bannerlar har 2 sekundda almashib turadi va tartibini
              sudrab o'zgartirishingiz mumkin.
            </p>
          </div>
        </div>
      </div>

      {/* ===================== LIST ===================== */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
            <ImageIcon className="text-emerald-600" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Hali banner yo'q
          </h3>
          <p className="text-gray-500 mb-5 max-w-sm mx-auto">
            Bosh sahifaning yuqori qismida ko'rsatiladigan birinchi banneringizni
            qo'shing
          </p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm"
          >
            <Plus size={18} />
            Birinchi bannerni qo'shish
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white rounded-2xl border p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 transition-all ${
                dragging === index
                  ? "opacity-50 scale-[0.98] shadow-xl"
                  : "shadow-sm hover:shadow-md"
              } ${
                dragOver === index
                  ? "border-emerald-400 ring-2 ring-emerald-100"
                  : "border-gray-100"
              }`}
            >
              {/* Top row on mobile */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Drag handle + order */}
                <div className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none">
                  <GripVertical className="text-gray-300" size={18} />
                  <span className="text-[10px] font-bold text-gray-400">
                    #{index + 1}
                  </span>
                </div>

                {/* Image preview */}
                <div className="w-24 h-14 sm:w-36 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img
                    src={`${API_BASE_URL}${banner.image}`}
                    alt={`Banner ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      Banner #{index + 1}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        banner.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {banner.isActive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Faol
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Nofaol
                        </>
                      )}
                    </span>
                  </div>
                  <a
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-blue-600 hover:text-blue-800 truncate group/link"
                  >
                    <Link2
                      size={13}
                      className="flex-shrink-0 text-gray-400 group-hover/link:text-blue-500"
                    />
                    <span className="truncate">{banner.link}</span>
                    <ExternalLink
                      size={11}
                      className="flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity"
                    />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:border-l sm:pl-4 sm:border-gray-100">
                <button
                  onClick={() => toggleStatus(banner)}
                  className={`p-2 rounded-xl transition-colors ${
                    banner.isActive
                      ? "text-emerald-600 hover:bg-emerald-50"
                      : "text-gray-400 hover:bg-gray-50"
                  }`}
                  title={banner.isActive ? "Nofaol qilish" : "Faollashtirish"}
                >
                  {banner.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button
                  onClick={() => openModal(banner)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  title="Tahrirlash"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => setDeleteTarget(banner)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="O'chirish"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* Remaining slots hint */}
          {slotsLeft > 0 && (
            <button
              onClick={() => openModal()}
              className="w-full py-6 border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-2xl text-gray-500 hover:text-emerald-700 font-medium transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Yana {slotsLeft} ta banner qo'shish mumkin
            </button>
          )}
        </div>
      )}

      {/* ===================== CREATE/EDIT MODAL ===================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                  <MonitorPlay className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editingBanner ? "Bannerni tahrirlash" : "Yangi banner"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingBanner
                      ? `#${editingBanner.id} — ma'lumotlarni yangilash`
                      : "Rasm va havola kiriting"}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <form
              onSubmit={saveBanner}
              className="flex-1 overflow-y-auto p-5 space-y-5"
            >
              {/* Image upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                  <ImageIcon size={15} className="text-emerald-600" />
                  Banner rasmi{" "}
                  {!editingBanner && <span className="text-red-500">*</span>}
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 group/preview bg-gray-50">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-56 sm:h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-end justify-end p-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/95 hover:bg-white text-gray-800 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <RefreshCw size={14} />
                        Rasmni almashtirish
                      </button>
                    </div>
                    {imageFile && (
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-full">
                        Yangi rasm
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-56 sm:h-64 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
                  >
                    <div className="p-3 rounded-2xl bg-gray-50">
                      <Upload size={28} className="text-gray-500" />
                    </div>
                    <span className="text-gray-700 font-semibold">
                      Rasm yuklash uchun bosing
                    </span>
                    <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                      <span>
                        Tavsiya etiladi: {RECOMMENDED_WIDTH}×{RECOMMENDED_HEIGHT}{" "}
                        piksel
                      </span>
                      <span>JPG, PNG, WebP · Maksimum 10MB</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Link */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                  <Link2 size={15} className="text-emerald-600" />
                  Havola (ixtiyoriy)
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder={DEFAULT_LINK}
                    className="w-full pl-4 pr-28 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm"
                  />
                  {link !== DEFAULT_LINK && (
                    <button
                      type="button"
                      onClick={() => setLink(DEFAULT_LINK)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Standart
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-start gap-1.5">
                  <AlertCircle
                    size={13}
                    className="flex-shrink-0 mt-0.5 text-gray-400"
                  />
                  <span>
                    Foydalanuvchi bannerni bossa shu manzilga o'tadi. Bo'sh
                    qoldirilsa avtomatik{" "}
                    <strong className="text-emerald-700">{DEFAULT_LINK}</strong>{" "}
                    bo'ladi.
                  </span>
                </p>
              </div>

              {/* Status (only for edit) */}
              {editingBanner && (
                <div className="flex items-center justify-between gap-3 p-3.5 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Banner holati
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isActive
                        ? "Foydalanuvchilar saytda ko'rishadi"
                        : "Saytda ko'rinmaydi"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6.5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 h-6 w-11" />
                  </label>
                </div>
              )}

              {/* Error */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-800">
                  <AlertTriangle
                    size={16}
                    className="flex-shrink-0 mt-0.5 text-red-500"
                  />
                  <span>{formError}</span>
                </div>
              )}
            </form>

            {/* Modal footer */}
            <div className="p-4 border-t border-gray-100 flex gap-2.5 bg-gray-50">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-3 border border-gray-300 bg-white rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={saveBanner}
                disabled={uploading || (!editingBanner && !imageFile)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saqlanmoqda...
                  </>
                ) : editingBanner ? (
                  <>
                    <CheckCircle2 size={18} />
                    Saqlash
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Qo'shish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRM ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-red-50">
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Bannerni o'chirish
                  </h3>
                  <p className="text-sm text-gray-500">
                    Bu amal qaytarib bo'lmaydi
                  </p>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4">
                <img
                  src={`${API_BASE_URL}${deleteTarget.image}`}
                  alt="banner"
                  className="w-full h-32 object-cover"
                />
              </div>
              <p className="text-sm text-gray-600">
                Siz haqiqatan ham bu bannerni butunlay o'chirib yubormoqchimisiz?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 bg-white rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmDelete}
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
                    O'chirish
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
