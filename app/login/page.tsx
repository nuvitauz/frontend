"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Step = "phone" | "password" | "no-password";

function formatUzDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  const a = d.slice(0, 2);
  const b = d.slice(2, 5);
  const c = d.slice(5, 7);
  const e = d.slice(7, 9);
  const parts = [a, b, c, e].filter((p) => p.length > 0);
  return parts.join(" ");
}

export default function LoginPage() {
  const [digits, setDigits] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [linkedToTelegram, setLinkedToTelegram] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const cleanPhone = `+998${digits.replace(/\D/g, "").slice(0, 9)}`;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (digits.replace(/\D/g, "").length !== 9) {
      setError("9 raqamli telefon raqamini to'liq kiriting");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post<{
        exists: boolean;
        hasPassword: boolean;
        linkedToTelegram: boolean;
      }>(`${API_BASE_URL}/auth/check-phone`, { number: cleanPhone });

      if (!res.data.exists) {
        router.push(`/register?phone=${encodeURIComponent(cleanPhone)}`);
        return;
      }

      if (!res.data.hasPassword) {
        setLinkedToTelegram(!!res.data.linkedToTelegram);
        setStep("no-password");
        return;
      }

      setStep("password");
    } catch (err) {
      console.error(err);
      setError("Tizimda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordLink = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post<{ sent: boolean; reason?: string }>(
        `${API_BASE_URL}/auth/request-password-link`,
        { number: cleanPhone },
      );
      if (res.data.sent) {
        setLinkSent(true);
      } else if (res.data.reason === "NO_TELEGRAM_LINKED") {
        setError(
          "Sizda Telegram hisob ulanmagan. Iltimos @nuvitauzbot ga kirib /start bosing.",
        );
      } else if (res.data.reason === "ALREADY_HAS_PASSWORD") {
        setError("Sizda parol allaqachon mavjud. Uni kiritib kiring.");
        setStep("password");
      } else {
        setError("Xatolik: havola yuborilmadi. Keyinroq urinib ko'ring.");
      }
    } catch (err) {
      console.error(err);
      setError("Tizimda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        number: cleanPhone,
        password,
      });

      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      window.location.href = "/";
    } catch (err: unknown) {
      const ax = err as {
        response?: { status?: number; data?: { code?: string } };
      };
      if (
        ax.response?.status === 409 &&
        ax.response?.data?.code === "PASSWORD_NOT_SET"
      ) {
        setLinkedToTelegram(true);
        setStep("no-password");
      } else if (ax.response?.status === 401) {
        setError("Parol noto'g'ri kiritildi.");
      } else {
        setError("Tizimda xatolik. Qaytadan urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onDigitsChange = (v: string) => {
    let d = v.replace(/\D/g, "");
    if (d.startsWith("998")) d = d.slice(3);
    setDigits(d.slice(0, 9));
  };

  const resetToPhone = () => {
    setStep("phone");
    setPassword("");
    setError("");
    setLinkSent(false);
  };

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-green-50 via-white to-white text-gray-900">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="compact" />
      </div>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-8 text-center text-2xl font-bold tracking-tight text-green-600 sm:text-[26px]"
        >
          Nuvita
        </Link>

        <div className="w-full max-w-[400px] rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100 sm:p-9">
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {t("auth.login")}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {t("auth.phone")}
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  {t("auth.phone")}
                </label>
                <div className="flex overflow-hidden rounded-xl border-2 border-gray-200 bg-white transition-[box-shadow] focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20">
                  <span className="shrink-0 select-none border-r border-gray-200 bg-green-50/90 px-3 py-3.5 text-sm font-medium text-gray-800">
                    UZ +998
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    value={formatUzDigits(digits)}
                    onChange={(e) => onDigitsChange(e.target.value)}
                    placeholder="XX XXX XX XX"
                    className="min-w-0 flex-1 bg-transparent py-3.5 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 sm:text-base"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition hover:from-green-600 hover:to-green-700 disabled:opacity-50"
              >
                {loading ? t("common.loading") : t("common.next")}
              </button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {t("auth.password")}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {t("auth.password")}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">{t("auth.phone")}</p>
                <p className="mt-1 font-semibold text-gray-900">
                  +998 {formatUzDigits(digits)}
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  {t("auth.password")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-4 text-base font-bold text-white shadow-lg shadow-green-200 transition hover:from-green-600 hover:to-green-700 disabled:opacity-50"
              >
                {loading ? t("common.loading") : t("auth.loginBtn")}
              </button>

              <button
                type="button"
                onClick={resetToPhone}
                className="w-full text-center text-sm text-gray-600 underline-offset-4 hover:text-green-600 hover:underline"
              >
                {t("common.back")}
              </button>
            </form>
          )}

          {step === "no-password" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Parol o&apos;rnatilmagan
                </h1>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  Siz Telegram orqali ro&apos;yxatdan o&apos;tgansiz. Sayt
                  orqali kirish uchun avval parol o&apos;rnatishingiz kerak.
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Telefon raqami</p>
                <p className="mt-1 font-semibold text-gray-900">
                  +998 {formatUzDigits(digits)}
                </p>
              </div>

              {linkedToTelegram ? (
                linkSent ? (
                  <div className="rounded-xl border-2 border-green-100 bg-green-50 p-4 text-sm text-green-700">
                    <p className="font-semibold">
                      ✅ Havola Telegram botingizga yuborildi
                    </p>
                    <p className="mt-1 text-green-600">
                      Botdan kelgan tugmani bosib parol o&apos;rnating, keyin
                      bu sahifaga qayting va qayta kiring.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestPasswordLink}
                    disabled={loading}
                    className="w-full rounded-xl bg-blue-500 px-4 py-4 text-base font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading
                      ? "Yuborilmoqda..."
                      : "Telegram orqali havola olish"}
                  </button>
                )
              ) : (
                <div className="rounded-xl border-2 border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                  <p>
                    Sizning hisobingizga Telegram ulanmagan. Iltimos{" "}
                    <a
                      href="https://t.me/nuvitauzbot"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold underline"
                    >
                      @nuvitauzbot
                    </a>{" "}
                    ga kirib <code>/start</code> bosing.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={resetToPhone}
                className="w-full text-center text-sm text-gray-600 underline-offset-4 hover:text-green-600 hover:underline"
              >
                Boshqa raqam bilan urinib ko&apos;rish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
