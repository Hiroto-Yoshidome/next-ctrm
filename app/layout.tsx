import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { TabProvider } from "@/app/contexts/TabContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Next-CTRM",
  description: "銅トレーディング管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full">
        <TabProvider>{children}</TabProvider>
      </body>
    </html>
  );
}
