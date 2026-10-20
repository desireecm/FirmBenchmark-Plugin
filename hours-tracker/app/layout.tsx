import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EI Hours Tracker",
  description: "Retainer and billable hours for Esquire Interactive",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
