"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  Save,
  Check,
  AlertTriangle,
  Wrench,
  Truck,
  Loader2,
  Settings as SettingsIcon,
  Power,
  MessageSquare,
  Eye,
  Info,
  Sparkles,
  Banknote,
} from "lucide-react";

interface Settings {
  deliverySumm: number;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

const DEFAULT_MAINTENANCE_MESSAGE =
  "Saytda texnik ishlar olib borilmoqda. Iltimos, biroz kutib turing — tez orada qaytamiz.";

const DELIVERY_PRESETS = [
  { label: "20 000", value: 20000 },
  { label: "30 000", value: 30000 },
  { label: "50 000", value: 50000 },
  { label: "Bepul", value: 0 },
];

function formatMoney(n: number) {
  return n.toLocaleString("uz-UZ");
}

// ============ Section Card ============
function Section({
  icon: Icon,
  title,
  description,
  accent,
  statusPill,
  children,
  className = "",
}: {
  icon: any;
  title: string;
  description: string;
  accent: string;
  statusPill?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
    >
      <div className="p-5 sm:p-6 border-b border-gray-100">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl ${accent} flex-shrink-0`}>
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              {statusPill}
            </div>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default function AdminSettings() {
  const [deliverySumm, setDeliverySumm] = useState<number>(30000);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>("");
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  const [deliveryLoading, setDeliveryLoading] = useState<boolean>(false);
  const [deliverySaved, setDeliverySaved] = useState<boolean>(false);
  const [savedDelivery, setSavedDelivery] = useState<number>(30000);

  const [maintenanceSaving, setMaintenanceSaving] = useState<boolean>(false);
  const [maintenanceMsgSaved, setMaintenanceMsgSaved] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string>("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get<Settings>(`${API_BASE_URL}/admin/settings`, {
        headers: getAuthHeaders(),
      });
      if (res.data) {
        const ds = res.data.deliverySumm ?? 30000;
        const mm = res.data.maintenanceMessage ?? "";
        setDeliverySumm(ds);
        setSavedDelivery(ds);
        setMaintenanceMode(Boolean(res.data.maintenanceMode));
        setMaintenanceMessage(mm);
        setSavedMessage(mm);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryLoading(true);
    setDeliverySaved(false);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/settings`,
        { deliverySumm: Number(deliverySumm) },
        { headers: getAuthHeaders() },
      );
      setSavedDelivery(deliverySumm);
      setDeliverySaved(true);
      setTimeout(() => setDeliverySaved(false), 2500);
    } catch (error) {
      console.error(error);
      alert("Xatolik yuz berdi!");
    } finally {
      setDeliveryLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    if (maintenanceSaving) return;
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    setMaintenanceSaving(true);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/settings`,
        { maintenanceMode: next },
        { headers: getAuthHeaders() },
      );
    } catch (error) {
      console.error(error);
      setMaintenanceMode(!next);
      alert("Holatni o'zgartirib bo'lmadi!");
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const saveMaintenanceMessage = async () => {
    setMaintenanceSaving(true);
    setMaintenanceMsgSaved(false);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/settings`,
        { maintenanceMessage: maintenanceMessage.trim() || null },
        { headers: getAuthHeaders() },
      );
      setSavedMessage(maintenanceMessage);
      setMaintenanceMsgSaved(true);
      setTimeout(() => setMaintenanceMsgSaved(false), 2500);
    } catch (error) {
      console.error(error);
      alert("Xabarni saqlab bo'lmadi!");
    } finally {
      setMaintenanceSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-9 h-9 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const deliveryChanged = deliverySumm !== savedDelivery;
  const messageChanged = maintenanceMessage !== savedMessage;
  const previewMessage = maintenanceMessage.trim() || DEFAULT_MAINTENANCE_MESSAGE;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ============ HEADER ============ */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
          <SettingsIcon className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sozlamalar</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Platformaning umumiy sozlamalarini shu yerdan boshqaring
          </p>
        </div>
      </div>

      {/* ============ QUICK STATUS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Site status */}
        <div
          className={`relative overflow-hidden rounded-2xl p-4 border shadow-sm transition-all ${
            maintenanceMode
              ? "bg-gradient-to-br from-amber-50 via-white to-orange-50 border-amber-200"
              : "bg-gradient-to-br from-emerald-50 via-white to-green-50 border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                maintenanceMode
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <Power size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Sayt holati
              </p>
              <p className="text-sm font-bold mt-0.5 text-gray-900 flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    maintenanceMode ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                  }`}
                />
                {maintenanceMode ? "Texnik ishlar" : "Ishlamoqda"}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery status */}
        <div className="relative overflow-hidden rounded-2xl p-4 border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
              <Banknote size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Yetkazib berish narxi
              </p>
              <p className="text-sm font-bold mt-0.5 text-gray-900">
                {savedDelivery === 0
                  ? "Bepul"
                  : `${formatMoney(savedDelivery)} so'm`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MAINTENANCE MODE ============ */}
      <Section
        icon={Wrench}
        title="Texnik ishlar rejimi"
        description="Yoqilganda, adminlardan tashqari barcha foydalanuvchilarga maxsus texnik ishlar sahifasi ko'rsatiladi. Yangi buyurtmalar qabul qilinmaydi."
        accent={
          maintenanceMode
            ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
            : "bg-gray-100 text-gray-500"
        }
        statusPill={
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
              maintenanceMode
                ? "bg-amber-500 text-white"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                maintenanceMode ? "bg-white" : "bg-emerald-500"
              }`}
            />
            {maintenanceMode ? "Yoqilgan" : "O'chirilgan"}
          </span>
        }
      >
        <div className="space-y-5">
          {/* Toggle card */}
          <div
            className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
              maintenanceMode
                ? "bg-amber-50/50 border-amber-200"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                Rejimni {maintenanceMode ? "o'chirish" : "yoqish"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {maintenanceMode
                  ? "Hozir faqat adminlar saytga kira oladi"
                  : "Hamma foydalanuvchilar saytga kirishi mumkin"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={maintenanceMode}
              onClick={toggleMaintenance}
              disabled={maintenanceSaving}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400 disabled:opacity-60 ${
                maintenanceMode ? "bg-amber-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  maintenanceMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Warning */}
          {maintenanceMode && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <strong>Diqqat:</strong> Foydalanuvchilar saytga kira olmaydi va
                yangi buyurtma bera olmaydi. Ishlaringiz tugagach, rejimni
                o'chirishni unutmang.
              </div>
            </div>
          )}

          {/* Message editor */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <MessageSquare size={14} className="text-amber-600" />
              Foydalanuvchilarga ko'rsatiladigan xabar
            </label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder={DEFAULT_MAINTENANCE_MESSAGE}
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none text-sm transition-all"
            />

            {/* Preview */}
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase mb-2">
                <Eye size={11} />
                Foydalanuvchi ko'rinishi
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
                    <Wrench size={14} />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {previewMessage}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-400 font-medium">
                {maintenanceMessage.length}/300 · Bo'sh qoldirilsa standart xabar
              </p>
              <button
                type="button"
                onClick={saveMaintenanceMessage}
                disabled={maintenanceSaving || !messageChanged}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  messageChanged
                    ? "bg-gray-900 text-white hover:bg-black"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                } disabled:opacity-60`}
              >
                {maintenanceSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : maintenanceMsgSaved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {maintenanceMsgSaved
                  ? "Saqlandi"
                  : messageChanged
                  ? "Xabarni saqlash"
                  : "O'zgarishlar yo'q"}
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ============ DELIVERY PRICE ============ */}
      <Section
        icon={Truck}
        title="Yetkazib berish narxi"
        description="Buyurtma yakunida foydalanuvchidan olinadigan yetkazib berish to'lovi."
        accent="bg-gradient-to-br from-emerald-500 to-green-600 text-white"
        statusPill={
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            {savedDelivery === 0 ? "Bepul" : `${formatMoney(savedDelivery)} so'm`}
          </span>
        }
      >
        <form onSubmit={handleSaveDelivery} className="space-y-5">
          {/* Presets */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2.5">
              <Sparkles size={14} className="text-emerald-600" />
              Tez tanlash
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DELIVERY_PRESETS.map((preset) => {
                const active = deliverySumm === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDeliverySumm(preset.value)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-bold border-2 transition-all ${
                      active
                        ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {preset.label}
                    {preset.value > 0 && (
                      <span
                        className={`block text-[10px] mt-0.5 font-semibold ${
                          active ? "text-white/60" : "text-gray-400"
                        }`}
                      >
                        so'm
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
              <Banknote size={14} className="text-emerald-600" />
              Yoki aniq narxni kiriting
            </label>
            <div className="relative">
              <input
                type="number"
                value={deliverySumm}
                onChange={(e) => setDeliverySumm(Number(e.target.value))}
                className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 tabular-nums text-base font-bold transition-all"
                required
                min={0}
                step={1000}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">
                so'm
              </span>
            </div>
            {deliveryChanged && (
              <p className="mt-2 text-xs text-amber-700 flex items-center gap-1.5 font-medium">
                <Info size={12} />
                Yangi narx saqlanmagan
              </p>
            )}
          </div>

          {/* Info card */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <p className="text-xs text-blue-900 leading-relaxed">
              Yangi narx barcha yangi buyurtmalarga qo'llaniladi. Hozirgi
              yaratilgan buyurtmalar o'zgartirilmaydi.
            </p>
          </div>

          {/* Save button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            {deliverySaved && (
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
                <Check size={16} />
                Sozlamalar muvaffaqiyatli saqlandi!
              </div>
            )}
            <button
              type="submit"
              disabled={deliveryLoading || !deliveryChanged}
              className={`sm:ml-auto inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-xl transition-all ${
                deliveryChanged
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-sm"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              } disabled:opacity-60`}
            >
              {deliveryLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : deliverySaved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {deliverySaved
                ? "Saqlandi"
                : deliveryChanged
                ? "O'zgarishlarni saqlash"
                : "O'zgarishlar yo'q"}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
}
