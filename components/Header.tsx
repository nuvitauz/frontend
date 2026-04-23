"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  Search,
  X,
  Menu,
  User,
  Heart,
  ChevronDown,
  FileText,
  LogOut,
  Sparkles,
  Leaf,
  LogIn,
} from "lucide-react";
import {
  isTelegramMiniApp,
  getTelegramInitData,
  getTelegramWebApp,
} from "@/lib/telegram";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface UserProfile {
  id: number;
  number: string;
  userId?: string | null;
  fullName: string | null;
  username?: string | null;
  email?: string | null;
  address?: string | null;
  photoUrl?: string | null;
}

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken,
    });
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    return null;
  }
};

const NAV_LINKS = [
  { href: "/", labelKey: "nav.home" as const },
  { href: "/catalog", labelKey: "nav.catalog" as const },
  { href: "/blog", labelKey: "nav.blog" as const },
  { href: "/contact", labelKey: "nav.contact" as const },
] as const;

export function Header() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [savedCount, setSavedCount] = useState<number>(0);
  const [isTg, setIsTg] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Tiny "pop" animations on badge change
  const [cartPulse, setCartPulse] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();

  /* ───── Auth & data fetching ───── */

  const authenticateWithTelegram = async () => {
    const initData = getTelegramInitData();
    if (!initData) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/telegram`, {
        initData,
      });
      if (res.data?.needsOnboarding) return;
      const { accessToken, refreshToken, user } = res.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("tgUserData", JSON.stringify(user));
      setToken(accessToken);
      setProfile({
        id: user.id,
        number: user.number,
        userId: user.userId,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        address: user.address,
        photoUrl: user.photoUrl,
      });
      const webApp = getTelegramWebApp();
      webApp?.ready();
      webApp?.expand();
    } catch (e) {
      console.error("TG auth error:", e);
    }
  };

  const fetchProfile = async (t: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/user/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setProfile(res.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          setToken(newToken);
          fetchProfile(newToken);
        } else {
          setToken(null);
          setProfile(null);
        }
      }
    }
  };

  const fetchCart = async (t: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const newCount = res.data.count || 0;
      setCartCount((prev) => {
        if (prev !== newCount && prev >= 0) {
          setCartPulse(true);
          setTimeout(() => setCartPulse(false), 400);
        }
        return newCount;
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          setToken(newToken);
          fetchCart(newToken);
        } else {
          setToken(null);
          setProfile(null);
        }
      }
    }
  };

  const fetchSavedCount = async (t: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/saved/count`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const newCount = res.data.count || 0;
      setSavedCount((prev) => {
        if (prev !== newCount && prev >= 0) {
          setSavedPulse(true);
          setTimeout(() => setSavedPulse(false), 400);
        }
        return newCount;
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          setToken(newToken);
          fetchSavedCount(newToken);
        }
      }
    }
  };

  useEffect(() => {
    const inTg = isTelegramMiniApp();
    setIsTg(inTg);

    if (inTg) {
      authenticateWithTelegram();
    } else {
      const t = localStorage.getItem("accessToken");
      if (t) {
        setToken(t);
        fetchProfile(t);
        fetchCart(t);
        fetchSavedCount(t);
      }
    }

    const interval = setInterval(() => {
      const currentToken = localStorage.getItem("accessToken");
      if (currentToken) {
        fetchCart(currentToken);
        fetchSavedCount(currentToken);
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token && isTg) {
      fetchCart(token);
      fetchSavedCount(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isTg]);

  /* ───── Scroll effect ───── */
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > 50 && isSearchOpen) setIsSearchOpen(false);
      setIsScrolled(y > 12);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  /* ───── Close menus on route change ───── */
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileDropdownOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  /* ───── Close dropdown on outside click ───── */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ───── Lock body scroll when mobile menu open ───── */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setProfile(null);
    setIsProfileDropdownOpen(false);
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    } else {
      router.push(`/`);
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen((p) => !p);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen((p) => !p);
    if (isSearchOpen) setIsSearchOpen(false);
  };

  if (pathname.startsWith("/admin") || pathname.startsWith("/profile"))
    return null;

  const displayName = profile?.fullName || profile?.number || "Profil";
  const userInitial = profile?.fullName
    ? profile.fullName.charAt(0).toUpperCase()
    : profile?.number?.charAt(0) || "M";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/85 backdrop-blur-xl shadow-[0_4px_30px_-10px_rgba(16,185,129,0.15)]"
            : "bg-white/95 backdrop-blur-md shadow-sm"
        } border-b border-gray-100/70`}
      >
        {/* Top gradient hairline */}
        <div
          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_100%]"
          style={{ animation: "nvShimmer 6s linear infinite" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-3">
            {/* ─── Left: Burger + Logo + Desktop Nav ─── */}
            <div className="flex items-center shrink-0 gap-2">
              <button
                onClick={toggleMenu}
                className="md:hidden relative p-2.5 text-gray-700 hover:text-emerald-600 transition-colors bg-gray-50 hover:bg-emerald-50 active:scale-95 rounded-xl"
                aria-label="Menu"
              >
                <span className="sr-only">Menu</span>
                <div className="relative w-5 h-5">
                  <span
                    className={`absolute left-0 top-1.5 w-5 h-[2px] rounded-full bg-current transition-all duration-300 ${
                      isMenuOpen ? "rotate-45 top-[9px]" : ""
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[9px] w-5 h-[2px] rounded-full bg-current transition-all duration-200 ${
                      isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-3 w-5 h-[2px] rounded-full bg-current transition-all duration-300 ${
                      isMenuOpen ? "-rotate-45 top-[9px]" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Brand */}
              <Link
                href="/"
                className="group relative flex items-center gap-1.5 mr-2 md:mr-4 shrink-0"
              >
                <span className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-200/60 group-hover:shadow-lg group-hover:shadow-emerald-200 group-active:scale-95 transition-all">
                  <Leaf
                    size={16}
                    className="text-white drop-shadow-sm group-hover:rotate-[-8deg] transition-transform duration-300"
                    strokeWidth={2.5}
                  />
                </span>
                <span className="text-[22px] font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Nuvita
                </span>
              </Link>

              {/* Desktop navigation */}
              <nav className="hidden md:flex items-center gap-1 text-sm">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative px-3.5 py-2 rounded-full font-medium transition-colors ${
                        active
                          ? "text-emerald-700"
                          : "text-gray-600 hover:text-emerald-600"
                      }`}
                    >
                      <span className="relative z-10">{t(link.labelKey)}</span>
                      {active && (
                        <span className="absolute inset-0 rounded-full bg-emerald-50 -z-0" />
                      )}
                      <span
                        className={`absolute left-1/2 -translate-x-1/2 bottom-1 h-0.5 bg-emerald-500 rounded-full transition-all duration-300 ${
                          active ? "w-5 opacity-100" : "w-0 opacity-0"
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* ─── Center: Desktop Search ─── */}
            <div className="flex-1 max-w-md hidden lg:block mx-4">
              <form onSubmit={handleSearch} className="relative group">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                  <Search size={17} />
                </span>
                <input
                  type="text"
                  placeholder={t("common.search") + "…"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-transparent rounded-full py-2.5 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100"
                  >
                    <X size={13} />
                  </button>
                )}
              </form>
            </div>

            {/* ─── Right: Icons + Auth ─── */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Mobile search */}
              <button
                onClick={toggleSearch}
                className={`md:hidden relative p-2.5 rounded-xl transition-all active:scale-95 ${
                  isSearchOpen
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-50 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50"
                }`}
                aria-label={t("common.search")}
              >
                <Search size={19} />
              </button>

              {/* Language switcher (desktop) */}
              <div className="hidden md:block">
                <LanguageSwitcher variant="compact" />
              </div>

              {/* Saved */}
              {token && (
                <Link
                  href="/selected"
                  className="group relative p-2.5 rounded-xl bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-500 transition-all active:scale-95"
                  aria-label={t("nav.saved")}
                >
                  <Heart
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                  {savedCount > 0 && (
                    <span
                      className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center rounded-full ring-2 ring-white shadow-sm transition-transform ${
                        savedPulse ? "nv-pop" : ""
                      }`}
                    >
                      {savedCount > 99 ? "99+" : savedCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className="group relative p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 transition-all active:scale-95"
                aria-label={t("nav.cart")}
              >
                <ShoppingCart
                  size={20}
                  className="group-hover:scale-110 transition-transform"
                />
                {cartCount > 0 && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold text-white bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center rounded-full ring-2 ring-white shadow-sm transition-transform ${
                      cartPulse ? "nv-pop" : ""
                    }`}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Profile / Login */}
              {token ? (
                <div className="relative ml-1" ref={profileDropdownRef}>
                  <button
                    onClick={() =>
                      setIsProfileDropdownOpen(!isProfileDropdownOpen)
                    }
                    className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 pl-1.5 pr-2 py-1.5 rounded-full transition-all active:scale-95 shrink-0 border border-transparent hover:border-emerald-100"
                  >
                    <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white overflow-hidden">
                      {profile?.photoUrl ? (
                        <img
                          src={profile.photoUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform duration-300 ${
                        isProfileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  <div
                    className={`absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(16,185,129,0.25)] border border-gray-100 overflow-hidden origin-top-right transition-all duration-200 ${
                      isProfileDropdownOpen
                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                    }`}
                  >
                    <div className="relative p-4 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-b border-emerald-100/40">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold ring-2 ring-white shadow-md overflow-hidden shrink-0">
                          {profile?.photoUrl ? (
                            <img
                              src={profile.photoUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            userInitial
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate text-sm">
                            {displayName}
                          </p>
                          {profile?.username && (
                            <p className="text-[11px] text-gray-500 truncate">
                              @{profile.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      {[
                        { href: "/profile", icon: User, label: t("nav.profile") },
                        {
                          href: "/orders",
                          icon: FileText,
                          label: t("nav.orders"),
                        },
                        {
                          href: "/selected",
                          icon: Heart,
                          label: t("nav.saved"),
                        },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 group-hover:bg-white group-hover:text-emerald-600 text-gray-500 transition-colors">
                            <item.icon size={15} />
                          </span>
                          <span className="font-semibold text-sm">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                    {!isTg && (
                      <div className="p-1.5 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 group-hover:bg-white text-red-500 transition-colors">
                            <LogOut size={15} />
                          </span>
                          <span className="font-semibold text-sm">
                            {t("nav.logout")}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="group relative inline-flex items-center gap-1.5 text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 rounded-full font-semibold transition-all text-sm ml-1 shadow-md shadow-emerald-200 active:scale-95 overflow-hidden"
                >
                  <span
                    className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background:
                        "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                      animation: "nvShine 1.8s ease-in-out infinite",
                    }}
                  />
                  <LogIn size={15} className="relative z-10" />
                  <span className="relative z-10">{t("nav.login")}</span>
                </Link>
              )}
            </div>
          </div>

          {/* ─── Mobile Search (collapsible) ─── */}
          <div
            className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
              isSearchOpen
                ? "max-h-20 pb-3 opacity-100"
                : "max-h-0 pb-0 opacity-0"
            }`}
          >
            <form onSubmit={handleSearch} className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={17} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("common.search") + "…"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-full py-3 pl-10 pr-24 focus:outline-none focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-sm active:scale-95 transition-transform"
                >
                  {t("common.search")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* ─── Mobile menu overlay (outside sticky header for full screen) ─── */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          className={`absolute left-0 top-16 bottom-0 w-[82%] max-w-sm bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-5 space-y-6">
            {/* Mini promo / brand line */}
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-emerald-600">
              <Sparkles size={13} />
              Nuvita — tabiiy yechim
            </div>

            {/* Nav items with staggered slide-in */}
            <ul className="space-y-1">
              {NAV_LINKS.map((link, i) => {
                const active = isActive(link.href);
                return (
                  <li
                    key={link.href}
                    className={isMenuOpen ? "nv-slidein" : ""}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl font-semibold transition-all ${
                        active
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <span>{t(link.labelKey)}</span>
                      {active ? (
                        <span className="w-2 h-2 rounded-full bg-white/90 animate-pulse" />
                      ) : (
                        <span className="text-gray-300">→</span>
                      )}
                    </Link>
                  </li>
                );
              })}
              {token && (
                <li
                  className={isMenuOpen ? "nv-slidein" : ""}
                  style={{ animationDelay: `${NAV_LINKS.length * 40}ms` }}
                >
                  <Link
                    href="/selected"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all"
                  >
                    <Heart size={17} className="text-pink-500 shrink-0" />
                    <span>{t("nav.saved")}</span>
                    {savedCount > 0 && (
                      <span className="ml-auto bg-pink-100 text-pink-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {savedCount}
                      </span>
                    )}
                  </Link>
                </li>
              )}
            </ul>

            {/* Language switcher (mobile) */}
            <div className="pt-4 border-t border-gray-100">
              <LanguageSwitcher variant="mobile" />
            </div>

            {/* Bottom CTA */}
            {!token && (
              <Link
                href="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-all"
              >
                <LogIn size={16} />
                {t("nav.login")}
              </Link>
            )}
          </div>
        </nav>
      </div>

      <style jsx global>{`
        @keyframes nvShimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        @keyframes nvShine {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes nvPop {
          0% {
            transform: scale(1);
          }
          40% {
            transform: scale(1.35);
          }
          100% {
            transform: scale(1);
          }
        }
        .nv-pop {
          animation: nvPop 0.4s ease-out;
        }
        @keyframes nvSlidein {
          0% {
            opacity: 0;
            transform: translateX(-12px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .nv-slidein {
          animation: nvSlidein 0.35s ease-out both;
        }
      `}</style>
    </>
  );
}
