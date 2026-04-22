"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingCart,
  Info,
  List,
  CheckCircle2,
  Star,
  Send,
  User as UserIcon,
  MessageSquare,
  Loader2,
  Heart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ProductScore {
  id: number;
  productId: string;
  number: string;
  fullName: string;
  comment: string | null;
  grade: number;
  createdAt: string;
}

interface Product {
  id: number;
  productId: string;
  name: string;
  ingredients: string;
  uses: string;
  description: string;
  photos: string[];
  price: number;
  categoryId: number;
  active: boolean;
}

type InfoTab = "description" | "ingredients" | "uses";

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] || "?").slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function ProductDetailsPage() {
  const { productName } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ProductScore[]>([]);
  const [rating, setRating] = useState({ average: 0, count: 0 });
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const [reviewGrade, setReviewGrade] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [infoTab, setInfoTab] = useState<InfoTab>("description");
  const [addedToCart, setAddedToCart] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Cart state
  const [cartItemId, setCartItemId] = useState<number | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartUpdating, setCartUpdating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
  }, []);

  const fetchCartStatus = async (productId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = res.data?.items || [];
      const item = items.find(
        (i: { productId: string; id: number; productCount: number }) =>
          i.productId === productId,
      );
      if (item) {
        setCartItemId(item.id);
        setCartCount(item.productCount);
      } else {
        setCartItemId(null);
        setCartCount(0);
      }
    } catch (err) {
      console.error("Cart status error", err);
    }
  };

  const checkSavedStatus = async (productId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/saved/check/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSaved(res.data.saved);
    } catch (err) {
      console.error("Check saved error", err);
    }
  };

  const toggleSave = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Iltimos, avval tizimga kiring!");
      router.push("/login");
      return;
    }
    if (!product) return;

    setSavingState(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/saved/toggle/${product.productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsSaved(res.data.saved);
    } catch (err) {
      console.error("Toggle save error", err);
    } finally {
      setSavingState(false);
    }
  };

  const fetchProductAndReviews = async () => {
    try {
      const decodedName = decodeURIComponent(productName as string);
      const res = await axios.get(`${API_BASE_URL}/admin/product`);
      const found = res.data.find(
        (p: Product) => p.name === decodedName && p.active !== false,
      );

      if (found) {
        setProduct(found);
        const [reviewsRes, ratingRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/score/product/${found.productId}`),
          axios.get(`${API_BASE_URL}/score/rating/${found.productId}`),
        ]);
        setReviews(reviewsRes.data);
        setRating(ratingRes.data);
        checkSavedStatus(found.productId);
        fetchCartStatus(found.productId);
      } else {
        setProduct(null);
      }
    } catch (err) {
      console.error("Error fetching product", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productName) fetchProductAndReviews();
  }, [productName]);

  const addToCart = async (productId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Iltimos, avval tizimga kiring!");
      router.push("/login");
      return;
    }
    setCartUpdating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cart/add`,
        { productId, productCount: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      // Yangi item id va countni olish
      const items = res.data?.items || [];
      const item = items.find(
        (i: { productId: string; id: number; productCount: number }) =>
          i.productId === productId,
      );
      if (item) {
        setCartItemId(item.id);
        setCartCount(item.productCount);
      }
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 1200);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        alert("Sessiya vaqti tugagan. Iltimos qayta tizimga kiring.");
        router.push("/login");
      } else {
        alert("Xatolik yuz berdi.");
      }
    } finally {
      setCartUpdating(false);
    }
  };

  const updateCartItem = async (action: "increment" | "decrement") => {
    if (!cartItemId) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setCartUpdating(true);
    try {
      if (action === "decrement" && cartCount <= 1) {
        // Remove from cart
        await axios.delete(`${API_BASE_URL}/cart/item/${cartItemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItemId(null);
        setCartCount(0);
      } else {
        const res = await axios.patch(
          `${API_BASE_URL}/cart/item/${cartItemId}`,
          { action },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const items = res.data?.items || [];
        const item = items.find(
          (i: { id: number; productCount: number }) => i.id === cartItemId,
        );
        if (item) {
          setCartCount(item.productCount);
        }
      }
    } catch (err) {
      console.error("Cart update error", err);
    } finally {
      setCartUpdating(false);
    }
  };

  const submitReview = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("Izoh qoldirish uchun tizimga kiring!");
      router.push("/login");
      return;
    }
    if (!product) return;
    if (!reviewComment.trim() && reviewGrade === 0) return;

    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/score`,
        {
          productId: product.productId,
          comment: reviewComment.trim() || null,
          grade: reviewGrade,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchProductAndReviews();
      setReviewComment("");
      setReviewGrade(5);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        alert("Sessiya vaqti tugagan. Iltimos qayta tizimga kiring.");
        router.push("/login");
      } else {
        alert("Izoh yuborishda xatolik.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const ratingBreakdown = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    for (const r of reviews) {
      if (r.grade >= 1 && r.grade <= 5) buckets[r.grade - 1]++;
    }
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: buckets[star - 1],
      percent: Math.round((buckets[star - 1] / total) * 100),
    }));
  }, [reviews]);

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  const StarRating = ({
    value,
    size = 16,
    interactive = false,
  }: {
    value: number;
    size?: number;
    interactive?: boolean;
  }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setReviewGrade(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={
            interactive
              ? "cursor-pointer hover:scale-110 transition-transform"
              : "cursor-default"
          }
          aria-label={`${star} yulduz`}
        >
          <Star
            size={size}
            className={`${
              star <= (interactive ? hoverRating || reviewGrade : value)
                ? "text-amber-400 fill-amber-400"
                : "text-gray-300"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Mahsulot topilmadi
        </h2>
        <button
          onClick={() => router.push("/")}
          className="text-green-600 font-medium hover:underline flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={16} /> Bosh sahifaga qaytish
        </button>
      </div>
    );
  }

  const photoUrl = (p: string) =>
    `${API_BASE_URL}${p.startsWith("/") ? "" : "/"}${p}`;

  const nextPhoto = () => {
    if (product.photos.length > 1) {
      setSelectedPhotoIndex((i) => (i + 1) % product.photos.length);
    }
  };
  const prevPhoto = () => {
    if (product.photos.length > 1) {
      setSelectedPhotoIndex(
        (i) => (i - 1 + product.photos.length) % product.photos.length,
      );
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-28 sm:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700 mb-6 bg-white px-3.5 py-2 rounded-xl shadow-sm border border-gray-100 transition-colors"
        >
          <ArrowLeft size={16} /> Orqaga
        </button>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Gallery */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
              {product.photos && product.photos.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl(product.photos[selectedPhotoIndex])}
                    alt={product.name}
                    className="w-full h-full object-contain p-6 sm:p-10 transition-transform duration-500"
                  />
                  {product.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-gray-700 shadow-md hover:bg-white flex items-center justify-center"
                        aria-label="Oldingi rasm"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur text-gray-700 shadow-md hover:bg-white flex items-center justify-center"
                        aria-label="Keyingi rasm"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full tabular-nums">
                        {selectedPhotoIndex + 1} / {product.photos.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-gray-400 font-medium flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    ?
                  </div>
                  Rasm mavjud emas
                </div>
              )}
            </div>

            {product.photos && product.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3 border-t border-gray-100">
                {product.photos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedPhotoIndex === index
                        ? "border-green-500 shadow ring-2 ring-green-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label={`Rasm ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl(photo)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-7 lg:p-8 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
                <div className="mt-3 flex items-center gap-2.5 flex-wrap">
                  <StarRating value={rating.average} size={18} />
                  <span className="text-sm font-semibold text-gray-900 tabular-nums">
                    {rating.average.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({rating.count} ta izoh)
                  </span>
                </div>
              </div>
              <button
                onClick={toggleSave}
                disabled={savingState}
                className={`shrink-0 w-11 h-11 rounded-2xl border transition-all ${
                  isSaved
                    ? "bg-rose-50 border-rose-200 text-rose-500"
                    : "bg-gray-50 border-gray-200 text-gray-400 hover:border-rose-200 hover:text-rose-400"
                }`}
                aria-label={isSaved ? "Olib tashlash" : "Saqlash"}
              >
                {savingState ? (
                  <Loader2 size={18} className="animate-spin mx-auto" />
                ) : (
                  <Heart
                    size={20}
                    className={`mx-auto ${isSaved ? "fill-rose-500" : ""}`}
                  />
                )}
              </button>
            </div>

            <div className="mt-5 flex items-end gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-green-700 tabular-nums">
                {product.price?.toLocaleString("uz-UZ")}
              </span>
              <span className="text-sm font-medium text-gray-500 mb-1">so&apos;m</span>
            </div>

            {/* Info tabs */}
            <div className="mt-6 border-b border-gray-100 flex gap-0.5 overflow-x-auto">
              {([
                { id: "description", label: "Tavsifi", Icon: List },
                { id: "ingredients", label: "Tarkibi", Icon: Info },
                { id: "uses", label: "Qo'llanma", Icon: CheckCircle2 },
              ] as const).map(({ id, label, Icon }) => {
                const active = infoTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setInfoTab(id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      active
                        ? "border-green-500 text-green-700"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 mt-4 min-h-[100px]">
              {infoTab === "description" &&
                (product.description ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px]">
                    {product.description}
                  </p>
                ) : (
                  <p className="text-gray-400 italic text-sm">Tavsif kiritilmagan</p>
                ))}
              {infoTab === "ingredients" &&
                (product.ingredients ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px]">
                    {product.ingredients}
                  </p>
                ) : (
                  <p className="text-gray-400 italic text-sm">Tarkib kiritilmagan</p>
                ))}
              {infoTab === "uses" &&
                (product.uses ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm sm:text-[15px]">
                    {product.uses}
                  </p>
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    Qo&apos;llanma kiritilmagan
                  </p>
                ))}
            </div>

            {/* Desktop CTA */}
            <div className="mt-6 hidden sm:flex gap-3">
              {cartCount > 0 ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => updateCartItem("decrement")}
                      disabled={cartUpdating}
                      className="w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold text-xl"
                      aria-label="Kamaytirish"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-bold text-lg tabular-nums text-gray-900">
                      {cartUpdating ? (
                        <Loader2 size={18} className="animate-spin mx-auto" />
                      ) : (
                        cartCount
                      )}
                    </span>
                    <button
                      onClick={() => updateCartItem("increment")}
                      disabled={cartUpdating}
                      className="w-12 h-12 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold text-xl"
                      aria-label="Oshirish"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} />
                    Savatda {cartCount} dona
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product.productId)}
                  disabled={cartUpdating}
                  className={`flex-1 text-white font-semibold py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 ${
                    addedToCart
                      ? "bg-emerald-600"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:-translate-y-0.5"
                  }`}
                >
                  {addedToCart ? (
                    <>
                      <CheckCircle2 size={20} />
                      Savatga qo&apos;shildi
                    </>
                  ) : cartUpdating ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart size={20} />
                      Savatga qo&apos;shish
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary + form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Umumiy baho
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-gray-900 tabular-nums">
                  {rating.average.toFixed(1)}
                </span>
                <span className="pb-1 text-gray-500 text-sm">/ 5</span>
              </div>
              <StarRating value={Math.round(rating.average)} size={18} />
              <p className="mt-1 text-sm text-gray-500">
                {rating.count} ta foydalanuvchi baho bergan
              </p>

              <div className="mt-4 space-y-1.5">
                {ratingBreakdown.map((b) => (
                  <div key={b.star} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-gray-600 tabular-nums">{b.star}★</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-amber-400"
                        style={{ width: `${b.percent}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-gray-500 tabular-nums">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="text-green-500" size={18} />
                Izoh qoldirish
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Istalgancha izoh yozishingiz mumkin
              </p>

              {isLoggedIn ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Bahoingiz
                    </label>
                    <div className="flex items-center gap-3">
                      <StarRating value={reviewGrade} size={24} interactive />
                      <span className="text-sm font-semibold text-gray-700 tabular-nums">
                        {reviewGrade}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Izoh (ixtiyoriy)
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Fikringizni yozing..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none resize-none transition-colors text-sm"
                    />
                    <p className="mt-1 text-[11px] text-gray-400 text-right tabular-nums">
                      {reviewComment.length}/500
                    </p>
                  </div>

                  <button
                    onClick={submitReview}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Yuborish
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-4 text-center py-6 bg-gray-50 rounded-2xl">
                  <UserIcon
                    size={36}
                    className="mx-auto text-gray-400 mb-2"
                  />
                  <p className="text-gray-600 text-sm mb-3">
                    Izoh qoldirish uchun tizimga kiring
                  </p>
                  <button
                    onClick={() => router.push("/login")}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-2 px-5 rounded-xl transition-colors"
                  >
                    Kirish
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reviews list */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Star className="text-amber-400 fill-amber-400" size={20} />
                Izohlar
                <span className="text-sm font-semibold text-gray-500">
                  ({reviews.length})
                </span>
              </h2>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-14 bg-gray-50 rounded-2xl mt-4">
                <MessageSquare
                  size={42}
                  className="mx-auto text-gray-300 mb-3"
                />
                <p className="text-gray-500 font-medium">
                  Hali izoh qoldirilmagan
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Birinchi bo&apos;lib izoh qoldiring!
                </p>
              </div>
            ) : (
              <>
                <ul className="mt-4 space-y-4">
                  {visibleReviews.map((review) => (
                    <li
                      key={review.id}
                      className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                        {getInitials(review.fullName || "?")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {review.fullName || "Foydalanuvchi"}
                          </p>
                          <span className="text-[11px] text-gray-400 tabular-nums">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          <StarRating value={review.grade} size={13} />
                        </div>
                        {review.comment && (
                          <p className="mt-1.5 text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {reviews.length > 5 && (
                  <button
                    onClick={() => setShowAllReviews((v) => !v)}
                    className="mt-4 w-full text-sm font-medium text-green-700 hover:text-green-800 py-2 rounded-xl hover:bg-green-50 transition-colors"
                  >
                    {showAllReviews
                      ? "Yopish"
                      : `Barchasini ko'rish (${reviews.length - 5} ta ko'proq)`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 inset-x-0 sm:hidden bg-white/95 backdrop-blur border-t border-gray-200 p-3 z-40">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500">Narxi</p>
            <p className="text-base font-extrabold text-green-700 tabular-nums leading-tight">
              {product.price?.toLocaleString("uz-UZ")} so&apos;m
            </p>
          </div>
          <button
            onClick={toggleSave}
            disabled={savingState}
            className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center ${
              isSaved
                ? "bg-rose-50 border-rose-200 text-rose-500"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
            aria-label="Saqlash"
          >
            {savingState ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Heart size={16} className={isSaved ? "fill-rose-500" : ""} />
            )}
          </button>

          {cartCount > 0 ? (
            <div className="flex items-center gap-1.5 flex-1">
              <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => updateCartItem("decrement")}
                  disabled={cartUpdating}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold text-lg"
                  aria-label="Kamaytirish"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-base tabular-nums text-gray-900">
                  {cartUpdating ? (
                    <Loader2 size={14} className="animate-spin mx-auto" />
                  ) : (
                    cartCount
                  )}
                </span>
                <button
                  onClick={() => updateCartItem("increment")}
                  disabled={cartUpdating}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 font-bold text-lg"
                  aria-label="Oshirish"
                >
                  +
                </button>
              </div>
              <div className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-sm">
                <CheckCircle2 size={16} />
                Savatda
              </div>
            </div>
          ) : (
            <button
              onClick={() => addToCart(product.productId)}
              disabled={cartUpdating}
              className={`flex-1 text-white font-semibold py-2.5 rounded-xl shadow flex items-center justify-center gap-2 text-sm disabled:opacity-70 ${
                addedToCart
                  ? "bg-emerald-600"
                  : "bg-gradient-to-r from-green-500 to-emerald-600"
              }`}
            >
              {addedToCart ? (
                <>
                  <CheckCircle2 size={16} />
                  Qo&apos;shildi
                </>
              ) : cartUpdating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <ShoppingCart size={16} />
                  Savatga
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
