"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  X,
  Phone,
  MapPin,
  User as UserIcon,
  CreditCard,
  MessageSquare,
  Star,
  Eye,
  UserCheck,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";

// ======================= Types =======================
type OrderStatus = "NEW" | "ACCEPTED" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED";

interface OrderProductItem {
  productId: string;
  name: string;
  price: number;
  count: number;
  photoUrl?: string;
}

interface Order {
  id: number;
  orderId: string;
  fullName: string;
  contactNumber: string;
  address: string;
  comment?: string;
  summ: number;
  deliverySumm: number;
  paymentType: string;
  paymentStatus: string;
  orderStatus: OrderStatus;
  createdAt: string;
  grade?: number;
  courierUserId?: number;
  productItems: OrderProductItem[];
}

interface Staff {
  id: number;
  fullName: string;
  role: string;
}

// ======================= Status Meta =======================
const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    short: string;
    icon: any;
    pill: string;
    dot: string;
    tint: string;
  }
> = {
  NEW: {
    label: "Yangi",
    short: "Yangi",
    icon: Clock,
    pill: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    tint: "from-blue-500 to-blue-600",
  },
  ACCEPTED: {
    label: "Qabul qilingan",
    short: "Qabul",
    icon: Package,
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    tint: "from-indigo-500 to-indigo-600",
  },
  ON_THE_WAY: {
    label: "Yo'lda",
    short: "Yo'lda",
    icon: Truck,
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    tint: "from-amber-500 to-orange-600",
  },
  DELIVERED: {
    label: "Yetkazilgan",
    short: "Yetkazildi",
    icon: CheckCircle2,
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    tint: "from-emerald-500 to-green-600",
  },
  CANCELLED: {
    label: "Bekor qilingan",
    short: "Bekor",
    icon: XCircle,
    pill: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    tint: "from-red-500 to-rose-600",
  },
};

const PAYMENT_META: Record<string, { label: string; color: string }> = {
  CASH: { label: "Naqd", color: "bg-green-50 text-green-700 border-green-200" },
  CLICK: { label: "Click", color: "bg-sky-50 text-sky-700 border-sky-200" },
  PAYME: {
    label: "Payme",
    color: "bg-violet-50 text-violet-700 border-violet-200",
  },
};

// ======================= Helpers =======================
function formatMoney(n: number) {
  return n.toLocaleString("uz-UZ");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
}

// ======================= StatCard =======================
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  tint: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${tint} opacity-10`}
      />
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {sub && (
            <p className="mt-1 text-[11px] text-gray-400 font-medium">{sub}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${accent}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

// ======================= Main Page =======================
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">(
    "all",
  );
  const [view, setView] = useState<"cards" | "compact">("cards");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Inline courier selection per order (for NEW orders)
  const [courierDrafts, setCourierDrafts] = useState<Record<number, number>>({});

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [ordersRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/order/admin`),
        axios.get(`${API_BASE_URL}/admin/staff`),
      ]);

      setOrders(ordersRes.data);
      setCouriers(
        (staffRes.data || []).filter((s: Staff) => s.role === "COURIER"),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== Stats =====
  const stats = useMemo(() => {
    const byStatus: Record<OrderStatus, number> = {
      NEW: 0,
      ACCEPTED: 0,
      ON_THE_WAY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    let revenue = 0;
    for (const o of orders) {
      byStatus[o.orderStatus]++;
      if (o.orderStatus === "DELIVERED") {
        revenue += (o.summ || 0) + (o.deliverySumm || 0);
      }
    }
    return {
      total: orders.length,
      ...byStatus,
      revenue,
    };
  }, [orders]);

  // ===== Filter =====
  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.orderStatus !== statusFilter) return false;
      if (paymentFilter !== "ALL" && o.paymentType !== paymentFilter) return false;

      if (dateFilter !== "all") {
        const age = now - new Date(o.createdAt).getTime();
        const max =
          dateFilter === "today" ? day : dateFilter === "week" ? 7 * day : 30 * day;
        if (age > max) return false;
      }

      if (search) {
        const q = search.trim().toLowerCase();
        const hay = `${o.id} ${o.orderId} ${o.fullName} ${o.contactNumber} ${o.address}`
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, statusFilter, paymentFilter, dateFilter, search]);

  // ===== Actions =====
  const updateOrder = async (
    orderId: string,
    body: { orderStatus?: OrderStatus; courierUserId?: number },
  ) => {
    try {
      setSavingId(orderId);
      await axios.patch(`${API_BASE_URL}/order/admin/${orderId}`, body);
      await fetchData(true);
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi");
    } finally {
      setSavingId(null);
    }
  };

  const acceptOrder = (order: Order) => {
    const courierId = courierDrafts[order.id];
    if (!courierId) {
      alert("Avval kuryer tanlang");
      return;
    }
    updateOrder(order.orderId, {
      orderStatus: "ACCEPTED",
      courierUserId: courierId,
    });
  };

  const changeStatus = (order: Order, status: OrderStatus) => {
    if (status === "CANCELLED") {
      if (!confirm(`Buyurtma #${order.id} ni bekor qilmoqchimisiz?`)) return;
    }
    updateOrder(order.orderId, { orderStatus: status });
  };

  const nextStatusFor = (s: OrderStatus): OrderStatus | null => {
    if (s === "ACCEPTED") return "ON_THE_WAY";
    if (s === "ON_THE_WAY") return "DELIVERED";
    return null;
  };

  // ======================= Render =======================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-emerald-500" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============ HEADER ============ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
            <ShoppingBag className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Buyurtmalar</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Barcha buyurtmalarni boshqaring va kuryerlar tayinlang
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl font-semibold border border-gray-200 shadow-sm transition-colors disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Yangilash
        </button>
      </div>

      {/* ============ STATS ============ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={ShoppingBag}
          label="Jami"
          value={stats.total}
          tint="from-slate-500 to-slate-700"
          accent="bg-slate-50 text-slate-600"
        />
        <StatCard
          icon={Clock}
          label="Yangi"
          value={stats.NEW}
          tint="from-blue-500 to-blue-600"
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Package}
          label="Qabul"
          value={stats.ACCEPTED}
          tint="from-indigo-500 to-indigo-600"
          accent="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={Truck}
          label="Yo'lda"
          value={stats.ON_THE_WAY}
          tint="from-amber-500 to-orange-600"
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Yetkazilgan"
          value={stats.DELIVERED}
          tint="from-emerald-500 to-green-600"
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Daromad"
          value={`${formatMoney(stats.revenue)}`}
          sub="so'm · yetkazilgan"
          tint="from-green-500 to-teal-600"
          accent="bg-green-50 text-green-600"
        />
      </div>

      {/* ============ TOOLBAR ============ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 space-y-3">
        {/* Top row: Search + view */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mijoz, telefon, ID yoki manzil bo'yicha qidirish..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setView("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                view === "cards"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <LayoutGrid size={14} />
              Kartochka
            </button>
            <button
              onClick={() => setView("compact")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                view === "compact"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ListIcon size={14} />
              Ro'yxat
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {(["ALL", "NEW", "ACCEPTED", "ON_THE_WAY", "DELIVERED", "CANCELLED"] as const).map(
            (s) => {
              const active = statusFilter === s;
              const count =
                s === "ALL" ? orders.length : stats[s as OrderStatus];
              const meta = s === "ALL" ? null : STATUS_META[s as OrderStatus];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    active
                      ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {meta && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${
                        active ? "opacity-80" : ""
                      }`}
                    />
                  )}
                  <span>{s === "ALL" ? "Barchasi" : meta!.short}</span>
                  <span
                    className={`px-1.5 rounded-md text-[10px] ${
                      active ? "bg-white/20" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            },
          )}
        </div>

        {/* Secondary filters */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            <span className="text-[11px] text-gray-500 font-semibold">Sana:</span>
            {(["all", "today", "week", "month"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  dateFilter === d
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {d === "all"
                  ? "Barchasi"
                  : d === "today"
                  ? "Bugun"
                  : d === "week"
                  ? "7 kun"
                  : "30 kun"}
              </button>
            ))}
          </div>

          <div className="w-px bg-gray-200 mx-1" />

          <div className="flex items-center gap-1.5">
            <CreditCard size={13} className="text-gray-400" />
            <span className="text-[11px] text-gray-500 font-semibold">To'lov:</span>
            {["ALL", "CASH", "CLICK", "PAYME"].map((p) => (
              <button
                key={p}
                onClick={() => setPaymentFilter(p)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  paymentFilter === p
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {p === "ALL" ? "Barchasi" : PAYMENT_META[p]?.label || p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============ ORDERS LIST ============ */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
            <ShoppingBag className="text-gray-400" size={28} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Buyurtmalar topilmadi
          </h3>
          <p className="text-gray-500 text-sm">
            Filtrlarni o'zgartirib ko'ring yoki boshqa kalit so'z kiriting
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              couriers={couriers}
              draftCourier={courierDrafts[order.id]}
              onDraftCourier={(id) =>
                setCourierDrafts((d) => ({ ...d, [order.id]: id }))
              }
              onAccept={() => acceptOrder(order)}
              onCancel={() => changeStatus(order, "CANCELLED")}
              onNextStatus={() => {
                const next = nextStatusFor(order.orderStatus);
                if (next) changeStatus(order, next);
              }}
              onView={() => setSelectedOrder(order)}
              saving={savingId === order.orderId}
            />
          ))}
        </div>
      ) : (
        <CompactList
          orders={filteredOrders}
          onView={(o) => setSelectedOrder(o)}
          couriers={couriers}
        />
      )}

      {/* ============ DETAIL MODAL ============ */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          couriers={couriers}
          onClose={() => setSelectedOrder(null)}
          onChangeStatus={(s) => {
            changeStatus(selectedOrder, s);
            setSelectedOrder(null);
          }}
          onAssignCourier={(courierId) => {
            updateOrder(selectedOrder.orderId, {
              orderStatus: "ACCEPTED",
              courierUserId: courierId,
            });
            setSelectedOrder(null);
          }}
          saving={savingId === selectedOrder.orderId}
        />
      )}
    </div>
  );
}

// ======================= Order Card =======================
function OrderCard({
  order,
  couriers,
  draftCourier,
  onDraftCourier,
  onAccept,
  onCancel,
  onNextStatus,
  onView,
  saving,
}: {
  order: Order;
  couriers: Staff[];
  draftCourier?: number;
  onDraftCourier: (id: number) => void;
  onAccept: () => void;
  onCancel: () => void;
  onNextStatus: () => void;
  onView: () => void;
  saving: boolean;
}) {
  const meta = STATUS_META[order.orderStatus];
  const StatusIcon = meta.icon;
  const total = order.summ + order.deliverySumm;
  const paymentMeta =
    PAYMENT_META[order.paymentType] || {
      label: order.paymentType,
      color: "bg-gray-50 text-gray-700 border-gray-200",
    };
  const courier = couriers.find((c) => c.id === order.courierUserId);
  const nextStatus = order.orderStatus === "ACCEPTED" || order.orderStatus === "ON_THE_WAY";

  return (
    <div
      className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${
        order.orderStatus === "NEW"
          ? "border-blue-200 ring-1 ring-blue-100"
          : "border-gray-100"
      }`}
    >
      {/* status accent strip */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${meta.tint}`}
      />

      <div className="p-4 sm:p-5 pl-5 sm:pl-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${meta.tint}`}>
              <StatusIcon className="text-white" size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900">#{order.id}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${meta.pill}`}
                >
                  {meta.short}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentMeta.color}`}
                >
                  <CreditCard size={10} />
                  {paymentMeta.label}
                </span>
                {order.grade && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Star size={10} fill="currentColor" />
                    {order.grade}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400 font-medium">
                {formatDate(order.createdAt)} · {formatTime(order.createdAt)} ·{" "}
                {timeAgo(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between gap-1">
            <p className="text-[11px] text-gray-500 font-semibold uppercase">
              Jami
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatMoney(total)}{" "}
              <span className="text-xs font-semibold text-gray-500">so'm</span>
            </p>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <InfoRow icon={UserIcon} label="Mijoz" value={order.fullName} />
          <InfoRow
            icon={Phone}
            label="Telefon"
            value={order.contactNumber}
            href={`tel:${order.contactNumber}`}
          />
          <InfoRow
            icon={MapPin}
            label="Manzil"
            value={order.address}
            className="sm:col-span-2"
          />
          {order.comment && (
            <InfoRow
              icon={MessageSquare}
              label="Izoh"
              value={order.comment}
              className="sm:col-span-2"
              accent
            />
          )}
        </div>

        {/* Products mini */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-[11px] font-semibold text-gray-500 uppercase">
            Mahsulotlar:
          </span>
          <div className="flex items-center gap-1.5 flex-1 flex-wrap">
            {order.productItems.slice(0, 3).map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5"
              >
                <span className="font-medium text-gray-700">{item.name}</span>
                <span className="text-gray-400">×{item.count}</span>
              </span>
            ))}
            {order.productItems.length > 3 && (
              <span className="text-xs font-semibold text-gray-500">
                +{order.productItems.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Courier line (for non-new) */}
        {courier && order.orderStatus !== "NEW" && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm">
            <UserCheck size={15} className="text-indigo-500" />
            <span className="text-gray-600">Kuryer:</span>
            <span className="font-semibold text-gray-900">{courier.fullName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
          {order.orderStatus === "NEW" ? (
            <>
              <div className="relative flex-1">
                <select
                  value={draftCourier || ""}
                  onChange={(e) => onDraftCourier(Number(e.target.value))}
                  className="w-full appearance-none pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
                >
                  <option value="" disabled>
                    Kuryer tanlang...
                  </option>
                  {couriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
                <UserCheck
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <button
                onClick={onAccept}
                disabled={saving || !draftCourier}
                className="sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                Qabul qilish
              </button>
              <button
                onClick={onCancel}
                disabled={saving}
                className="sm:w-auto bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle size={15} />
                Bekor qilish
              </button>
              <button
                onClick={onView}
                className="sm:w-auto bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Eye size={15} />
                Batafsil
              </button>
            </>
          ) : (
            <>
              {nextStatus && (
                <button
                  onClick={onNextStatus}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : order.orderStatus === "ACCEPTED" ? (
                    <>
                      <Truck size={15} /> Yo'lga chiqarish
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Yetkazilgan deb belgilash
                    </>
                  )}
                </button>
              )}
              <button
                onClick={onView}
                className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Eye size={15} />
                Batafsil ko'rish
              </button>
              {order.orderStatus !== "DELIVERED" && order.orderStatus !== "CANCELLED" && (
                <button
                  onClick={onCancel}
                  disabled={saving}
                  className="sm:w-auto bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle size={15} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ======================= InfoRow =======================
function InfoRow({
  icon: Icon,
  label,
  value,
  href,
  className = "",
  accent = false,
}: {
  icon: any;
  label: string;
  value: string;
  href?: string;
  className?: string;
  accent?: boolean;
}) {
  const content = (
    <div
      className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
        accent
          ? "bg-amber-50/50 border-amber-100"
          : "bg-gray-50/50 border-gray-100"
      } ${className}`}
    >
      <div
        className={`p-1.5 rounded-lg ${
          accent ? "bg-amber-100 text-amber-700" : "bg-white text-gray-500"
        }`}
      >
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-800 break-words">
          {value || "—"}
        </p>
      </div>
    </div>
  );
  if (href) return <a href={href}>{content}</a>;
  return content;
}

// ======================= Compact List =======================
function CompactList({
  orders,
  onView,
  couriers,
}: {
  orders: Order[];
  onView: (o: Order) => void;
  couriers: Staff[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                #ID
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Mijoz
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Mahsulot
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Summa
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Kuryer
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Sana
              </th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => {
              const meta = STATUS_META[o.orderStatus];
              const courier = couriers.find((c) => c.id === o.courierUserId);
              return (
                <tr
                  key={o.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onView(o)}
                >
                  <td className="px-4 py-3 font-bold text-gray-900">
                    #{o.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 text-sm">
                      {o.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {o.contactNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${meta.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.short}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {o.productItems.length} ta
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                    {formatMoney(o.summ + o.deliverySumm)}{" "}
                    <span className="text-xs text-gray-500 font-semibold">
                      so'm
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {courier ? courier.fullName : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(o.createdAt)}
                    <div className="text-[10px] text-gray-400">
                      {formatTime(o.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Eye size={16} className="text-gray-400" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ======================= Detail Modal =======================
function OrderDetailModal({
  order,
  couriers,
  onClose,
  onChangeStatus,
  onAssignCourier,
  saving,
}: {
  order: Order;
  couriers: Staff[];
  onClose: () => void;
  onChangeStatus: (s: OrderStatus) => void;
  onAssignCourier: (courierId: number) => void;
  saving: boolean;
}) {
  const meta = STATUS_META[order.orderStatus];
  const StatusIcon = meta.icon;
  const total = order.summ + order.deliverySumm;
  const paymentMeta =
    PAYMENT_META[order.paymentType] || {
      label: order.paymentType,
      color: "bg-gray-50 text-gray-700 border-gray-200",
    };
  const courier = couriers.find((c) => c.id === order.courierUserId);

  const [newCourierId, setNewCourierId] = useState<number | undefined>(
    order.courierUserId,
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-3xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div
          className={`relative p-5 sm:p-6 bg-gradient-to-br ${meta.tint} text-white overflow-hidden`}
        >
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur">
                <StatusIcon className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Buyurtma #{order.id}</h2>
                <p className="text-sm text-white/80">
                  {meta.label} · {formatDate(order.createdAt)}{" "}
                  {formatTime(order.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Customer info */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <UserIcon size={12} /> Mijoz ma'lumotlari
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <InfoRow icon={UserIcon} label="Mijoz" value={order.fullName} />
              <InfoRow
                icon={Phone}
                label="Telefon"
                value={order.contactNumber}
                href={`tel:${order.contactNumber}`}
              />
              <InfoRow
                icon={MapPin}
                label="Manzil"
                value={order.address}
                className="sm:col-span-2"
              />
              {order.comment && (
                <InfoRow
                  icon={MessageSquare}
                  label="Mijoz izohi"
                  value={order.comment}
                  className="sm:col-span-2"
                  accent
                />
              )}
            </div>
          </section>

          {/* Products */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Package size={12} /> Mahsulotlar ({order.productItems.length}{" "}
              ta)
            </h3>
            <div className="space-y-2">
              {order.productItems.map((item, idx) => {
                const imgUrl = item.photoUrl
                  ? item.photoUrl.startsWith("/")
                    ? item.photoUrl
                    : `/ProductPhoto/${item.photoUrl}`
                  : null;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-gray-50/50 border border-gray-100 rounded-xl p-3"
                  >
                    {imgUrl ? (
                      <img
                        src={`${API_BASE_URL}${imgUrl}`}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-100 bg-white flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatMoney(item.price)} so'm × {item.count}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 whitespace-nowrap text-sm">
                        {formatMoney(item.price * item.count)}{" "}
                        <span className="text-[10px] text-gray-500">so'm</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Summary */}
          <section className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-100">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Mahsulotlar:</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(order.summ)} so'm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Yetkazib berish:</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(order.deliverySumm)} so'm
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">To'lov turi:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentMeta.color}`}
                >
                  <CreditCard size={10} />
                  {paymentMeta.label}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-semibold text-gray-700">
                  Jami to'lov:
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatMoney(total)}{" "}
                  <span className="text-sm font-semibold text-gray-500">
                    so'm
                  </span>
                </span>
              </div>
            </div>
          </section>

          {/* Courier assign */}
          {order.orderStatus !== "CANCELLED" && order.orderStatus !== "DELIVERED" && (
            <section>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <UserCheck size={12} /> Kuryer tayinlash
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <select
                    value={newCourierId || ""}
                    onChange={(e) => setNewCourierId(Number(e.target.value))}
                    className="w-full appearance-none pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="" disabled>
                      Kuryer tanlang...
                    </option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                  <UserCheck
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                <button
                  disabled={!newCourierId || saving}
                  onClick={() => newCourierId && onAssignCourier(newCourierId)}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <UserCheck size={15} />
                  )}
                  {courier ? "O'zgartirish" : "Tayinlash"}
                </button>
              </div>
              {courier && (
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  Joriy kuryer:{" "}
                  <span className="font-semibold text-gray-700">
                    {courier.fullName}
                  </span>
                </p>
              )}
            </section>
          )}

          {/* Status actions */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Status o'zgartirish
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["ACCEPTED", "ON_THE_WAY", "DELIVERED", "CANCELLED"] as OrderStatus[]).map(
                (s) => {
                  const sm = STATUS_META[s];
                  const Icon = sm.icon;
                  const active = order.orderStatus === s;
                  const isCancel = s === "CANCELLED";
                  return (
                    <button
                      key={s}
                      disabled={active || saving}
                      onClick={() => onChangeStatus(s)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        active
                          ? "border-gray-900 bg-gray-900 text-white cursor-not-allowed"
                          : isCancel
                          ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50"
                      } disabled:opacity-100`}
                    >
                      <Icon size={16} />
                      <p className="mt-1.5 font-semibold text-xs">{sm.short}</p>
                    </button>
                  );
                },
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
