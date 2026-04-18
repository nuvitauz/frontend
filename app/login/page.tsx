"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";

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
  const [step, setStep] = useState<"phone" | "password">("phone");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
      const res = await axios.post(`${API_BASE_URL}/auth/check-phone`, {
        number: cleanPhone,
      });
      if (res.data.exists) {
        setStep("password");
      } else {
        router.push(`/register?phone=${encodeURIComponent(cleanPhone)}`);
      }
    } catch (err) {
      console.error(err);
      setError("Tizimda xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
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
      const ax = err as { response?: { status?: number } };
      if (ax.response?.status === 401) {
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

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-green-50 via-white to-white text-gray-900">
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-8 text-center text-2xl font-bold tracking-tight text-green-600 sm:text-[26px]"
        >
          Nuvita
        </Link>

        <div className="w-full max-w-[400px] rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100 sm:p-9">
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Kirish
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Telefon raqamingizni kiriting
                </p>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Telefon raqami
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
                {loading ? "Tekshirilmoqda..." : "Kirish"}
              </button>

              <p className="text-center text-[11px] leading-relaxed text-gray-500 sm:text-xs">
                Yangi foydalanuvchilar avtomatik ro&apos;yxatdan
                o&apos;tkaziladi
              </p>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Parol
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  Hisobingiz parolini kiriting
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Telefon raqami</p>
                <p className="mt-1 font-semibold text-gray-900">
                  +998 {formatUzDigits(digits)}
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Parol
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
                {loading ? "Kirilmoqda..." : "Tizimga kirish"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setPassword("");
                  setError("");
                }}
                className="w-full text-center text-sm text-gray-600 underline-offset-4 hover:text-green-600 hover:underline"
              >
                Boshqa raqam bilan kirish
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
