import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/AppChrome";



import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nuvita.uz - Online dorixona",
  description: "Nuvita.uz online dorixona tizimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive"
        />
        
      </head>
      <body className="min-h-full flex flex-col">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
