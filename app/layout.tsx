import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RootProvider } from "@/lib/provider/RootProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
//version1.2.1 modules for managers)
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Signagewala - Next Generation Digital Signage Solution",
  description:
    "Empowering Businesses with Cutting-Edge Digital Signage Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://unpkg.com/pptxgenjs@3.12.0/dist/pptxgen.bundle.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootProvider>{children}</RootProvider>
        <Toaster />
      </body>
    </html>
  );
}
