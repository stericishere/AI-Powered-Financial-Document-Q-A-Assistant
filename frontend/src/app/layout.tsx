import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Q&A AI",
  description: "AI-powered insights for your financial statements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
