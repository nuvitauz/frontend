"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import NuvitaChat from "@/components/NuvitaChat";
import { MaintenanceGate } from "@/components/MaintenanceGate";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/selected" ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/orders" ||
    pathname.startsWith("/orders/");

  return (
    <MaintenanceGate>
      {!hideChrome && <Header />}
      <main className="flex-1">{children}</main>
      {!hideChrome && <FloatingCart />}
      {!hideChrome && <NuvitaChat />}
      {!hideChrome && <Footer />}
    </MaintenanceGate>
  );
}
