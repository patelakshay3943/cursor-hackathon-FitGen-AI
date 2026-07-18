import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/store/StoreProvider";
import { Navbar } from "@/shared/components/layout/Navbar";
import "../styles/globals.css";

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitGen AI",
  description: "AI workout plans from your assessment — unlock one day at a time",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitGen",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1210" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col pb-[env(safe-area-inset-bottom)]"
        suppressHydrationWarning
      >
        <StoreProvider>
          <Navbar />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
