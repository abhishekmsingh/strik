import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/sw-register";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "strik",
  description: "show up. tap once. keep the chain.",
  applicationName: "strik",
  appleWebApp: {
    capable: true,
    title: "strik",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full`}
    >
      <body className="min-h-full">
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
