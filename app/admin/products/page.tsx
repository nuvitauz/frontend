"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  X,
  Plus,
  Image as ImageIcon,
  Star,
  Package,
  Search,
  Pencil,
  Trash2,
  Power,
  Check,
  AlertTriangle,
  DollarSign,
  Archive,
  FileText,
  Globe2,
  Camera,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface ProductTranslation {
  id: number;
  lang: "RU" | "EN";
  name: string;
  ingredients: string | null;
  uses: string | null;
  description: string | null;
}

interface Product {
  id: number;
  productId: string;
  name: string;
  photos: string[];
  category: string;
  ingredients: string | null;
  uses: string | null;
  description: string | null;
  price: number;
  amount: number;
  isActive: boolean;
  createdAt: string;
  translations?: ProductTranslation[];
}

type FormStep = "photos" | "main" | "details";
type DetailsLang = "UZ" | "RU" | "EN";

const STEP_META: Record<
  FormStep,
  { label: string; icon: React.ReactNode }
> = {
  photos: { label: "Rasmlar", icon: <Camera size={16} /> },
  main: { label: "Asosiy", icon: <Package size={16} /> },
  details: { label: "Tafsilotlar", icon: <FileText size={16} /> },
};

const LANG_META: Record<
  DetailsLang,
  { flag: string; label: string; color: string }
> = {
  UZ: { flag: "🇺🇿", label: "O'zbekcha", color: "emerald" },
  RU: { flag: "🇷🇺", label: "Ruscha", color: "blue" },
  EN: { flag: "🇬🇧", label: "Inglizcha", color: "purple" },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const [step, setStep] = useState<FormStep>("photos");
  const [detailsLang, setDetailsLang] = useState<DetailsLang>("UZ");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [ingredients, setIngredients] = useState("");
  const [uses, setUses] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  const [nameRu, setNameRu] = useState("");
  const [ingredientsRu, setIngredientsRu] = useState("");
  const [usesRu, setUsesRu] = useState("");
  const [descriptionRu, setDescriptionRu] = useState("");

  const [nameEn, setNameEn] = useState("");
  const [ingredientsEn, setIngredientsEn] = useState("");
  const [usesEn, setUsesEn] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/product`);
      setProducts(res.data);
    } catch (error) {
      console.error(error);
      alert("Mahsulotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/category`);
      setCategories(res.data.filter((c: any) => c.isActive));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openForm = (prod?: Product) => {
    setStep("photos");
    setDetailsLang("UZ");
    if (prod) {
      setEditingId(prod.id);
      setName(prod.name);
      setCategory(prod.category);
      setPrice(prod.price);
      setAmount(prod.amount);
      setIngredients(prod.ingredients || "");
      setUses(prod.uses || "");
      setDescription(prod.description || "");
      setExistingPhotos(prod.photos || []);

      const ruTrans = prod.translations?.find((t) => t.lang === "RU");
      setNameRu(ruTrans?.name || "");
      setIngredientsRu(ruTrans?.ingredients || "");
      setUsesRu(ruTrans?.uses || "");
      setDescriptionRu(ruTrans?.description || "");

      const enTrans = prod.translations?.find((t) => t.lang === "EN");
      setNameEn(enTrans?.name || "");
      setIngredientsEn(enTrans?.ingredients || "");
      setUsesEn(enTrans?.uses || "");
      setDescriptionEn(enTrans?.description || "");
    } else {
      setEditingId(null);
      setName("");
      setCategory(categories[0]?.name || "");
      setPrice(0);
      setAmount(0);
      setIngredients("");
      setUses("");
      setDescription("");
      setExistingPhotos([]);
      setNameRu("");
      setIngredientsRu("");
      setUsesRu("");
      setDescriptionRu("");
      setNameEn("");
      setIngredientsEn("");
      setUsesEn("");
      setDescriptionEn("");
    }
    setFiles([]);
    fileInputRefs.current.forEach((input) => {
      if (input) input.value = "";
    });
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setFiles([]);
    setExistingPhotos([]);
  };

  const handleFileAddToSlot = (
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number
  ) => {
    const newFile = e.target.files?.[0];
    if (!newFile) return;

    const allPhotos = [
      ...existingPhotos.map((p) => ({ type: "existing" as const, value: p })),
      ...files.map((f) => ({ type: "new" as const, value: f })),
    ];

    if (slotIndex < allPhotos.length) {
      if (slotIndex < existingPhotos.length) {
        const newExisting = [...existingPhotos];
        newExisting.splice(slotIndex, 1);
        setExistingPhotos(newExisting);
        const insertIndex = slotIndex;
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles.splice(insertIndex, 0, newFile);
          return newFiles;
        });
      } else {
        const fileIndex = slotIndex - existingPhotos.length;
        setFiles((prev) => {
          const newFiles = [...prev];
          newFiles[fileIndex] = newFile;
          return newFiles;
        });
      }
    } else {
      setFiles((prev) => [...prev, newFile]);
    }

    if (fileInputRefs.current[slotIndex]) {
      fileInputRefs.current[slotIndex]!.value = "";
    }
  };

  const removePhotoAtIndex = (index: number) => {
    if (index < existingPhotos.length) {
      setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingPhotos.length;
      setFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  };

  const getAllPhotos = () => {
    const combined: {
      type: "existing" | "new";
      value: string | File;
      index: number;
    }[] = [];
    existingPhotos.forEach((p, i) =>
      combined.push({ type: "existing", value: p, index: i })
    );
    files.forEach((f, i) =>
      combined.push({
        type: "new",
        value: f,
        index: existingPhotos.length + i,
      })
    );
    return combined;
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard against implicit form submission (e.g. user presses Enter in an
    // input on an earlier step). Without this, a single Enter key can create
    // the product before the admin filled in translations/details.
    if (step !== "details") {
      // Only advance if the current step is valid, otherwise stay put.
      if (step === "photos") {
        if (!editingId && files.length === 0 && existingPhotos.length === 0) {
          return;
        }
        setStep("main");
      } else if (step === "main") {
        if (!name.trim() || !category || !(price > 0)) return;
        setStep("details");
      }
      return;
    }

    if (!name.trim()) {
      setStep("main");
      alert("Mahsulot nomi majburiy");
      return;
    }
    if (!category) {
      setStep("main");
      alert("Kategoriya tanlanmagan!");
      return;
    }
    if (!editingId && files.length === 0 && existingPhotos.length === 0) {
      setStep("photos");
      alert("Kamida 1 ta rasm yuklang!");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("price", price.toString());
      formData.append("amount", amount.toString());
      formData.append("ingredients", ingredients);
      formData.append("uses", uses);
      formData.append("description", description);

      if (nameRu) formData.append("nameRu", nameRu);
      if (ingredientsRu) formData.append("ingredientsRu", ingredientsRu);
      if (usesRu) formData.append("usesRu", usesRu);
      if (descriptionRu) formData.append("descriptionRu", descriptionRu);

      if (nameEn) formData.append("nameEn", nameEn);
      if (ingredientsEn) formData.append("ingredientsEn", ingredientsEn);
      if (usesEn) formData.append("usesEn", usesEn);
      if (descriptionEn) formData.append("descriptionEn", descriptionEn);

      if (existingPhotos.length > 0) {
        formData.append("existingPhotos", JSON.stringify(existingPhotos));
      }

      files.forEach((file) => {
        formData.append("photos", file);
      });

      if (editingId) {
        await axios.patch(
          `${API_BASE_URL}/admin/product/${editingId}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      } else {
        await axios.post(`${API_BASE_URL}/admin/product`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      closeForm();
      fetchProducts();
    } catch (error: any) {
      alert(error.response?.data?.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(`${API_BASE_URL}/admin/product/${id}`, {
        isActive: !currentStatus,
      });
      fetchProducts();
    } catch (error) {
      alert("Holatni o'zgartirishda xatolik");
    }
  };

  const confirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/product/${deletingId}`);
      setDeletingId(null);
      fetchProducts();
    } catch (error) {
      alert("O'chirishda xatolik");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "inactive" && p.isActive) return false;
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q)
      );
    });
  }, [products, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.isActive).length;
    const outOfStock = products.filter((p) => p.amount === 0).length;
    const lowStock = products.filter((p) => p.amount > 0 && p.amount < 10).length;
    return { total, active, inactive: total - active, outOfStock, lowStock };
  }, [products]);

  const totalPhotos = getAllPhotos().length;
  const nextStep = () => {
    if (step === "photos") setStep("main");
    else if (step === "main") setStep("details");
  };
  const prevStep = () => {
    if (step === "details") setStep("main");
    else if (step === "main") setStep("photos");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
            <Package size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              Mahsulotlar
            </h1>
            <p className="text-sm text-gray-500">
              Barcha mahsulotlarni boshqaring, rasm va tarjimalar qo'shing
            </p>
          </div>
        </div>
        <button
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-colors"
        >
          <Plus size={18} />
          Yangi mahsulot
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Package size={18} />}
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
          icon={<TrendingUp size={18} />}
          label="Kam qolgan"
          value={stats.lowStock}
          color="bg-amber-50 text-amber-700"
        />
        <StatCard
          icon={<Archive size={18} />}
          label="Tugagan"
          value={stats.outOfStock}
          color="bg-rose-50 text-rose-700"
        />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nomi, ID yoki kategoriya bo'yicha qidiring..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[160px]"
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
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
                {s === "all"
                  ? "Barchasi"
                  : s === "active"
                  ? "Faol"
                  : "Faol emas"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                view === "grid"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Kartochka
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Ro'yxat
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-gray-500">
          Yuklanmoqda...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {search || statusFilter !== "all" || categoryFilter
              ? "Filtrga mos mahsulot topilmadi"
              : "Hali mahsulot qo'shilmagan"}
          </p>
          {!search && statusFilter === "all" && !categoryFilter && (
            <button
              onClick={() => openForm()}
              className="mt-4 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
            >
              <Plus size={16} />
              Birinchi mahsulotni qo'shish
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={() => openForm(p)}
              onDelete={() => setDeletingId(p.id)}
              onToggle={() => toggleStatus(p.id, p.isActive)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
          {filtered.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              onEdit={() => openForm(p)}
              onDelete={() => setDeletingId(p.id)}
              onToggle={() => toggleStatus(p.id, p.isActive)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeForm}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingId
                    ? name || "Tahrirlanayotgan mahsulot"
                    : "Uch bosqichda to'ldiring: rasmlar, asosiy ma'lumotlar, tafsilotlar"}
                </p>
              </div>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Steps */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {(Object.keys(STEP_META) as FormStep[]).map((s, i) => {
                  const active = step === s;
                  const completed = getStepStatus(s, {
                    totalPhotos,
                    name,
                    category,
                    price,
                  });
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <button
                        type="button"
                        onClick={() => setStep(s)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : completed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-white text-gray-600 border border-gray-200"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold">
                          {completed && !active ? (
                            <Check size={12} />
                          ) : (
                            i + 1
                          )}
                        </span>
                        <span className="hidden sm:inline">{STEP_META[s].label}</span>
                      </button>
                      {i < 2 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 ${
                            completed ? "bg-emerald-300" : "bg-gray-200"
                          }`}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={saveProduct}
              className="flex-1 overflow-y-auto px-6 py-5"
            >
              {/* STEP: photos */}
              {step === "photos" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Camera size={18} className="text-emerald-600" />
                      Mahsulot rasmlari
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      1-5 ta rasm yuklang. Birinchi rasm asosiy rasm sifatida
                      saytda ko'rinadi.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[0, 1, 2, 3, 4].map((slotIndex) => {
                      const allPhotos = getAllPhotos();
                      const photo = allPhotos[slotIndex];
                      const isMain = slotIndex === 0;
                      const hasPhoto = !!photo;

                      return (
                        <div key={slotIndex} className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            ref={(el) => {
                              fileInputRefs.current[slotIndex] = el;
                            }}
                            onChange={(e) => handleFileAddToSlot(e, slotIndex)}
                            className="hidden"
                            id={`photo-slot-${slotIndex}`}
                          />

                          {hasPhoto ? (
                            <div
                              className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                                isMain
                                  ? "border-emerald-500 ring-2 ring-emerald-200"
                                  : "border-gray-200"
                              } group`}
                            >
                              <img
                                src={
                                  photo.type === "existing"
                                    ? `${API_BASE_URL}${photo.value}`
                                    : URL.createObjectURL(photo.value as File)
                                }
                                alt={`Rasm ${slotIndex + 1}`}
                                className="w-full h-full object-cover"
                              />

                              {isMain && (
                                <div className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow">
                                  <Star size={10} fill="white" />
                                  <span>Asosiy</span>
                                </div>
                              )}

                              <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {slotIndex + 1}
                              </div>

                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label
                                  htmlFor={`photo-slot-${slotIndex}`}
                                  className="w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                                  title="Almashtirish"
                                >
                                  <ImageIcon size={14} className="text-gray-700" />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => removePhotoAtIndex(slotIndex)}
                                  className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors"
                                  title="O'chirish"
                                >
                                  <X size={14} className="text-white" />
                                </button>
                              </div>

                              {photo.type === "new" && (
                                <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded">
                                  Yangi
                                </div>
                              )}
                            </div>
                          ) : (
                            <label
                              htmlFor={`photo-slot-${slotIndex}`}
                              className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                                isMain
                                  ? "border-emerald-400 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-500"
                                  : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
                              }`}
                            >
                              <Plus
                                size={22}
                                className={
                                  isMain ? "text-emerald-500" : "text-gray-400"
                                }
                              />
                              <span
                                className={`text-xs mt-1 font-medium ${
                                  isMain ? "text-emerald-600" : "text-gray-500"
                                }`}
                              >
                                {isMain ? "Asosiy" : `Rasm ${slotIndex + 1}`}
                              </span>
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <p className="text-gray-500 flex items-center gap-1.5">
                      <Star size={12} className="text-emerald-500" />
                      Birinchi rasm — asosiy rasm
                    </p>
                    <span
                      className={`font-semibold px-2.5 py-1 rounded-full ${
                        totalPhotos === 0
                          ? "bg-rose-100 text-rose-600"
                          : totalPhotos < 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {totalPhotos}/5 ta rasm
                    </span>
                  </div>
                </div>
              )}

              {/* STEP: main */}
              {step === "main" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Package size={18} className="text-emerald-600" />
                      Asosiy ma'lumotlar
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Nomi, kategoriya, narx va ombordagi miqdori
                    </p>
                  </div>

                  <Field label="Mahsulot nomi" required>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masalan: Omega-3 1000mg"
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent"
                    />
                  </Field>

                  <Field label="Kategoriya" required>
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent"
                    >
                      <option value="" disabled>
                        Tanlang...
                      </option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Avval kategoriya yarating
                      </p>
                    )}
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Narxi" icon={<DollarSign size={14} />}>
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min="0"
                          value={price}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          className="block w-full rounded-xl border border-gray-200 bg-gray-50 pl-4 pr-12 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                          so'm
                        </span>
                      </div>
                    </Field>
                    <Field label="Omborda" icon={<Archive size={14} />}>
                      <div className="relative">
                        <input
                          required
                          type="number"
                          min="0"
                          value={amount}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          className="block w-full rounded-xl border border-gray-200 bg-gray-50 pl-4 pr-12 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
                          dona
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>
              )}

              {/* STEP: details */}
              {step === "details" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <FileText size={18} className="text-emerald-600" />
                      Tafsilotlar va tarjimalar
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Tarkibi, ishlatilishi va tavsif — 3 tilda
                    </p>
                  </div>

                  {/* Language tabs */}
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    {(Object.keys(LANG_META) as DetailsLang[]).map((lang) => {
                      const meta = LANG_META[lang];
                      const isRequired = lang === "UZ";
                      const values =
                        lang === "UZ"
                          ? [name, ingredients, uses, description]
                          : lang === "RU"
                          ? [nameRu, ingredientsRu, usesRu, descriptionRu]
                          : [nameEn, ingredientsEn, usesEn, descriptionEn];
                      const filled = values.filter((v) => v?.trim()).length;
                      return (
                        <button
                          type="button"
                          key={lang}
                          onClick={() => setDetailsLang(lang)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                            detailsLang === lang
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <span>{meta.flag}</span>
                          <span className="hidden sm:inline">{meta.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                              filled > 0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {filled}/4
                          </span>
                          {isRequired && (
                            <span className="text-[10px] text-rose-500">*</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Language fields */}
                  {detailsLang === "UZ" && (
                    <LangFields
                      lang="UZ"
                      name={name}
                      setName={setName}
                      ingredients={ingredients}
                      setIngredients={setIngredients}
                      uses={uses}
                      setUses={setUses}
                      description={description}
                      setDescription={setDescription}
                    />
                  )}
                  {detailsLang === "RU" && (
                    <LangFields
                      lang="RU"
                      name={nameRu}
                      setName={setNameRu}
                      ingredients={ingredientsRu}
                      setIngredients={setIngredientsRu}
                      uses={usesRu}
                      setUses={setUsesRu}
                      description={descriptionRu}
                      setDescription={setDescriptionRu}
                    />
                  )}
                  {detailsLang === "EN" && (
                    <LangFields
                      lang="EN"
                      name={nameEn}
                      setName={setNameEn}
                      ingredients={ingredientsEn}
                      setIngredients={setIngredientsEn}
                      uses={usesEn}
                      setUses={setUsesEn}
                      description={descriptionEn}
                      setDescription={setDescriptionEn}
                    />
                  )}

                  {detailsLang !== "UZ" && (
                    <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <Globe2 size={14} />
                      Tarjimalar ixtiyoriy — bo'sh qoldirilsa o'zbekcha matn
                      ko'rsatiladi
                    </p>
                  )}
                </div>
              )}

              {/* Footer with navigation */}
              <div className="sticky bottom-0 left-0 right-0 -mx-6 px-6 py-4 mt-6 bg-white border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={step === "photos" ? closeForm : prevStep}
                  className="px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition inline-flex items-center gap-1.5"
                >
                  {step === "photos" ? (
                    "Bekor qilish"
                  ) : (
                    <>
                      <ChevronLeft size={18} />
                      Oldingi
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {step !== "details" ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
                    >
                      Keyingi
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving || !name.trim() || !category}
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
                          {editingId ? "O'zgarishlarni saqlash" : "Qo'shish"}
                        </>
                      )}
                    </button>
                  )}
                </div>
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
                Mahsulotni o'chirmoqchimisiz?
              </h3>
              <p className="text-sm text-gray-500">
                Bu amalni qaytarib bo'lmaydi. Mahsulot va uning rasmlari
                to'liq o'chiriladi.
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

function getStepStatus(
  step: FormStep,
  {
    totalPhotos,
    name,
    category,
    price,
  }: { totalPhotos: number; name: string; category: string; price: number }
) {
  if (step === "photos") return totalPhotos > 0;
  if (step === "main") return !!name.trim() && !!category && price > 0;
  return false;
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

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function LangFields({
  lang,
  name,
  setName,
  ingredients,
  setIngredients,
  uses,
  setUses,
  description,
  setDescription,
}: {
  lang: DetailsLang;
  name: string;
  setName: (v: string) => void;
  ingredients: string;
  setIngredients: (v: string) => void;
  uses: string;
  setUses: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}) {
  const placeholders = {
    UZ: {
      name: "Omega-3 1000mg",
      ingredients: "Tarkibi: Rybiy jir, vitamin E...",
      uses: "Kuniga 1 marta, ovqatdan keyin...",
      description: "Qisqacha tavsif va afzalliklar...",
    },
    RU: {
      name: "Омега-3 1000мг",
      ingredients: "Состав: Рыбий жир, витамин E...",
      uses: "По 1 капсуле в день после еды...",
      description: "Краткое описание и преимущества...",
    },
    EN: {
      name: "Omega-3 1000mg",
      ingredients: "Ingredients: Fish oil, vitamin E...",
      uses: "Take 1 capsule daily after meals...",
      description: "Brief description and benefits...",
    },
  }[lang];

  const nameLabel = {
    UZ: "Nomi (o'zbekcha)",
    RU: "Nomi (ruscha)",
    EN: "Nomi (inglizcha)",
  }[lang];

  return (
    <div className="space-y-3">
      <Field label={nameLabel} required={lang === "UZ"}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholders.name}
          className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent"
        />
      </Field>

      <Field label="Tarkibi">
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder={placeholders.ingredients}
          rows={2}
          className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent resize-none"
        />
      </Field>

      <Field label="Ishlatilishi">
        <textarea
          value={uses}
          onChange={(e) => setUses(e.target.value)}
          placeholder={placeholders.uses}
          rows={2}
          className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent resize-none"
        />
      </Field>

      <Field label="Qo'shimcha tavsif">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={placeholders.description}
          rows={3}
          className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent resize-none"
        />
      </Field>
    </div>
  );
}

function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const stockStatus =
    product.amount === 0
      ? { label: "Tugagan", color: "bg-rose-100 text-rose-700" }
      : product.amount < 10
      ? { label: "Kam qolgan", color: "bg-amber-100 text-amber-700" }
      : { label: "Mavjud", color: "bg-emerald-100 text-emerald-700" };

  const hasRu = product.translations?.some((t) => t.lang === "RU");
  const hasEn = product.translations?.some((t) => t.lang === "EN");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {product.photos && product.photos.length > 0 ? (
          <img
            src={`${API_BASE_URL}${product.photos[0]}`}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package size={32} />
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5">
          {product.photos && product.photos.length > 1 && (
            <span className="bg-white/95 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <ImageIcon size={10} />
              {product.photos.length}
            </span>
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shadow-sm ${
              product.isActive
                ? "bg-emerald-500 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            {product.isActive ? "Faol" : "Nofaol"}
          </span>
        </div>

        <div className="absolute top-2 right-2 flex gap-1">
          {hasRu && (
            <span className="bg-white/95 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded shadow-sm">
              🇷🇺
            </span>
          )}
          {hasEn && (
            <span className="bg-white/95 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded shadow-sm">
              🇬🇧
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1.5">
          {product.category}
        </div>
        <h4
          className="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem] mb-2"
          title={product.name}
        >
          {product.name}
        </h4>

        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-lg font-extrabold text-gray-900 leading-none">
              {product.price.toLocaleString()}
              <span className="text-xs font-semibold text-gray-500 ml-1">
                so'm
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Omborda: <span className="font-semibold">{product.amount} dona</span>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${stockStatus.color}`}
          >
            {stockStatus.label}
          </span>
        </div>

        <div className="flex items-center gap-1 pt-3 border-t border-gray-100">
          <button
            onClick={onToggle}
            title={product.isActive ? "Nofaol qilish" : "Faol qilish"}
            className={`flex-1 p-2 rounded-lg transition text-sm font-medium inline-flex items-center justify-center gap-1.5 ${
              product.isActive
                ? "text-emerald-700 hover:bg-emerald-50"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Power size={15} />
            <span className="hidden sm:inline">
              {product.isActive ? "Faol" : "Nofaol"}
            </span>
          </button>
          <button
            onClick={onEdit}
            title="Tahrirlash"
            className="flex-1 p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition text-sm font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Pencil size={15} />
            <span className="hidden sm:inline">Tahrir</span>
          </button>
          <button
            onClick={onDelete}
            title="O'chirish"
            className="flex-1 p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition text-sm font-medium inline-flex items-center justify-center gap-1.5"
          >
            <Trash2 size={15} />
            <span className="hidden sm:inline">O'chirish</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const stockColor =
    product.amount === 0
      ? "text-rose-600"
      : product.amount < 10
      ? "text-amber-600"
      : "text-emerald-600";

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 transition group">
      <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
        {product.photos && product.photos.length > 0 ? (
          <img
            src={`${API_BASE_URL}${product.photos[0]}`}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package size={20} />
          </div>
        )}
        {product.photos && product.photos.length > 1 && (
          <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
            {product.photos.length}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-semibold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            {product.category}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
              product.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                product.isActive ? "bg-emerald-500" : "bg-gray-400"
              }`}
            ></span>
            {product.isActive ? "Faol" : "Nofaol"}
          </span>
        </div>
        <div className="text-sm font-bold text-gray-900 truncate">
          {product.name}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          <span className="font-semibold text-gray-900">
            {product.price.toLocaleString()} so'm
          </span>
          <span className="mx-2">•</span>
          <span className={stockColor}>
            Omborda {product.amount} dona
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggle}
          title={product.isActive ? "Nofaol qilish" : "Faol qilish"}
          className={`p-2 rounded-lg transition ${
            product.isActive
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
