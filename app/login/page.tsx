"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ExternalLink, KeyRound, Phone } from "lucide-react";

const TG_BOT =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "nuvitauzbot";
const TG_BOT_HANDLE = TG_BOT.startsWith("@") ? TG_BOT : `@${TG_BOT}`;
const TG_BOT_URL = `https://t.me/${TG_BOT.replace(/^@/, "")}`;

type PhoneFlow = "EXISTING_LINKED" | "EXISTING_NO_TELEGRAM" | "NEW_USER";

function formatUzDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 9);
  const a = d.slice(0, 2);
  const b = d.slice(2, 5);
  const c = d.slice(5, 7);
  const e = d.slice(7, 9);
  const parts = [a, b, c, e].filter((p) => p.length > 0);
  return parts.join(" ");
}

type Step = "phone" | "code" | "no_telegram";

function OtpSlots({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const writeDigits = useCallback(
    (digits: string) => {
      onChange(digits.replace(/\D/g, "").slice(0, 6));
    },
    [onChange],
  );

  const setAt = useCallback(
    (index: number, char: string) => {
      const v = value.replace(/\D/g, "").slice(0, 6);
      const arr = v.split("");
      while (arr.length < 6) arr.push("");
      const d = char.replace(/\D/g, "").slice(-1);
      arr[index] = d || "";
      writeDigits(arr.join(""));
    },
    [value, writeDigits],
  );

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const onSlotChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "");
    if (d.length >= 1) {
      setAt(i, d.slice(-1));
      if (i < 5) refs.current[i + 1]?.focus();
    } else {
      setAt(i, "");
    }
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[i] && value[i] !== undefined) {
        setAt(i, "");
        return;
      }
      if (i > 0) {
        setAt(i - 1, "");
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    writeDigits(pasted);
    const next = Math.min(Math.max(pasted.length - 1, 0), 5);
    refs.current[next]?.focus();
  };

  const digitsOnly = value.replace(/\D/g, "").slice(0, 6);

  return (
    <div className="flex justify-center gap-1.5 sm:gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          name={i === 0 ? "code" : `code-${i}`}
          id={i === 0 ? "code" : `code-slot-${i}`}
          disabled={disabled}
          maxLength={1}
          value={digitsOnly[i] ?? ""}
          onChange={(e) => onSlotChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={i === 0 ? onPaste : undefined}
          className="h-12 w-10 rounded-lg border border-gray-200 bg-gray-50/80 text-center text-lg font-semibold tabular-nums text-gray-900 shadow-sm outline-none transition-all placeholder:text-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50 sm:h-14 sm:w-11 sm:rounded-xl sm:text-xl"
          placeholder="·"
          aria-label={`Kod ${i + 1}-raqam`}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();

  const cleanPhone = `+998${digits.replace(/\D/g, "").slice(0, 9)}`;

  const onDigitsChange = (v: string) => {
    let d = v.replace(/\D/g, "");
    if (d.startsWith("998")) d = d.slice(3);
    setDigits(d.slice(0, 9));
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (digits.replace(/\D/g, "").length !== 9) {
      setError("9 raqamli telefon raqamini to'liq kiriting");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post<{ flow: PhoneFlow }>(
        `${API_BASE_URL}/auth/check-phone`,
        { number: cleanPhone },
      );
      const { flow } = res.data;
      if (flow === "NEW_USER") {
        router.push(`/register?phone=${encodeURIComponent(cleanPhone)}`);
        return;
      }
      if (flow === "EXISTING_NO_TELEGRAM") {
        setStep("no_telegram");
        return;
      }
      setStep("code");
      setCode("");
    } catch {
      setError("Tekshirishda xatolik. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length !== 6) {
      setError("6 raqamni kiriting");
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
        "Kod noto'g'ri yoki muddati tugagan. Botda /start yoki /code bosing.",
      );
    } finally {
      setLoading(false);
    }
  };

  const cardClass =
    "w-full max-w-[420px] rounded-3xl border border-gray-200/90 bg-white/95 p-6 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8";

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-slate-100/90 via-white to-emerald-50/30 text-gray-900">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="compact" />
      </div>
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-5 text-center text-2xl font-bold tracking-tight text-emerald-700 sm:mb-6 sm:text-[26px]"
        >
          Nuvita
        </Link>

        <div className={cardClass}>
          <div className="border-b border-gray-100 pb-4">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {t("auth.login")}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
              Telegram bot — tezkor kirish
            </p>
          </div>

          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:text-sm sm:normal-case sm:text-gray-800 sm:font-semibold"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600 sm:h-4 sm:w-4" />
                  Telefon raqam
                </label>
                <div className="flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-inner transition-[box-shadow] focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20">
                  <span className="shrink-0 select-none border-r border-gray-100 bg-emerald-50/80 px-3 py-3.5 text-sm font-semibold text-emerald-900/90">
                    +998
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
                    placeholder="94 133 93 83"
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
                className="w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-gray-900/10 transition hover:bg-gray-800 disabled:opacity-50 sm:py-4 sm:text-base"
              >
                {loading ? t("common.loading") : "Davom etish"}
              </button>
            </form>
          )}

          {step === "code" && (
            <div className="mt-5 space-y-5">
              <p className="text-center text-xs text-gray-500">
                <span className="font-mono font-medium text-gray-800">
                  +998 {formatUzDigits(digits)}
                </span>
              </p>

              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:py-2.5">
                <div className="min-w-0 space-y-1.5 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  <p>
                    O&apos;ngdagi tugma orqali botni oching va yozing:{" "}
                    <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200 sm:text-xs">
                      /start
                    </code>
                  </p>
                </div>
                <a
                  href={TG_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 self-stretch rounded-xl bg-[#229ED9] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1b8bc4] sm:self-auto sm:py-2 sm:text-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5 opacity-95" />
                  {TG_BOT_HANDLE}
                </a>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                    6 xonali kod
                  </label>
                  <OtpSlots
                    key={step + cleanPhone}
                    value={code}
                    onChange={setCode}
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="text-center text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gray-900 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-gray-800 disabled:opacity-50 sm:py-4 sm:text-base"
                >
                  {loading ? t("common.loading") : t("auth.loginBtn")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setCode("");
                    setError("");
                  }}
                  className="w-full pb-0.5 text-center text-xs text-gray-500 underline-offset-4 hover:text-emerald-700 hover:underline sm:text-sm"
                >
                  Boshqa raqam
                </button>
              </form>
            </div>
          )}

          {step === "no_telegram" && (
            <div className="mt-6 space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950">
              <p className="font-semibold">Telegram ulanmagan</p>
              <p className="text-xs leading-relaxed text-amber-900/90 sm:text-sm">
                Avval{" "}
                <Link
                  href="/profile"
                  className="font-semibold text-amber-800 underline"
                >
                  Profil
                </Link>{" "}
                → Telegramga ulash, keyin qayta urinib ko&apos;ring.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError("");
                }}
                className="w-full rounded-xl border border-amber-200/90 bg-white py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-50/80 sm:text-sm"
              >
                Orqaga
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
