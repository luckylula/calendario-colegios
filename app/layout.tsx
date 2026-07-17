import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Header } from "@/components/Header";
import { LOGO_SRC } from "@/lib/branding";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Calendari Escolar | Control Play",
    template: "%s | Control Play",
  },
  description:
    "Gestió de calendaris escolars per als centres educatius de Control Play.",
  icons: {
    icon: LOGO_SRC,
    apple: LOGO_SRC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca">
      <body
        className={`${poppins.variable} font-sans antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900`}
      >
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
