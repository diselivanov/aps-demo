import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import { AlertProvider } from "@/components/ui/Alert";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "aps-demo",
  description: "Демо-версия приложения",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html lang="ru">
      <body>
        <AlertProvider>
          <Layout>{children}</Layout>
        </AlertProvider>
      </body>
    </html>
  );
}
