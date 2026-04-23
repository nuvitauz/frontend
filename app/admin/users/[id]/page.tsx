"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import {
  ArrowLeft,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  ShoppingBag,
  Bookmark,
  MessageSquare,
  ShoppingCart as CartIcon,
  Package,
  Loader2,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  CreditCard,
  User as BotIcon,
  Sparkles,
  RefreshCcw,
  Ban,
  Wallet,
  ChevronDown,
} from "lucide-react";

type TabId = "profile" | "orders" | "chats" | "saved" | "cart";
type UserStatus = "ACTIVE" | "NOCASH" | "BANNED";

const USER_STATUS_META: Record<
  UserStatus,
  {
    label: string;
    pill: string;
    chip: string;
    dot: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
  }
> = {
  ACTIVE: {
    label: "Faol",
    pill: "bg-white text-emerald-700",
    chip: "bg-green-100 text-green-700",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    description: "Foydalanuvchi saytdan to'liq foydalana oladi",
  },
  NOCASH: {
    label: "To'lov yo'q",
    pill: "bg-amber-400 text-white",
    chip: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    icon: Wallet,
    description: "Naqd to'lov ta'qiqlangan / to'lov muammosi",
  },
  BANNED: {
    label: "Bloklangan",
    pill: "bg-red-500 text-white",
    chip: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    icon: Ban,
    description: "Foydalanuvchi sayt xizmatlaridan bloklangan",
  },
};
const USER_STATUS_OPTIONS: UserStatus[] = ["ACTIVE", "NOCASH", "BANNED"];

interface UserDetail {
  id: number;
  number: string;
  userId: string | null;
  username: string | null;
  fullName: string | null;
  email: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  lang: string;
  profileComplete: boolean;
  role: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  orders: {
    id: number;
    orderId: string;
    summ: number;
    orderStatus: string;
    createdAt: string;
  }[];
  _count: { orders: number; savedProducts: number };
}

interface ProductItem {
  productId: string;
  name: string;
  price: number;
  count: number;
  photoUrl?: string | null;
  photos?: string[];
}

interface OrderFull {
  id: number;
  orderId: string;
  fullName: string;
  contactNumber: string;
  address: string;
  comment: string | null;
  count: number;
  summ: number;
  deliverySumm: number;
  productItems: ProductItem[];
  paymentType: string;
  paymentStatus: string;
  orderStatus: string;
  grade: number | null;
  createdAt: string;
}

interface ProductBrief {
  productId: string;
  name: string;
  price: number;
  photos: string[];
  category: string;
  isActive: boolean;
}

interface CartData {
  id: number | null;
  count: number;
  summ: number;
  items: {
    id: number;
    productId: string;
    productCount: number;
    product: ProductBrief;
  }[];
}

interface SavedItem {
  id: number;
  productId: string;
  createdAt: string;
  product: ProductBrief;
}

interface ChatSession {
  id: number;
  sessionId: string;
  userId: number | null;
  number: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ChatSessionFull extends ChatSession {
  messages: {
    id: number;
    role: "USER" | "ASSISTANT";
    content: string;
    createdAt: string;
  }[];
}

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Profil", icon: UserIcon },
  { id: "orders", label: "Buyurtmalar", icon: ShoppingBag },
  { id: "chats", label: "NuvitaAI chat", icon: MessageSquare },
  { id: "saved", label: "Saqlanganlar", icon: Bookmark },
  { id: "cart", label: "Savat", icon: CartIcon },
];

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatSumm = (n: number) => n.toLocaleString("uz-UZ") + " so'm";

const langText = (lang: string) => {
  switch (lang) {
    case "UZ":
      return "O'zbekcha";
    case "RU":
      return "Ruscha";
    case "EN":
      return "Inglizcha";
    default:
      return lang;
  }
};

const genderText = (g: string | null) => {
  if (!g) return "—";
  const low = g.toLowerCase();
  if (low === "male") return "Erkak";
  if (low === "female") return "Ayol";
  return g;
};

const orderStatusMeta = (status: string) => {
  switch (status) {
    case "NEW":
      return { label: "Yangi", cls: "bg-blue-100 text-blue-700", Icon: Clock };
    case "ACCEPTED":
      return { label: "Qabul qilindi", cls: "bg-amber-100 text-amber-700", Icon: CheckCircle2 };
    case "ON_THE_WAY":
      return { label: "Yo'lda", cls: "bg-violet-100 text-violet-700", Icon: Truck };
    case "DELIVERED":
      return { label: "Yetkazildi", cls: "bg-green-100 text-green-700", Icon: CheckCircle2 };
    case "CANCELLED":
      return { label: "Bekor qilindi", cls: "bg-red-100 text-red-700", Icon: XCircle };
    default:
      return { label: status, cls: "bg-gray-100 text-gray-700", Icon: Clock };
  }
};

const paymentStatusMeta = (status: string) => {
  switch (status) {
    case "PAID":
      return { label: "To'langan", cls: "bg-green-100 text-green-700" };
    case "PENDING":
      return { label: "Kutilmoqda", cls: "bg-amber-100 text-amber-700" };
    case "CANCELLED":
      return { label: "Bekor", cls: "bg-red-100 text-red-700" };
    default:
      return { label: status, cls: "bg-gray-100 text-gray-700" };
  }
};

const paymentTypeLabel = (type: string) => {
  switch (type) {
    case "CLICK":
      return "Click";
    case "PAYME":
      return "Payme";
    case "CASH":
      return "Naqd";
    default:
      return type;
  }
};

const photoUrl = (photo?: string | null) => {
  if (!photo) return null;
  return `${API_BASE_URL}${photo.startsWith("/") ? "" : "/"}${photo}`;
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = use(params);
  const userId = Number(idParam);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("profile");

  const [orders, setOrders] = useState<OrderFull[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const [cart, setCart] = useState<CartData | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  const [saved, setSaved] = useState<SavedItem[] | null>(null);
  const [savedLoading, setSavedLoading] = useState(false);

  const [chats, setChats] = useState<ChatSession[] | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [openedChat, setOpenedChat] = useState<ChatSessionFull | null>(null);
  const [openedChatLoading, setOpenedChatLoading] = useState(false);

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(userId)) {
      setError("Noto'g'ri foydalanuvchi IDsi");
      setLoading(false);
      return;
    }
    fetchUser();
  }, [userId]);

  useEffect(() => {
    if (!user) return;
    if (tab === "orders" && orders === null) loadOrders();
    if (tab === "cart" && cart === null) loadCart();
    if (tab === "saved" && saved === null) loadSaved();
    if (tab === "chats" && chats === null) loadChats();
  }, [tab, user]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get<UserDetail>(
        `${API_BASE_URL}/admin/users/${userId}`,
      );
      setUser(res.data);
    } catch (err) {
      console.error(err);
      setError("Foydalanuvchi ma'lumotlarini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      const res = await axios.get<OrderFull[]>(
        `${API_BASE_URL}/admin/users/${userId}/orders`,
      );
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      setCartLoading(true);
      const res = await axios.get<CartData>(
        `${API_BASE_URL}/admin/users/${userId}/cart`,
      );
      setCart(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCartLoading(false);
    }
  };

  const loadSaved = async () => {
    try {
      setSavedLoading(true);
      const res = await axios.get<SavedItem[]>(
        `${API_BASE_URL}/admin/users/${userId}/saved`,
      );
      setSaved(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSavedLoading(false);
    }
  };

  const loadChats = async () => {
    try {
      setChatsLoading(true);
      const res = await axios.get<ChatSession[]>(
        `${API_BASE_URL}/admin/users/${userId}/chats`,
      );
      setChats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setChatsLoading(false);
    }
  };

  const changeStatus = async (status: UserStatus) => {
    if (!user || status === user.status) {
      setStatusMenuOpen(false);
      return;
    }
    try {
      setStatusUpdating(true);
      await axios.patch(`${API_BASE_URL}/admin/users/${userId}/status`, {
        status,
      });
      setUser((u) => (u ? { ...u, status } : u));
      setStatusMenuOpen(false);
    } catch (err) {
      console.error(err);
      setError("Statusni yangilab bo'lmadi");
    } finally {
      setStatusUpdating(false);
    }
  };

  const openChat = async (sessionId: number) => {
    try {
      setOpenedChatLoading(true);
      const res = await axios.get<ChatSessionFull>(
        `${API_BASE_URL}/admin/users/${userId}/chats/${sessionId}`,
      );
      setOpenedChat(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOpenedChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Foydalanuvchilarga qaytish
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error || "Foydalanuvchi topilmadi"}
        </div>
      </div>
    );
  }

  const initials = (user.fullName || user.number).slice(0, 2).toUpperCase();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Foydalanuvchilar
        </Link>
        <button
          onClick={fetchUser}
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Yangilash
        </button>
      </div>

      {/* User header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-2xl font-bold ring-2 ring-white/30">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {user.fullName || "Ism kiritilmagan"}
            </h1>
            <p className="text-sm text-emerald-50 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>ID: #{user.id}</span>
              <span className="hidden sm:inline">•</span>
              <span>{user.number}</span>
              {user.username && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span>@{user.username}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <StatusSelector
              current={user.status}
              open={statusMenuOpen}
              updating={statusUpdating}
              onToggle={() => setStatusMenuOpen((o) => !o)}
              onSelect={changeStatus}
              onClose={() => setStatusMenuOpen(false)}
            />
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
                user.profileComplete ? "bg-white text-emerald-700" : "bg-amber-400 text-white"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  user.profileComplete ? "bg-emerald-500" : "bg-white"
                }`}
              />
              {user.profileComplete ? "Profil to'liq" : "Profil to'liq emas"}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 font-medium">
              {user.role}
            </span>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-emerald-100">Buyurtmalar</p>
            <p className="text-lg font-bold mt-0.5">{user._count.orders}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-emerald-100">Saqlangan</p>
            <p className="text-lg font-bold mt-0.5">{user._count.savedProducts}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-emerald-100">Til</p>
            <p className="text-sm font-bold mt-1">{langText(user.lang)}</p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-emerald-100">Ro&apos;yxat</p>
            <p className="text-sm font-bold mt-1">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm grid grid-cols-2 sm:grid-cols-5 gap-1.5"
        role="tablist"
        aria-label="Foydalanuvchi bo'limlari"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium transition-all ${
                active ? "bg-green-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "profile" && <ProfileTab user={user} />}
      {tab === "orders" && (
        <OrdersTab
          orders={orders}
          loading={ordersLoading}
          expanded={expandedOrder}
          onToggleExpand={(id) => setExpandedOrder((p) => (p === id ? null : id))}
        />
      )}
      {tab === "chats" && (
        <ChatsTab
          sessions={chats}
          loading={chatsLoading}
          opened={openedChat}
          openedLoading={openedChatLoading}
          onOpen={openChat}
          onClose={() => setOpenedChat(null)}
        />
      )}
      {tab === "saved" && <SavedTab items={saved} loading={savedLoading} />}
      {tab === "cart" && <CartTab cart={cart} loading={cartLoading} />}
    </div>
  );
}

// ================== Sub-components ==================

function StatusSelector({
  current,
  open,
  updating,
  onToggle,
  onSelect,
  onClose,
}: {
  current: UserStatus;
  open: boolean;
  updating: boolean;
  onToggle: () => void;
  onSelect: (status: UserStatus) => void;
  onClose: () => void;
}) {
  const meta = USER_STATUS_META[current];
  const Icon = meta.icon;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={updating}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium shadow-sm transition-all hover:brightness-95 disabled:opacity-60 ${meta.pill}`}
      >
        {updating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Icon className="w-3 h-3" />
        )}
        {meta.label}
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={onClose}
            aria-label="Yopish"
          />
          <div className="absolute z-50 top-full mt-1 right-0 w-56 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden text-gray-800">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                Statusni o&apos;zgartirish
              </p>
            </div>
            {USER_STATUS_OPTIONS.map((opt) => {
              const o = USER_STATUS_META[opt];
              const OIcon = o.icon;
              const isCurrent = opt === current;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => onSelect(opt)}
                  className={`w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                    isCurrent ? "opacity-60 cursor-default" : ""
                  }`}
                >
                  <span
                    className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${o.dot}`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <OIcon className="w-3.5 h-3.5" />
                      {o.label}
                      {isCurrent && (
                        <span className="ml-auto text-[10px] text-gray-400">
                          hozir
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-gray-500 leading-snug mt-0.5">
                      {o.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: UserDetail }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <InfoCard
        icon={Phone}
        label="Telefon raqami"
        value={user.number}
        accent="bg-green-100 text-green-700"
      />
      <InfoCard
        icon={Mail}
        label="Email"
        value={user.email || "—"}
        accent="bg-blue-100 text-blue-700"
      />
      <InfoCard
        icon={MapPin}
        label="Manzil"
        value={user.address || "—"}
        accent="bg-red-100 text-red-700"
      />
      <InfoCard
        icon={Calendar}
        label="Tug'ilgan sana"
        value={user.dateOfBirth ? formatDate(user.dateOfBirth) : "—"}
        accent="bg-purple-100 text-purple-700"
      />
      <InfoCard
        icon={UserIcon}
        label="Jins"
        value={genderText(user.gender)}
        accent="bg-pink-100 text-pink-700"
      />
      <InfoCard
        icon={Globe}
        label="Til"
        value={langText(user.lang)}
        accent="bg-orange-100 text-orange-700"
      />

      <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Hisob ma&apos;lumotlari</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500">Ichki ID</dt>
            <dd className="font-medium text-gray-900">#{user.id}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">User ID</dt>
            <dd className="font-medium text-gray-900 truncate">{user.userId || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Status</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${USER_STATUS_META[user.status].chip}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${USER_STATUS_META[user.status].dot}`}
                />
                {USER_STATUS_META[user.status].label}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Ro&apos;yxatdan o&apos;tgan</dt>
            <dd className="font-medium text-gray-900">{formatDateTime(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Yangilangan</dt>
            <dd className="font-medium text-gray-900">{formatDateTime(user.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function OrdersTab({
  orders,
  loading,
  expanded,
  onToggleExpand,
}: {
  orders: OrderFull[] | null;
  loading: boolean;
  expanded: number | null;
  onToggleExpand: (id: number) => void;
}) {
  if (loading || orders === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Buyurtmalar topilmadi"
        description="Bu foydalanuvchi hozircha buyurtma bermagan."
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = orderStatusMeta(order.orderStatus);
        const payment = paymentStatusMeta(order.paymentStatus);
        const StatusIcon = status.Icon;
        const isOpen = expanded === order.id;
        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() => onToggleExpand(order.id)}
              className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    #{order.orderId.slice(0, 8)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.cls}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${payment.cls}`}
                  >
                    <CreditCard className="w-3 h-3" />
                    {payment.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(order.createdAt)} • {order.count} dona
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-gray-900 tabular-nums">
                  {formatSumm(order.summ)}
                </p>
                <p className="text-xs text-gray-500">
                  {paymentTypeLabel(order.paymentType)} • Yetk: {formatSumm(order.deliverySumm)}
                </p>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Qabul qiluvchi</p>
                    <p className="font-medium text-gray-900">{order.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telefon</p>
                    <p className="font-medium text-gray-900">{order.contactNumber}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Manzil</p>
                    <p className="font-medium text-gray-900">{order.address}</p>
                  </div>
                  {order.comment && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-500">Izoh</p>
                      <p className="text-gray-800">{order.comment}</p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Mahsulotlar ({order.productItems?.length ?? 0} ta)
                  </p>
                  <div className="space-y-2">
                    {(order.productItems || []).map((item, idx) => {
                      const p = photoUrl(item.photoUrl || item.photos?.[0]);
                      return (
                        <div
                          key={`${order.id}-${idx}`}
                          className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-100"
                        >
                          {p ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.count} × {formatSumm(item.price)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-green-700 tabular-nums">
                            {formatSumm(item.price * item.count)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CartTab({ cart, loading }: { cart: CartData | null; loading: boolean }) {
  if (loading || cart === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <EmptyState
        icon={CartIcon}
        title="Savat bo'sh"
        description="Foydalanuvchining savatida hozircha mahsulot yo'q."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Savat jami</p>
          <p className="text-xl font-bold text-gray-900 tabular-nums">
            {formatSumm(cart.summ)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CartIcon className="w-4 h-4 text-green-600" />
          {cart.items.length} pozitsiya • {cart.count} dona
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {cart.items.map((item) => {
          const p = photoUrl(item.product.photos?.[0]);
          return (
            <div key={item.id} className="flex items-center gap-3 p-3 sm:p-4">
              {p ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p}
                  alt={item.product.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {item.product.category} • {item.productCount} dona
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900 tabular-nums">
                  {formatSumm(item.product.price * item.productCount)}
                </p>
                <p className="text-[11px] text-gray-500">
                  {formatSumm(item.product.price)}/dona
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavedTab({ items, loading }: { items: SavedItem[] | null; loading: boolean }) {
  if (loading || items === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="Saqlangan mahsulotlar yo'q"
        description="Foydalanuvchi hech qaysi mahsulotni saqlamagan."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => {
        const p = photoUrl(item.product.photos?.[0]);
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex"
          >
            <div className="w-24 shrink-0 bg-gray-50">
              {p ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 p-3 min-w-0">
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                {item.product.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">{item.product.category}</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-sm font-bold text-green-700 tabular-nums">
                  {formatSumm(item.product.price)}
                </p>
                {!item.product.isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">
                    Arxiv
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Saqlandi: {formatDate(item.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChatsTab({
  sessions,
  loading,
  opened,
  openedLoading,
  onOpen,
  onClose,
}: {
  sessions: ChatSession[] | null;
  loading: boolean;
  opened: ChatSessionFull | null;
  openedLoading: boolean;
  onOpen: (sessionId: number) => void;
  onClose: () => void;
}) {
  if (loading || sessions === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Chat yozishmalari topilmadi"
        description="Foydalanuvchi NuvitaAI bilan hali suhbatlashmagan."
      />
    );
  }

  return (
    <>
      <div className="space-y-2">
        {sessions.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpen(s.id)}
            className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:border-green-200 hover:bg-green-50/30 transition-colors flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Sessiya #{s.id}
                {s.isActive && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
                    <span className="w-1 h-1 rounded-full bg-green-500" />
                    Faol
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {s._count.messages} ta xabar
                {s.number ? ` • ${s.number}` : ""} • {formatDateTime(s.createdAt)}
                {s.updatedAt && s.updatedAt !== s.createdAt
                  ? ` — oxirgi: ${formatDateTime(s.updatedAt)}`
                  : ""}
              </p>
            </div>
            <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
          </button>
        ))}
      </div>

      {(opened || openedLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    NuvitaAI sessiya {opened ? `#${opened.id}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {opened ? formatDateTime(opened.createdAt) : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Yopish"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
              {openedLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                </div>
              )}
              {opened?.messages.length === 0 && !openedLoading && (
                <p className="text-center text-gray-500 text-sm py-8">
                  Xabarlar topilmadi
                </p>
              )}
              {opened?.messages.map((m) => {
                const isUser = m.role === "USER";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap shadow-sm ${
                        isUser
                          ? "bg-green-500 text-white rounded-tr-sm"
                          : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                      }`}
                    >
                      {m.content}
                      <p
                        className={`text-[10px] mt-1 ${
                          isUser ? "text-green-100" : "text-gray-400"
                        }`}
                      >
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                    {isUser && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                        <BotIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}
