import type { Metadata } from "next";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Insights — credicorp-dispatcher-middleware",
  description: "Azure Application Insights telemetry dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-900 antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
