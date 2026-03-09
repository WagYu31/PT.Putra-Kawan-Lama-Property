import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PT. Putra Kawan Lama | Sewa & Jual Properti Premium",
  description: "Platform properti premium untuk sewa dan jual rumah, apartemen, villa, tanah, dan komersial. Temukan hunian impian Anda bersama PT. Putra Kawan Lama.",
  keywords: "properti, sewa, jual, rumah, apartemen, villa, tanah, Jakarta, Indonesia",
  authors: [{ name: "PT. Putra Kawan Lama" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "PT. Putra Kawan Lama | Sewa & Jual Properti Premium",
    description: "Platform properti premium untuk sewa dan jual rumah, apartemen, villa, tanah, dan komersial.",
    type: "website",
    locale: "id_ID",
    siteName: "PT. Putra Kawan Lama",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#060b18",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key="Mid-client-mGA7v04cXrux3KNF"
          async
        ></script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
