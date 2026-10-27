import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/Header";
import { PlausibleAnalytics } from "@/components/analytics";
import { PwaDevCleanup } from "@/components/pwa-dev-cleanup";

import localFont from "next/font/local";
import "./globals.css";

// Подключение шрифтов: одно семейство, два начертания (400/700) —
// иначе жирные заголовки синтезируются браузером из регулярного.
const evolventa = localFont({
  src: [
    { path: "./fonts/Evolventa-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Evolventa-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-evolventa-sans",
  display: "swap", // Prevents font blocking
});

// Настройки вьюпорта и темы.
// viewportFit=cover обязателен: без него env(safe-area-inset-*) на iOS = 0.
// theme-color — по схеме на тему (светлая/тёмная), цвет — полотно страницы.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0e13" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Расписание занятий | Филиал РГСУ в Минске",
  description: "Актуальное расписание занятий Филиала РГСУ в г. Минске на 2026-2027 учебный год. Поиск по группам, преподавателям и датам. Экспорт в PDF.",
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
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_SITE_URL ?? "https://shedule.rgsu.by").startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL ?? "https://shedule.rgsu.by"
      : `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Расписание занятий | Филиал РГСУ в Минске",
    description: "Актуальное расписание занятий Филиала РГСУ в г. Минске на 2026-2027 учебный год",
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Расписание РГСУ',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Расписание занятий | Филиал РГСУ в Минске',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Расписание занятий | Филиал РГСУ в Минске",
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
    <html lang="ru" className={evolventa.variable} suppressHydrationWarning>

      <body>
        <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                // Без этого переходы цвета/фона/тени срабатывают разом при
                // смене темы и страница «размазывается» вместо мгновенной смены
                disableTransitionOnChange
            >
          <Header />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <PlausibleAnalytics />
        <PwaDevCleanup />
      </body>
    </html>
  );
}
