import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hrimajin.id - Homepage",
  description: "Selamat datang di home page hrimajin.id!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
