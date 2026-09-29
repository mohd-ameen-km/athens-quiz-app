import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { GameProvider } from "@/context/GameContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Athens",
  description: "Crafted with Next.js 14, TypeScript, and a warm paper & ink design system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans bg-background text-ink antialiased selection:bg-accent-yellow/50 selection:text-ink min-h-screen">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
