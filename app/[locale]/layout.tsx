import { SerwistProvider } from "@/app/serwist";
import { ImageLightboxProvider } from "@/components/ImageLightboxProvider";
import { InstallBanner } from "@/components/InstallBanner";
import { Navbar } from "@/components/Navbar";
import { QueryProvider } from "@/components/QueryProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { routing } from "@/i18n/routing";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#18181b",
};

export const metadata: Metadata = {
  applicationName: "Family Tree",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Family Tree",
  },
  formatDetection: {
    telephone: false,
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        <SessionProvider>
          <ThemeProvider>
            <SerwistProvider swUrl="/serwist/sw.js">
              <QueryProvider>
                <NextIntlClientProvider locale={locale} messages={messages}>
                  <ImageLightboxProvider>
                    <InstallBanner />
                    <Navbar />
                    {children}
                  </ImageLightboxProvider>
                </NextIntlClientProvider>
              </QueryProvider>
            </SerwistProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
