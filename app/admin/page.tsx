"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  Users,
  Package,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  CheckCircle,
  Filter,
  LayoutGrid,
  ListOrdered,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from "recharts";

type AnalyticsViewTab = "overview" | "stats" | "charts";

interface DashboardStats {
  users: { total: number; today: number };
  orders: {
    total: number;
    today: number;
    week: number;
    month: number;
    new: number;
    accepted: number;
    onTheWay: number;
    delivered: number;
    cancelled: number;
  };
  revenue: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
  products: {
    total: number;
    active: number;
  };
}

interface SalesData {
  date?: string;
  week?: string;
  month?: string;
  orders: number;
  revenue: number;
  items: number;
}

interface TopProduct {
  productId: string;
  name: string;
  count: number;
  revenue: number;
  photoUrl: string | null;  // Backend hali photoUrl qaytaradi (analytics uchun)
}

interface OrderStatus {
  status: string;
  label: string;
  count: number;
}

interface PaymentType {
  type: string;
  label: string;
  count: number;
  revenue: number;
}

interface ProductSaleItem {
  productId: string;
  name: string;
  photoUrl: string | null;
  count: number;
  revenue: number;
  category: string;
}

interface DailySale {
  date: string;
  orders: number;
  items: number;
  revenue: number;
}

interface ProductSalesAnalytics {
  summary: {
    totalOrders: number;
    totalItems: number;
    totalRevenue: number;
    period: string;
  };
  products: ProductSaleItem[];
  daily: DailySale[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toLocaleString();
};

const formatFullCurrency = (value: number) => {
  return value.toLocaleString() + " so'm";
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailySales, setDailySales] = useState<SalesData[]>([]);
  const [monthlySales, setMonthlySales] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const [productSales, setProductSales] = useState<ProductSalesAnalytics | null>(null);
  const [productSalesPeriod, setProductSalesPeriod] = useState<"day" | "week" | "month" | "all">("all");
  const [productSalesLoading, setProductSalesLoading] = useState(false);
  const [viewTab, setViewTab] = useState<AnalyticsViewTab>("overview");
  const [userStatsPeriod, setUserStatsPeriod] = useState<"today" | "all">("all");

  const fetchProductSales = async (period: "day" | "week" | "month" | "all") => {
    try {
      setProductSalesLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/analytics/products/sales?period=${period}`);
      setProductSales(res.data);
    } catch (err) {
      console.error("Product sales fetch error:", err);
    } finally {
      setProductSalesLoading(false);
    }
  };

  const handleProductSalesPeriodChange = (period: "day" | "week" | "month" | "all") => {
    setProductSalesPeriod(period);
    fetchProductSales(period);
  };

  const fetchAllData = async () => {
    try {
      const [
        statsRes,
        dailyRes,
        monthlyRes,
        topProductsRes,
        orderStatusRes,
        paymentTypesRes,
        productSalesRes,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/analytics/dashboard`),
        axios.get(`${API_BASE_URL}/admin/analytics/sales/daily?days=14`),
        axios.get(`${API_BASE_URL}/admin/analytics/sales/monthly?months=6`),
        axios.get(`${API_BASE_URL}/admin/analytics/products/top?limit=5`),
        axios.get(`${API_BASE_URL}/admin/analytics/orders/status`),
        axios.get(`${API_BASE_URL}/admin/analytics/orders/payment-types`),
        axios.get(`${API_BASE_URL}/admin/analytics/products/sales?period=${productSalesPeriod}`),
      ]);

      setStats(statsRes.data);
      setDailySales(dailyRes.data);
      setMonthlySales(monthlyRes.data);
      setTopProducts(topProductsRes.data);
      setOrderStatuses(orderStatusRes.data);
      setPaymentTypes(paymentTypesRes.data);
      setProductSales(productSalesRes.data);
    } catch (err) {
      console.error("Analytics data fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Analitika yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const salesData = salesPeriod === "daily" ? dailySales : monthlySales;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm flex flex-col sm:flex-row sm:items-stretch gap-2">
        <div
          className="flex flex-1 min-w-0 flex-col gap-1.5 sm:grid sm:grid-cols-3"
          role="tablist"
          aria-label="Analitika bo'limlari"
        >
          {(
            [
              { id: "overview" as const, label: "Umumiy ko'rsatkichlar", icon: LayoutGrid },
              { id: "stats" as const, label: "Statistika", icon: ListOrdered },
              { id: "charts" as const, label: "Grafiklar", icon: LineChartIcon },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = viewTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setViewTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 sm:px-4 py-3 text-sm font-medium transition-all ${
                  active ? "bg-green-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden />
                <span className="text-center leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 shrink-0 sm:min-w-[7.5rem] font-medium text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Yangilash
        </button>
      </div>

      {viewTab === "overview" && (
        <div className="space-y-8">
          {/* To'langan savdo + Buyurtmalar vaqt bo'yicha */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-500/10" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 pb-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  To&apos;langan buyurtmalar
                </p>
                <div className="flex bg-slate-700/50 rounded-lg p-1 gap-1">
                  {(
                    [
                      { value: "day", label: "Bugun" },
                      { value: "week", label: "Hafta" },
                      { value: "month", label: "Oy" },
                      { value: "all", label: "Hammasi" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleProductSalesPeriodChange(item.value)}
                      disabled={productSalesLoading}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                        productSalesPeriod === item.value
                          ? "bg-emerald-500 text-white shadow-lg"
                          : "text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 pt-3">
                {productSalesLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl sm:text-3xl font-bold tabular-nums text-emerald-400">
                      {formatFullCurrency(productSales?.summary.totalRevenue || 0)}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm border-t border-slate-600/50 pt-4">
                      <div>
                        <dt className="text-slate-400 text-xs">Buyurtmalar</dt>
                        <dd className="font-semibold text-white tabular-nums">
                          {(productSales?.summary.totalOrders ?? 0).toLocaleString()} ta
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400 text-xs">Mahsulot donalari</dt>
                        <dd className="font-semibold text-white tabular-nums">
                          {(productSales?.summary.totalItems ?? 0).toLocaleString()} dona
                        </dd>
                      </div>
                    </dl>
                  </>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-50 shadow-sm">
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-violet-200/30" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 pb-0">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
                  Foydalanuvchilar
                </p>
                <div className="flex bg-violet-100 rounded-lg p-1 gap-1">
                  {(
                    [
                      { value: "today", label: "Bugun" },
                      { value: "all", label: "Hammasi" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setUserStatsPeriod(item.value)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        userStatsPeriod === item.value
                          ? "bg-violet-600 text-white shadow-lg"
                          : "text-violet-700 hover:bg-violet-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 pt-3">
                <p className="text-2xl sm:text-3xl font-bold tabular-nums text-violet-700">
                  {(userStatsPeriod === "today"
                    ? stats?.users.today ?? 0
                    : stats?.users.total ?? 0
                  ).toLocaleString()}
                  <span className="text-base font-medium text-violet-500 ml-1">nafar</span>
                </p>
                <p className="mt-2 text-sm text-violet-600/80">
                  {userStatsPeriod === "today"
                    ? "Bugun ro'yxatdan o'tgan yangi foydalanuvchilar"
                    : "Platformadagi barcha ro'yxatdan o'tgan foydalanuvchilar"}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm border-t border-violet-200 pt-4">
                  <div>
                    <dt className="text-violet-500 text-xs">Jami</dt>
                    <dd className="font-semibold text-violet-900 tabular-nums">
                      {(stats?.users.total ?? 0).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-violet-500 text-xs">Bugun qo&apos;shilgan</dt>
                    <dd className="font-semibold text-violet-900 tabular-nums">
                      +{(stats?.users.today ?? 0).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* Buyurtmalar — jami va holatlar */}
          <section aria-labelledby="overview-orders-heading" className="space-y-3">
            <h2 id="overview-orders-heading" className="text-sm font-semibold text-gray-900">
              Buyurtmalar va holatlar
            </h2>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 pb-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Jami (barcha holatlar)</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {(stats?.orders.total ?? 0).toLocaleString()}{" "}
                    <span className="text-sm font-medium text-gray-500">ta buyurtma</span>
                  </p>
                </div>
                <p className="text-xs text-gray-500 max-w-md">
                  Pastdagi raqamlar hozirgi kunda qaysi bosqichda ekanini ko&apos;rsatadi (bir buyurtma bitta
                  statusda hisoblanadi).
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 pt-4">
                {(
                  [
                    { label: "Yangi", sub: "Kutilmoqda", n: stats?.orders.new ?? 0, ring: "bg-orange-500", accent: "bg-orange-50 border-orange-100" },
                    { label: "Qabul qilindi", sub: "Tayyorlanmoqda", n: stats?.orders.accepted ?? 0, ring: "bg-amber-500", accent: "bg-amber-50/80 border-amber-100" },
                    { label: "Yo'lda", sub: "Yetkazilmoqda", n: stats?.orders.onTheWay ?? 0, ring: "bg-violet-500", accent: "bg-violet-50 border-violet-100" },
                    { label: "Yetkazildi", sub: "Muvaffaqiyatli", n: stats?.orders.delivered ?? 0, ring: "bg-green-500", accent: "bg-emerald-50 border-emerald-100" },
                    { label: "Bekor", sub: "Bekor qilindi", n: stats?.orders.cancelled ?? 0, ring: "bg-red-500", accent: "bg-red-50 border-red-100" },
                  ] as const
                ).map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-xl border p-3 text-center ${s.accent}`}
                  >
                    <div className="mx-auto flex h-2 w-2 justify-center" aria-hidden>
                      <span className={`inline-block h-2 w-2 rounded-full ${s.ring}`} />
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-700">{s.label}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{s.sub}</p>
                    <p className="mt-2 text-lg font-bold tabular-nums text-gray-900">{s.n}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Mahsulotlar */}
          <section aria-labelledby="overview-products-heading" className="space-y-3">
            <h2 id="overview-products-heading" className="text-sm font-semibold text-gray-900">
              Mahsulotlar katalogi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <Package className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Jami pozitsiyalar</p>
                    <p className="text-xs text-gray-500">Katalogdagi barcha mahsulot yozuvlari</p>
                  </div>
                </div>
                <p className="text-xl font-bold tabular-nums text-gray-900 shrink-0">
                  {(stats?.products.total ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <CheckCircle className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">Aktiv (sotuvda)</p>
                    <p className="text-xs text-gray-500">Hozir foydalanuvchiga ko&apos;rinadigan</p>
                  </div>
                </div>
                <p className="text-xl font-bold tabular-nums text-emerald-700 shrink-0">
                  {(stats?.products.active ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          {/* Eng ko'p sotilganlar */}
          <section aria-labelledby="overview-top-products-heading" className="space-y-3">
            <h2 id="overview-top-products-heading" className="text-sm font-semibold text-gray-900">
              Eng ko&apos;p sotilgan mahsulotlar
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              {topProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">Ma&apos;lumot yo&apos;q</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.count} dona sotildi</p>
                      </div>
                      <p className="text-sm font-semibold text-green-600 tabular-nums shrink-0">
                        {formatCurrency(product.revenue)} so&apos;m
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {viewTab === "stats" && (
        <div className="space-y-6">
      {/* To'langan Buyurtmalar Analitikasi */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header with Filter */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h3 className="text-gray-900 font-semibold">To&apos;langan Buyurtmalar</h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {[
                { value: "day", label: "Bugun" },
                { value: "week", label: "Hafta" },
                { value: "month", label: "Oy" },
                { value: "all", label: "Hammasi" },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleProductSalesPeriodChange(item.value as any)}
                  disabled={productSalesLoading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    productSalesPeriod === item.value
                      ? "bg-green-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-4 border-b border-gray-100 bg-green-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <Package className="w-4 h-4 text-green-600" />
            <span className="text-green-700 text-sm font-medium">Jami savdo:</span>
            <span className="text-gray-900 font-bold">{productSales?.summary.totalOrders || 0} ta</span>
            <span className="text-gray-400">·</span>
            <span className="text-green-600 font-bold">
              {formatFullCurrency(productSales?.summary.totalRevenue || 0)}
            </span>
          </div>
        </div>

        {/* Products List */}
        <div className="max-h-[300px] overflow-y-auto">
          {productSalesLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="text-gray-400 mt-2 text-sm">Yuklanmoqda...</p>
            </div>
          ) : productSales?.products.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              To&apos;langan buyurtmalar topilmadi
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {productSales?.products.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Product Image */}
                  <div className="relative flex-shrink-0">
                    {product.photoUrl ? (
                      <img
                        src={`${API_BASE_URL}${product.photoUrl.startsWith('/') ? '' : '/'}${product.photoUrl}`}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 text-sm font-medium truncate">{product.name}</p>
                    <p className="text-gray-500 text-xs">{product.category}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <span className="text-blue-600 font-bold">{product.count}</span>
                      <span className="text-gray-400 ml-1">ta</span>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <span className="text-green-600 font-bold">{formatCurrency(product.revenue)}</span>
                      <span className="text-gray-400 ml-1 text-xs">so&apos;m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Stats - Oxirgi 7 kun */}
        {productSales?.daily && productSales.daily.length > 0 && (
          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 text-sm font-medium">Oxirgi 7 kun</span>
            </div>
            <div className="space-y-2">
              {productSales.daily.slice(-7).map((day) => {
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString("uz-UZ", { day: "numeric", month: "short" });
                return (
                  <div
                    key={day.date}
                    className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <span className="text-gray-700 text-sm font-medium w-20">{dayName}</span>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-600 font-bold">{day.orders}</span>
                        <span className="text-gray-400">ta</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">{day.items}</span>
                        <span className="text-gray-400">dona</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-[100px] justify-end">
                        <span className="text-green-600 font-bold">{formatCurrency(day.revenue)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
        </div>
      )}

      {viewTab === "charts" && (
        <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Sotuvlar dinamikasi</h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSalesPeriod("daily")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                salesPeriod === "daily"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Kunlik
            </button>
            <button
              type="button"
              onClick={() => setSalesPeriod("monthly")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                salesPeriod === "monthly"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Oylik
            </button>
          </div>
        </div>
        <div className="h-72 min-h-[288px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey={salesPeriod === "daily" ? "date" : "month"}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (salesPeriod === "daily") {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }
                  return value;
                }}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                formatter={(value) => [formatFullCurrency(Number(value) || 0), "Daromad"]}
                labelFormatter={(label) => {
                  if (salesPeriod === "daily") {
                    return new Date(label).toLocaleDateString("uz-UZ");
                  }
                  return label;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Diagrammalar - Statuslar va To'lov turlari */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buyurtma Statuslari */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Buyurtma Statuslari</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={orderStatuses}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                  >
                    {orderStatuses.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {orderStatuses.map((status, index) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{status.label}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* To'lov Turlari */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">To'lov Turlari</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="label" type="category" width={60} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [formatFullCurrency(Number(value) || 0), "Daromad"]} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {paymentTypes.map((pt) => (
              <div key={pt.type} className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{pt.count}</p>
                <p className="text-xs text-gray-500">{pt.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
      )}

    </div>
  );
}