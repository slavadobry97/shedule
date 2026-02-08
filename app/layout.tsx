import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { Analytics } from "@vercel/analytics/react";

import localFont from "next/font/local";
import "./globals.css";

// Подключение шрифтов
const evolventaSans = localFont({
  src: "./fonts/Evolventa-Regular.woff",
  variable: "--font-evolventa-sans",
  weight: "400",
  display: "swap", // Prevents font blocking
});
const evolventaBold = localFont({
  src: "./fonts/Evolventa-Bold.woff",
  variable: "--font-evolventa-bold",
  weight: "700",
  display: "swap", // Prevents font blocking
});

// Настройки вьюпорта и темы
export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Расписание занятий РГСУ | Филиал в Минске",
  description: "Актуальное расписание занятий Филиала РГСУ в г. Минске на 2025-2026 учебный год. Поиск по группам, преподавателям и датам. Экспорт в PDF.",
  keywords: ["расписание", "РГСУ", "Минск", "занятия", "университет", "студенты", "преподаватели"],
  authors: [{ name: "Филиал РГСУ в г. Минске" }],
  robots: {
    index: true,
    follow: true,
  },
  /* icons handled automatically by file-system conventions */
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Расписание РГСУ',
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://rgsu-schedule.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Расписание занятий РГСУ | Филиал в Минске",
    description: "Актуальное расписание занятий Филиала РГСУ в г. Минске на 2025-2026 учебный год",
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Расписание РГСУ',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Расписание занятий РГСУ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Расписание занятий РГСУ",
    description: "Актуальное расписание занятий Филиала РГСУ в г. Минске",
    images: ['/og-image.png'],
  },
};

// RootLayout компонент
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${evolventaSans.variable} ${evolventaBold.variable}`} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/Evolventa-Regular.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Evolventa-Bold.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
