import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Hrimajin.id - Homepage",
  description: "Selamat datang di home page hrimajin.id!",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
