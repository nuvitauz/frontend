"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ExternalLink, KeyRound, Phone, Loader2 } from "lucide-react";

const TG_BOT =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "nuvitauzbot";
const TG_BOT_HANDLE = TG_BOT.startsWith("@") ? TG_BOT : `@${TG_BOT}`;
const TG_BOT_URL = `https://t.me/${TG_BOT.replace(/^@/, "")}`;

/** Backend `normalizeUzbekPhone` bilan mos */
function normalizeUzbekPhoneParam(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("998")) return `+${d}`;
  if (d.length === 9) return `+998${d}`;
  return "";
}

function RegisterFormInner() {
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cleanPhone = normalizeUzbekPhoneParam(phoneParam);

  const onCodeChange = (v: string) => {
    setCode(v.replace(/\D/g, "").slice(0, 6));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!cleanPhone) {
      setError("Telefon raqam yo'q. Kirish sahifasidan qayta kiring.");
      return;
    }
    if (code.length !== 6) {
      setError("6 xonali kodni kiriting");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        number: cleanPhone,
        password: code,
      });
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      window.location.href = "/";
    } catch {
      setError(
        "Kod noto'g'ri yoki muddati tugagan. Botda kontakt ulang, keyin /code.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!cleanPhone) {
    return (
      <div className="max-w-[420px] mx-auto px-4 py-12 text-center">
        <p className="text-gray-700 text-sm mb-4">
          Telefon raqam ko&apos;rsatilmagan.
        </p>
        <Link
          href="/login"
          className="text-green-700 font-semibold underline"
        >
          Kirish sahifasiga
        </Link>
      </div>
    );
  }

  const displayDigits = cleanPhone.replace(/^\+998/, "");

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-gray-100 bg-white p-7 shadow-xl shadow-gray-100 sm:p-9">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Ro&apos;yxatdan o&apos;tish
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Avval botda kontakt ulang (shu raqam), keyin shu yerga kodni kiriting.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <Phone className="h-4 w-4 shrink-0 text-gray-500" />
        <span className="font-mono font-medium">+998 {displayDigits}</span>
      </div>

      <div className="mt-6 space-y-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
          1. Botda /start
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          /start bosing, keyin <strong className="text-gray-800">shu telefon</strong>{" "}
          raqamini kontakt qilib yuboring — kod shaxsiy xabarda keladi (saytga
          kirmasdan oldin bot).
        </p>
        <a
          href={TG_BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {TG_BOT_HANDLE}
        </a>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          2. Kodni kiriting
        </p>
        <div>
          <label
            htmlFor="reg-code"
            className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800"
          >
            <KeyRound className="h-4 w-4 text-gray-500" />
            Bot yuborgan 6 xonali kod
          </label>
          <input
            id="reg-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            placeholder="0 0 0 0 0 0"
            className="block w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3.5 text-center font-mono text-lg tracking-[0.35em] text-gray-900 outline-none transition-colors focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
        <p className="text-xs text-gray-500">
          <code className="rounded bg-gray-100 px-1">/code</code> — yangi kod
        </p>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gray-900 px-4 py-4 text-base font-bold text-white shadow-lg transition hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Kutilmoqda…" : "Kirish"}
        </button>
        <Link
          href="/login"
          className="block w-full text-center text-sm text-gray-600 underline-offset-4 hover:text-green-600 hover:underline"
        >
          Boshqa raqam bilan kirish
        </Link>
      </form>
    </div>
  );
}

function RegisterFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-green-600" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-white text-gray-900">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="compact" />
      </div>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-6 text-center text-2xl font-bold tracking-tight text-green-600 sm:text-[26px]"
        >
          Nuvita
        </Link>
        <Suspense fallback={<RegisterFallback />}>
          <RegisterFormInner />
        </Suspense>
      </div>
    </div>
  );
}
