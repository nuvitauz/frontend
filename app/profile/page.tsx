"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  UserCircle,
  MapPin,
  Calendar,
  Phone,
  Edit2,
  Save,
  X,
  MessageCircle,
  ExternalLink,
  Loader2,
  LogOut,
  Lock,
  KeyRound,
  ShoppingBag,
  Heart,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Mail,
  ChevronRight,
  Check,
  CalendarDays,
  User2,
} from "lucide-react";
import {
  getTelegramUser,
  getTelegramWebApp,
  isTelegramMiniApp,
} from "@/lib/telegram";

interface UserProfile {
  id: number;
  number: string | null;
  userId: string | null;
  username: string | null;
  fullName: string | null;
  email: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  lang: string;
  role?: "USER" | "ADMIN" | "COURIER";
  profileComplete: boolean;
  hasPassword?: boolean;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tgPhotoUrl, setTgPhotoUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [linkingTelegram, setLinkingTelegram] = useState(false);
  const [isTg, setIsTg] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const [showPwSetup, setShowPwSetup] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const authenticateWithTelegram = async (): Promise<string | null> => {
    try {
      const { getTelegramInitData } = await import("@/lib/telegram");
      const initData = getTelegramInitData();
      if (!initData) return null;
      const res = await axios.post(`${API_BASE_URL}/auth/telegram`, { initData });

      if (res.data?.needsOnboarding) {
        setNeedsOnboarding(true);
        return null;
      }

      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("tgUserData", JSON.stringify(user));
      if (user?.photoUrl) setTgPhotoUrl(user.photoUrl);
      return accessToken;
    } catch (e) {
      console.error("TG auto-auth error:", e);
      return null;
    }
  };

  useEffect(() => {
    let inTg = false;
    let cancelled = false;

    const init = async () => {
      if (typeof window === "undefined") return;
      inTg = isTelegramMiniApp();
      setIsTg(inTg);

      if (inTg) {
        const webApp = getTelegramWebApp();
        if (webApp?.BackButton) {
          webApp.BackButton.show();
          webApp.BackButton.onClick(() => router.push("/"));
        }
        const tgUser = getTelegramUser();
        if (tgUser?.photo_url) setTgPhotoUrl(tgUser.photo_url);

        const savedTgData = localStorage.getItem("tgUserData");
        if (savedTgData) {
          try {
            const tgUserData = JSON.parse(savedTgData);
            if (tgUserData.photoUrl) setTgPhotoUrl(tgUserData.photoUrl);
          } catch (e) {
            console.error("Error parsing TG user data", e);
          }
        }
      }

      let t = localStorage.getItem("accessToken");
      if (!t && inTg) t = await authenticateWithTelegram();

      if (cancelled) return;

      if (!t) {
        if (!inTg) router.push("/login");
        else setLoading(false);
        return;
      }
      setToken(t);
      fetchData(t);
    };

    init();

    return () => {
      cancelled = true;
      if (inTg && typeof window !== "undefined") {
        const webApp = getTelegramWebApp();
        webApp?.BackButton?.hide();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchData = async (t: string) => {
    try {
      setLoading(true);
      const [profileRes, ordersRes, savedRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/user/me`, {
          headers: { Authorization: `Bearer ${t}` },
        }),
        axios.get(`${API_BASE_URL}/order/me`, {
          headers: { Authorization: `Bearer ${t}` },
        }),
        axios.get(`${API_BASE_URL}/saved/count`, {
          headers: { Authorization: `Bearer ${t}` },
        }),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data);
        setFormData(profileRes.value.data);
      } else {
        const err: any = profileRes.reason;
        if (err?.response?.status === 401) {
          localStorage.removeItem("accessToken");
          router.push("/login");
          return;
        }
      }
      if (ordersRes.status === "fulfilled") {
        setOrdersCount(
          Array.isArray(ordersRes.value.data) ? ordersRes.value.data.length : 0,
        );
      }
      if (savedRes.status === "fulfilled") {
        setSavedCount(Number(savedRes.value.data?.count ?? 0));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaveError("");
    setSaveOk(false);
    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      };
      const res = await axios.patch(`${API_BASE_URL}/user/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      setFormData(res.data);
      setIsEditing(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2000);
    } catch (error: any) {
      console.error(error);
      setSaveError(error.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (newPassword.length < 6) {
      setPwError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Parollar mos kelmadi");
      return;
    }
    setPwLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/auth/set-password`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setPwSuccess(true);
      setProfile((prev) => (prev ? { ...prev, hasPassword: true } : prev));
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPwSetup(false);
        setPwSuccess(false);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setPwError(
        err.response?.data?.message ||
          "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
      );
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  const handleConnectTelegram = async () => {
    if (!token) return;
    setLinkingTelegram(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/user/telegram-link`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.linked) {
        fetchData(token);
      } else if (res.data.link) {
        window.open(res.data.link, "_blank");
      }
    } catch (error) {
      console.error("Telegram link error:", error);
    } finally {
      setLinkingTelegram(false);
    }
  };

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return null;
    const d = new Date(profile.createdAt);
    return d.toLocaleDateString("uz-UZ", { month: "long", year: "numeric" });
  }, [profile?.createdAt]);

  const initials = useMemo(() => {
    const name = profile?.fullName?.trim() || "";
    if (!name) return null;
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join("");
  }, [profile?.fullName]);

  const roleLabel = useMemo(() => {
    if (!profile?.role || profile.role === "USER") return null;
    return profile.role === "ADMIN" ? "Administrator" : "Kuryer";
  }, [profile?.role]);

  // ---------- Render states ----------

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/60 via-white to-white flex flex-col items-center justify-center gap-3">
        <div className="w-11 h-11 rounded-full border-[3px] border-emerald-200 border-t-emerald-500 animate-spin" />
        <p className="text-sm text-gray-500">Yuklanmoqda…</p>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center px-5 py-10">
        <div className="max-w-sm w-full bg-white border border-emerald-100 rounded-3xl shadow-[0_20px_60px_-20px_rgba(16,185,129,0.25)] p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="mt-6 text-xl font-bold text-gray-900 tracking-tight">
            Ro&apos;yxatdan o&apos;ting
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Akkauntingiz hali yaratilmagan. Botga <code className="px-1 py-0.5 bg-gray-100 rounded text-emerald-600 font-mono text-xs">/start</code> yuborib,
            telefon raqamingizni ulashing.
          </p>
          <button
            onClick={() => getTelegramWebApp()?.close()}
            className="mt-6 w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-semibold shadow-md shadow-emerald-200 transition-all"
          >
            Botga o&apos;tish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-emerald-50/50 via-white to-white pb-24">
      {/* ────── HERO / AVATAR ────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-500" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #fff 0, transparent 40%), radial-gradient(circle at 80% 70%, #fff 0, transparent 40%)",
          }}
        />
        <div className="relative max-w-2xl mx-auto px-5 sm:px-6 pt-8 pb-24 sm:pt-12 sm:pb-28">
          <div className="flex items-start justify-between">
            <div className="text-white/90">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase opacity-80">
                <Sparkles size={12} />
                Nuvita akkaunt
              </div>
              <h1 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight">
                Profil
              </h1>
            </div>

            {!isTg && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs font-semibold transition-colors border border-white/20"
                title="Chiqish"
              >
                <LogOut size={14} />
                Chiqish
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-24 space-y-5">
        {/* ────── PROFILE CARD ────── */}
        <div className="relative bg-white border border-gray-100 rounded-3xl shadow-[0_20px_60px_-25px_rgba(16,185,129,0.25)] p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1.5 shadow-xl shadow-emerald-100 ring-4 ring-emerald-50">
                {tgPhotoUrl ? (
                  <Image
                    src={tgPhotoUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    unoptimized
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-500 flex items-center justify-center text-white text-4xl font-bold">
                    {initials ?? <UserCircle size={56} />}
                  </div>
                )}
              </div>
              {profile?.userId && (
                <div
                  className="absolute bottom-1 right-1 bg-[#229ED9] w-8 h-8 rounded-full border-[3px] border-white flex items-center justify-center shadow-md"
                  title="Telegram ulangan"
                >
                  <MessageCircle size={14} className="text-white fill-white/30" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                  {profile?.fullName || "Ism kiritilmagan"}
                </h2>
                {roleLabel && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                    <ShieldCheck size={10} />
                    {roleLabel}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 text-gray-500 text-sm">
                <Phone size={14} className="shrink-0" />
                <span className="truncate">
                  {profile?.number || "Raqam ulanmagan"}
                </span>
              </div>
              {profile?.username && (
                <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-[#229ED9] text-xs font-medium">
                  <MessageCircle size={12} />@{profile.username}
                </div>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <Link
              href="/orders"
              className="group flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-50/40 border border-emerald-100/60 hover:border-emerald-200 transition-all"
            >
              <ShoppingBag size={18} className="text-emerald-600" />
              <div className="mt-1.5 text-lg font-bold text-gray-900 leading-none">
                {ordersCount ?? "—"}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs text-gray-500 font-medium">
                Buyurtmalar
              </div>
            </Link>
            <Link
              href="/selected"
              className="group flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-50/40 border border-pink-100/60 hover:border-pink-200 transition-all"
            >
              <Heart size={18} className="text-pink-500" />
              <div className="mt-1.5 text-lg font-bold text-gray-900 leading-none">
                {savedCount ?? "—"}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs text-gray-500 font-medium">
                Saqlangan
              </div>
            </Link>
            <div className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-50/40 border border-sky-100/60">
              <CalendarDays size={18} className="text-sky-600" />
              <div className="mt-1.5 text-sm font-bold text-gray-900 leading-none text-center">
                {memberSince || "Yaqinda"}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs text-gray-500 font-medium">
                A&apos;zo bo&apos;ldi
              </div>
            </div>
          </div>
        </div>

        {/* ────── SECURITY / CONNECTIONS ────── */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 sm:px-6 pt-5 pb-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <h3 className="text-[15px] font-bold text-gray-900">
              Xavfsizlik va ulanishlar
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {/* Telegram row — hidden inside Mini App */}
            {!isTelegramMiniApp() && (
              <div className="px-5 sm:px-6 py-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#229ED9]/10 flex items-center justify-center text-[#229ED9] shrink-0">
                  <MessageCircle size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    Telegram
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {profile?.userId
                      ? profile.username
                        ? `@${profile.username} — ulangan`
                        : "Ulangan"
                      : "Botdan xabarlarni tezroq oling"}
                  </p>
                </div>
                {profile?.userId ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <Check size={12} /> Ulangan
                  </span>
                ) : (
                  <button
                    onClick={handleConnectTelegram}
                    disabled={linkingTelegram}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#229ED9] hover:bg-[#229ED9]/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {linkingTelegram ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ExternalLink size={12} />
                    )}
                    Ulash
                  </button>
                )}
              </div>
            )}

            {/* Password row */}
            {profile?.number && (
              <div className="px-5 sm:px-6 py-4">
                {!showPwSetup ? (
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        profile.hasPassword
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      <KeyRound size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        Sayt paroli
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {profile.hasPassword
                          ? "Brauzer orqali kirish faol"
                          : "Brauzer orqali kirish uchun o'rnating"}
                      </p>
                    </div>
                    {profile.hasPassword ? (
                      <button
                        onClick={() => {
                          setShowPwSetup(true);
                          setPwError("");
                          setPwSuccess(false);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Edit2 size={12} />
                        Yangilash
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPwSetup(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                      >
                        <Lock size={12} />
                        O&apos;rnatish
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSetPassword} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound size={16} className="text-amber-500" />
                        <p className="font-semibold text-gray-900 text-sm">
                          {profile.hasPassword
                            ? "Parolni yangilash"
                            : "Parol o'rnatish"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPwSetup(false);
                          setPwError("");
                          setPwSuccess(false);
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        className="text-gray-400 hover:text-gray-600 w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Yangi parol (kamida 6 ta belgi)"
                        className="w-full bg-gray-50 border border-transparent focus:border-amber-300 focus:ring-2 focus:ring-amber-400/20 focus:bg-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        required
                        minLength={6}
                        autoFocus
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Parolni tasdiqlang"
                        className="w-full bg-gray-50 border border-transparent focus:border-amber-300 focus:ring-2 focus:ring-amber-400/20 focus:bg-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
                        required
                      />
                    </div>
                    {pwError && (
                      <p className="text-xs text-red-600 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> {pwError}
                      </p>
                    )}
                    {pwSuccess && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-semibold">
                        <Check size={12} /> Parol saqlandi
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-amber-200 transition-all disabled:opacity-60"
                    >
                      {pwLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saqlanmoqda…
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Parolni saqlash
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ────── PERSONAL DETAILS ────── */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50/60 to-transparent border-b border-gray-50">
            <div className="flex items-center gap-2">
              <User2 size={18} className="text-emerald-600" />
              <h3 className="text-[15px] font-bold text-gray-900">
                Shaxsiy ma&apos;lumotlar
              </h3>
            </div>
            {!isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setSaveError("");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Edit2 size={12} />
                Tahrirlash
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(profile || {});
                    setSaveError("");
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Bekor qilish"
                >
                  <X size={15} />
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  Saqlash
                </button>
              </div>
            )}
          </div>

          <div className="p-5 sm:p-6">
            {saveOk && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <Check size={14} /> Muvaffaqiyatli saqlandi
              </div>
            )}
            {saveError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600 font-medium flex items-center gap-1.5">
                <AlertTriangle size={14} /> {saveError}
              </div>
            )}

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Ism familiya"
                  icon={<UserCircle size={14} />}
                  className="sm:col-span-2"
                >
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Masalan: Aliyev Vali"
                    className="fld-input"
                  />
                </Field>
                <Field label="Email" icon={<Mail size={14} />}>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@example.com"
                    className="fld-input"
                  />
                </Field>
                <Field label="Tug'ilgan sana" icon={<Calendar size={14} />}>
                  <input
                    type="date"
                    value={
                      formData.dateOfBirth
                        ? formData.dateOfBirth.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dateOfBirth: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                    className="fld-input"
                  />
                </Field>
                <Field
                  label="Manzil"
                  icon={<MapPin size={14} />}
                  className="sm:col-span-2"
                >
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Shahar, tuman, mahalla…"
                    className="fld-input"
                  />
                </Field>
                <Field label="Jinsi" icon={<UserCircle size={14} />}>
                  <select
                    value={formData.gender || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="fld-input appearance-none"
                  >
                    <option value="">Tanlang</option>
                    <option value="MALE">Erkak</option>
                    <option value="FEMALE">Ayol</option>
                  </select>
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={<UserCircle size={16} />}
                  label="To'liq ism"
                  value={profile?.fullName}
                />
                <InfoRow
                  icon={<Mail size={16} />}
                  label="Email"
                  value={profile?.email}
                />
                <InfoRow
                  icon={<Calendar size={16} />}
                  label="Tug'ilgan sana"
                  value={
                    profile?.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString(
                          "uz-UZ",
                        )
                      : null
                  }
                />
                <InfoRow
                  icon={<UserCircle size={16} />}
                  label="Jinsi"
                  value={
                    profile?.gender === "MALE"
                      ? "Erkak"
                      : profile?.gender === "FEMALE"
                        ? "Ayol"
                        : null
                  }
                />
                <InfoRow
                  icon={<MapPin size={16} />}
                  label="Manzil"
                  value={profile?.address}
                  className="sm:col-span-2"
                />
              </div>
            )}
          </div>
        </div>

        {/* ────── QUICK NAV ────── */}
        <div className="grid grid-cols-2 gap-3">
          <NavCard
            href="/orders"
            icon={<ShoppingBag size={18} />}
            iconBg="bg-emerald-100 text-emerald-600"
            title="Buyurtmalarim"
            subtitle="Tarix va holat"
          />
          <NavCard
            href="/selected"
            icon={<Heart size={18} />}
            iconBg="bg-pink-100 text-pink-500"
            title="Saqlanganlar"
            subtitle="Sevimli mahsulotlar"
          />
        </div>

        {/* Inline logout (non-TG only; hero already has one, but keep for
            scroll reachability on mobile) */}
        {!isTg && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-red-500 text-sm font-semibold bg-red-50 hover:bg-red-100 rounded-2xl transition-colors border border-red-100"
            >
              <LogOut size={15} />
              Akkauntdan chiqish
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.fld-input) {
          width: 100%;
          background: #f9fafb;
          border: 1px solid transparent;
          border-radius: 0.85rem;
          padding: 0.75rem 0.95rem;
          font-size: 0.92rem;
          color: #111827;
          outline: none;
          transition: all 0.15s ease;
        }
        :global(.fld-input:focus) {
          background: #ffffff;
          border-color: rgb(16 185 129 / 0.5);
          box-shadow: 0 0 0 3px rgb(16 185 129 / 0.12);
        }
        :global(.fld-input::placeholder) {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

/* ────────── Small presentational helpers ────────── */

function Field({
  label,
  icon,
  children,
  className = "",
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider ml-0.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`p-3 border border-gray-50 bg-gray-50/40 rounded-2xl flex items-center gap-3 ${className}`}
    >
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="mt-0.5 font-medium text-gray-900 text-sm truncate">
          {value || "Kiritilmagan"}
        </p>
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon,
  iconBg,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50 transition-all"
    >
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{title}</p>
        <p className="text-[11px] text-gray-500 truncate mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight
        size={16}
        className="text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all"
      />
    </Link>
  );
}
