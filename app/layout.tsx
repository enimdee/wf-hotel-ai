import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatrium AI Communication Assistant",
  description: "Brand-aligned guest email drafting for Chatrium Rawai Phuket.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
