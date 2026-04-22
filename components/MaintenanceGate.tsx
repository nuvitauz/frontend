"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { Wrench, RefreshCcw, Clock } from "lucide-react";

const DEFAULT_MESSAGE =
  "Saytda texnik ishlar olib borilmoqda. Iltimos, biroz kutib turing — tez orada qaytamiz.";

interface MaintenanceState {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute =
    pathname?.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/register";

  const [state, setState] = useState<MaintenanceState>({
    maintenanceMode: false,
    maintenanceMessage: null,
  });
  const [checked, setChecked] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get<MaintenanceState>(
        `${API_BASE_URL}/public/maintenance`,
        { timeout: 6000 },
      );
      setState({
        maintenanceMode: Boolean(res.data?.maintenanceMode),
        maintenanceMessage: res.data?.maintenanceMessage ?? null,
      });
    } catch {
      // Tarmoq xatoligida saytni yopmaymiz
      setState({ maintenanceMode: false, maintenanceMessage: null });
    } finally {
      setChecked(true);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    const onFocus = () => fetchStatus();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (!checked) {
    return <>{children}</>;
  }

  if (!state.maintenanceMode) {
    return <>{children}</>;
  }

  const message = state.maintenanceMessage?.trim() || DEFAULT_MESSAGE;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />

      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-3xl border border-white/60 bg-white/80 p-6 sm:p-10 shadow-2xl backdrop-blur-md">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl animate-pulse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <Wrench className="h-9 w-9" aria-hidden />
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Nuvita.uz
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              Texnik ishlar olib borilmoqda
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-gray-600">
              {message}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            <span>Har 30 soniyada avtomatik tekshiriladi</span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={fetchStatus}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              <RefreshCcw className="h-4 w-4" />
              Qayta tekshirish
            </button>
            <a
              href="tel:+998971234567"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Yordam kerakmi? Biz bilan bog&apos;laning
            </a>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-4 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Nuvita.uz — Online dorixona
          </div>
        </div>
      </div>
    </div>
  );
}
