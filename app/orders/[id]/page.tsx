"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ProductItem {
  productId: string;
  name: string;
  price: number;
  count: number;
  photoUrl?: string | null;
  photos?: string[];
}

interface OrderDetail {
  id: number;
  orderId: string;
  fullName: string;
  contactNumber: string;
  address: string;
  summ: number;
  deliverySumm: number;
  productItems: ProductItem[];
}

function getItemImageSrc(item: ProductItem): string | null {
  const first = item.photoUrl ?? item.photos?.[0];
  if (!first) return null;
  const path = first.startsWith("/") ? first : `/ProductPhoto/${first}`;
  return `${API_BASE_URL}${path}`;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id =
    typeof idParam === "string"
      ? idParam
      : Array.isArray(idParam)
        ? idParam[0]
        : "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!id) {
      setError("Buyurtma tanlanmagan");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/order/me/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
      setError(null);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number } };
      if (ax.response?.status === 401) {
        router.push("/login");
        return;
      }
      if (ax.response?.status === 404) {
        setError("Buyurtma topilmadi");
      } else {
        setError("Yuklashda xatolik");
      }
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-gray-50 px-4">
        <p className="text-center text-gray-600">{error ?? "Ma&apos;lumot yo&apos;q"}</p>
        <Link
          href="/orders"
          className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
        >
          Buyurtmalarga qaytish
        </Link>
      </div>
    );
  }

  const total = order.summ + order.deliverySumm;

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-28">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link
            href="/orders"
            className="rounded-xl p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Orqaga"
          >
            <ArrowLeft size={22} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">
            Buyurtma #{order.id} — Tarkibi
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 text-sm text-gray-800">
          <p>
            <strong className="text-gray-900">Mijoz:</strong> {order.fullName}
          </p>
          <p className="mt-1">
            <strong className="text-gray-900">Tel:</strong> {order.contactNumber}
          </p>
          <p className="mt-1">
            <strong className="text-gray-900">Manzil:</strong> {order.address}
          </p>
        </div>

        <div className="space-y-3">
          {order.productItems?.map((item, idx) => {
            const src = getItemImageSrc(item);
            return (
              <div
                key={`${item.productId}-${idx}`}
                className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {src ? (
                    <img
                      src={src}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                      Rasm yo&apos;q
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    Narxi: {item.price.toLocaleString()} so&apos;m
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{item.count} ta</div>
                  <div className="text-sm font-semibold text-green-600">
                    {(item.price * item.count).toLocaleString()} so&apos;m
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white shadow-lg">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Yetkazib berish xizmati:{" "}
              <span className="font-medium text-gray-800">
                {order.deliverySumm.toLocaleString()} so&apos;m
              </span>
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              Jami to&apos;lanadigan: {total.toLocaleString()} so&apos;m
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Yopish
          </Link>
        </div>
      </div>
    </div>
  );
}
