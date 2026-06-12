import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RestroZapp | Restaurant POS",
    template: "%s | RestroZapp",
  },
  description: "Fast, offline-first restaurant billing, kitchen printing, inventory, reports, and secure cloud recovery.",
  icons: { icon: "/restrozapp-icon.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
