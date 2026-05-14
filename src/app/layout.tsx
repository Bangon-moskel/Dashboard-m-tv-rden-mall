import type { Metadata } from "next";
import "./globals.css";
import { ThemeBoundary } from "@/components/ThemeBoundary";

export const metadata: Metadata = {
  title: "Dashboard-mall",
  description: "Bygg din egen dashboard med widgets och datapipelines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeBoundary>{children}</ThemeBoundary>
      </body>
    </html>
  );
}
