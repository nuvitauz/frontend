"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Leaf,
  ArrowRight,
  Send,
  ShieldCheck,
  Truck,
  CreditCard,
  Clock,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const pathname = usePathname();
  const { t } = useI18n();

  if (pathname.startsWith("/admin") || pathname.startsWith("/profile")) {
    return null;
  }

  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-300">
      {/* Top gradient border */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_100%]"
        style={{ animation: "fxShimmer 8s linear infinite" }}
      />

      {/* Ambient decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl"
      />

      {/* ────── Trust strip ────── */}
      <div className="relative border-b border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Truck,
                title: t("hero.feature1.title"),
                desc: t("hero.feature1.desc"),
              },
              {
                icon: ShieldCheck,
                title: t("hero.feature2.title"),
                desc: t("footer.quality"),
              },
              {
                icon: CreditCard,
                title: t("hero.feature3.title"),
                desc: t("hero.feature3.desc"),
              },
              {
                icon: Clock,
                title: t("footer.support"),
                desc: t("footer.aboutText"),
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform">
                  <f.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {f.title}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ────── Main columns ────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="group inline-flex items-center gap-2">
              <span className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-900/40 group-hover:shadow-emerald-500/40 transition-shadow">
                <Leaf
                  size={18}
                  strokeWidth={2.5}
                  className="text-white group-hover:rotate-[-8deg] transition-transform"
                />
              </span>
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                Nuvita
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-sm">
              {t("footer.aboutText")}
            </p>

            {/* Newsletter-like CTA → Telegram */}
            <a
              href="https://t.me/nuvitauzbot"
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-3 pl-1 pr-5 py-1 rounded-full bg-white/[0.04] border border-white/10 hover:border-emerald-400/40 hover:bg-emerald-500/5 transition-all"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md group-hover:scale-110 transition-transform">
                <Send size={14} />
              </span>
              <span className="text-sm font-semibold text-white">
                Telegram bot
              </span>
              <ArrowRight
                size={14}
                className="text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all"
              />
            </a>

            {/* Social pills */}
            <div className="mt-6 flex items-center gap-2">
              <a
                href="https://t.me/nuvitauzbot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 transition-all hover:scale-110 hover:-translate-y-0.5 hover:bg-sky-500/15 hover:text-sky-400"
              >
                <MessageCircle size={17} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-gray-400 transition-all hover:scale-110 hover:-translate-y-0.5 hover:bg-pink-500/15 hover:text-pink-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  width="17"
                  height="17"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links: Pages */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">
              {t("footer.links")}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/", label: t("nav.home") },
                { href: "/catalog", label: t("nav.catalog") },
                { href: "/about", label: t("nav.about") },
                { href: "/contact", label: t("nav.contact") },
                { href: "/blog", label: t("nav.blog") },
              ].map((l, i) => (
                <li key={i}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    <span className="w-0 h-[1px] bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {l.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Help */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">
              {t("footer.support")}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/contact", label: t("footer.delivery") },
                { href: "/contact", label: t("footer.quality") },
                { href: "/contact", label: t("footer.payment") },
                { href: "/contact", label: t("nav.contact") },
              ].map((l, i) => (
                <li key={i}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    <span className="w-0 h-[1px] bg-emerald-400 group-hover:w-3 transition-all duration-300" />
                    <span className="group-hover:translate-x-0.5 transition-transform">
                      {l.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400" />
              {t("footer.contacts")}
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href="tel:+998901234567"
                  className="group flex items-center gap-3 p-2 -ml-2 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                  <span className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <Phone size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                      {t("checkout.phone")}
                    </p>
                    <p className="text-white font-semibold truncate">
                      +998 90 123 45 67
                    </p>
                  </div>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@nuvita.uz"
                  className="group flex items-center gap-3 p-2 -ml-2 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                  <span className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 shrink-0 group-hover:bg-teal-500/20 transition-colors">
                    <Mail size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                      Email
                    </p>
                    <p className="text-white font-semibold truncate">
                      info@nuvita.uz
                    </p>
                  </div>
                </a>
              </li>
              <li>
                <div className="group flex items-start gap-3 p-2 -ml-2 rounded-xl">
                  <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0 mt-0.5">
                    <MapPin size={15} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                      {t("profile.address")}
                    </p>
                    <p className="text-white font-semibold leading-snug">
                      Toshkent sh., Chilonzor tumani
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ────── Bottom bar ────── */}
        <div className="relative mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center md:text-left">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-bold text-gray-300">Nuvita.uz</span> — {t("footer.copyright")}.
          </p>
          <div className="flex items-center gap-2">
            {[
              { label: "Click", gradient: "from-sky-500 to-blue-500" },
              { label: "Payme", gradient: "from-emerald-500 to-teal-500" },
              { label: "Naqd", gradient: "from-amber-500 to-orange-500" },
            ].map((p, i) => (
              <span
                key={i}
                className="relative text-[10px] font-extrabold uppercase tracking-wider text-white px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-sm"
              >
                <span
                  className={`absolute inset-0 rounded-lg bg-gradient-to-r ${p.gradient} opacity-0 hover:opacity-100 transition-opacity -z-10`}
                />
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fxShimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </footer>
  );
}
