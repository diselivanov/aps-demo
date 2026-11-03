import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Layout from "@/components/layout/Layout";
import { AlertProvider } from "@/components/ui/Alert";
import "./styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aps-demo",
  description: "Демо-версия приложения",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <AlertProvider>
          <Layout>{children}</Layout>
        </AlertProvider>
      </body>
    </html>
  );
}
