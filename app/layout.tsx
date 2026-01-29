import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DjajBladi - Your Trusted Poultry Partner",
    template: "%s | DjajBladi",
  },
  description:
    "DjajBladi is your trusted partner in the poultry industry. Quality products, reliable service, and professional expertise for farmers, veterinarians, and clients.",
  keywords: ["poultry", "agriculture", "farming", "DjajBladi", "Morocco"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} antialiased`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
