import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Zamanẻ ps | Luxury Accessories",
    template: "%s | Zamanẻ ps",
  },
  description:
    "Discover luxury watches, bags, jewelry, and accessories at Zamanẻ ps. Premium quality at affordable prices.",
  keywords: ["luxury", "watches", "bags", "jewelry", "accessories", "fashion"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zamaneps.com",
    siteName: "Zamanẻ ps",
    title: "Zamanẻ ps | Luxury Accessories",
    description: "Discover luxury watches, bags, jewelry, and accessories.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Zamanẻ ps",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zamanẻ ps | Luxury Accessories",
    description: "Discover luxury watches, bags, jewelry, and accessories.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1a1a1a",
              color: "#fff",
              padding: "16px",
              borderRadius: "0",
            },
            success: {
              iconTheme: {
                primary: "#c4a35a",
                secondary: "#fff",
              },
            },
          }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
