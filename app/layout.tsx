import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hackathon Starter",
  description: "Demo-ready Next.js + Supabase starter for case competitions and hackathons.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-[var(--foreground)] [font-family:var(--font-body)]">
        <div className="relative min-h-screen">{children}</div>
      </body>
    </html>
  );
}
