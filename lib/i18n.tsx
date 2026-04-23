"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { translations, type TranslationKey } from "@/lib/translations";

export type Lang = "uz" | "ru" | "en";
export const LANGS: { code: Lang; label: string; flag: string; native: string }[] = [
  { code: "uz", label: "O'zbek", native: "O'zbek", flag: "🇺🇿" },
  { code: "ru", label: "Русский", native: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
];

const STORAGE_KEY = "nuvita_lang";
const DEFAULT_LANG: Lang = "uz";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Backend uchun ENUM format: UZ / RU / EN */
  langUpper: "UZ" | "RU" | "EN";
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function normalizeLang(raw: string | null | undefined): Lang {
  const v = (raw || "").toLowerCase();
  if (v === "uz" || v === "ru" || v === "en") return v;
  return DEFAULT_LANG;
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_m, key) =>
    vars[key] !== undefined ? String(vars[key]) : `{${key}}`,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  const [ready, setReady] = useState(false);
  const userLoadedRef = useRef(false);

  // Dastlab localStorage'dan o'qish
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLangState(normalizeLang(saved));
    } catch {}
    setReady(true);
  }, []);

  // Foydalanuvchi login qilganda backend'dagi lang bilan sinxronlash (bir marta)
  useEffect(() => {
    if (!ready || userLoadedRef.current) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;
    userLoadedRef.current = true;

    axios
      .get(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const serverLang = normalizeLang(res.data?.lang);
        // Server tili bilan mahalliy til farqli bo'lsa, mahalliyni afzal ko'ramiz
        // (foydalanuvchi endigina switcher orqali tanlagan bo'lishi mumkin)
        const savedLocal = (() => {
          try {
            return localStorage.getItem(STORAGE_KEY);
          } catch {
            return null;
          }
        })();
        if (!savedLocal) {
          setLangState(serverLang);
        } else if (normalizeLang(savedLocal) !== serverLang) {
          // Mahalliyni server'ga push qilamiz
          axios
            .patch(
              `${API_BASE_URL}/user/me/lang`,
              { lang: normalizeLang(savedLocal).toUpperCase() },
              { headers: { Authorization: `Bearer ${token}` } },
            )
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [ready]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute("lang", next);
    } catch {}
    // Agar login bo'lgan bo'lsa, backend'ga saqlab qo'yamiz
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      axios
        .patch(
          `${API_BASE_URL}/user/me/lang`,
          { lang: next.toUpperCase() },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .catch(() => {});
    }
    // Yangi til bilan qayta yuklansin uchun custom event
    try {
      window.dispatchEvent(new CustomEvent("nuvita:lang-changed", { detail: next }));
    } catch {}
  }, []);

  const t = useCallback<I18nContextValue["t"]>(
    (key, vars) => {
      const dict = translations[lang] || translations[DEFAULT_LANG];
      const fallback = translations[DEFAULT_LANG];
      const raw = dict[key] ?? fallback[key] ?? key;
      return interpolate(raw, vars);
    },
    [lang],
  );

  useEffect(() => {
    try {
      document.documentElement.setAttribute("lang", lang);
    } catch {}
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t,
      langUpper: lang.toUpperCase() as "UZ" | "RU" | "EN",
      ready,
    }),
    [lang, setLang, t, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Provider yo'q bo'lsa fallback (SSR yoki test)
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      t: ((key: TranslationKey) => translations[DEFAULT_LANG][key] ?? key) as I18nContextValue["t"],
      langUpper: "UZ" as const,
      ready: false,
    };
  }
  return ctx;
}

/**
 * Product/Category kabi backend ob'ektlaridan UI uchun to'g'ri matnni oladi.
 * Backend displayName/displayDescription jo'natsa, avval ularni ishlatadi.
 */
export function pickLocalized<T extends Record<string, any>>(
  obj: T | null | undefined,
  field: "name" | "description" | "ingredients" | "uses" | "category",
): string {
  if (!obj) return "";
  const displayKey = `display${field.charAt(0).toUpperCase()}${field.slice(1)}`;
  return (obj[displayKey] ?? obj[field] ?? "") as string;
}
