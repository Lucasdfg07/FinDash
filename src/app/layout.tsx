import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/dark-theme.css";
import { Providers } from "./providers";
import { DarkModeProvider } from "@/context/DarkModeContext";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PWAInitializer } from "@/components/PWAInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinDash — Dashboard Financeiro",
  description: "Dashboard financeiro com transparência total do seu negócio",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/icon-192.png" },
  ],
  themeColor: "#1a1f2e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinDash",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1a1f2e" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <DarkModeProvider>
          <Providers>{children}</Providers>
          <OfflineIndicator />
          <PWAInitializer />
        </DarkModeProvider>
      </body>
    </html>
  );
}
