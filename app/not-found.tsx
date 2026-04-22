import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <p className="text-6xl font-bold text-green-600">404</p>
      <h1 className="mt-4 text-center text-xl font-semibold text-gray-900">
        Sahifa topilmadi
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500">
        Manzil noto&apos;g&apos;ri yoki sahifa hali serverda yangilanmagan bo&apos;lishi
        mumkin. Buyurtma uchun havola:{" "}
        <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">
          /orders/[raqam]
        </code>{" "}
        (masalan: /orders/1)
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        Bosh sahifaga
      </Link>
    </div>
  );
}
