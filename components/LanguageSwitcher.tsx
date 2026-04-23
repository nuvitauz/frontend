"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";

type Variant = "default" | "compact" | "mobile";

export function LanguageSwitcher({ variant = "default" }: { variant?: Variant }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const active = LANGS.find((l) => l.code === lang) || LANGS[0];

  const handleSelect = (code: Lang) => {
    setLang(code);
    setOpen(false);
    // Mahsulot / kategoriya ma'lumotlari yangi til bilan qayta yuklanishi uchun
    // oynani yumshoq yangilaymiz.
    if (typeof window !== "undefined") {
      // Biroz kutib, switcher UI yopilsin, keyin sahifa yangilansin
      setTimeout(() => window.location.reload(), 150);
    }
  };

  if (variant === "mobile") {
    return (
      <div className="w-full">
        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
          {LANGS.find((l) => l.code === lang)?.native}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                lang === l.code
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                  : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="text-xs">{l.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const compactBtn =
    variant === "compact"
      ? "px-2 py-1.5 text-xs"
      : "px-3 py-2 text-sm";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group inline-flex items-center gap-1.5 ${compactBtn} rounded-full bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-700 font-medium transition-all shadow-sm hover:shadow`}
        aria-label="Language switcher"
      >
        <Globe size={variant === "compact" ? 14 : 16} className="text-emerald-600" />
        <span className="leading-none">{active.flag}</span>
        <span className="hidden sm:inline-block uppercase tracking-wide text-[11px] font-semibold">
          {active.code}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/70 overflow-hidden z-50 animate-[fadeIn_0.15s_ease-out]">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors ${
                lang === l.code
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-lg leading-none">{l.flag}</span>
                <span>{l.native}</span>
              </span>
              {lang === l.code && <Check size={16} className="text-emerald-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
