import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  (process.env.NODE_ENV === "production"
    ? "https://nuvita.uz/api"
    : "http://localhost:3001/api");

// Global axios default: har bir so'rovga lang query parametrini qo'shamiz.
// Frontend mahsulot/kategoriya endpointlaridan to'g'ri tarjimani oladi.
if (typeof window !== "undefined") {
  let interceptorRegistered = (axios.defaults as any).__nuvitaLangInterceptor;
  if (!interceptorRegistered) {
    axios.interceptors.request.use((config) => {
      try {
        const raw = (localStorage.getItem("nuvita_lang") || "uz").toLowerCase();
        const lang = raw === "ru" ? "RU" : raw === "en" ? "EN" : "UZ";
        // Faqat bizning API ga yuboriladigan so'rovlarga qo'shamiz
        const url = config.url || "";
        if (url.includes("/product") || url.includes("/category")) {
          config.params = { ...(config.params || {}), lang };
        }
      } catch {}
      return config;
    });
    (axios.defaults as any).__nuvitaLangInterceptor = true;
  }
}
