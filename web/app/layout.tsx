import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import "./globals.css";

// Fallback for non-Apple devices; Apple devices render San Francisco via the system font stack.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Shark Tank Tracker", template: "%s | Shark Tank Tracker" },
  description: "Every company that appeared on Shark Tank, when they aired, and what happened to them after the show.",
  openGraph: { type: "website", siteName: "Shark Tank Tracker" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <header className="site">
          <div className="inner">
            <Link href="/" className="brand" aria-label="Shark Tank Tracker home">
              <Image src="/shark_tank_logo.svg" alt="Shark Tank" width={150} height={46} priority />
              <span className="brand-sub">Tracker</span>
            </Link>
            <nav>
              <Link href="/season/1">Seasons</Link>
              <Link href="/contribute">Contribute</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site">
          <div className="inner">
            Unofficial fan project. Not affiliated with ABC, Sony Pictures Television, or Shark Tank. Company statuses link to their sources.
          </div>
        </footer>
      </body>
    </html>
  );
}
