import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GamePick — find the right board game",
  description:
    "Filter board games by what actually matters to you, with confidence-scored ratings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-white/5 bg-bg-soft/80 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-accent" />
              <span className="font-semibold tracking-tight">GamePick</span>
            </a>
            <nav className="text-sm text-ink-dim flex gap-5">
              <a href="/" className="hover:text-ink">Browse</a>
              <a href="/tonight" className="hover:text-ink">Find a Game</a>
              <a href="/about" className="hover:text-ink">About</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-6 py-10 text-xs text-ink-faint">
          Game data via Recommend.Games & BoardGameGeek. Ratings and metrics computed independently — not affiliated with BGG.
        </footer>
      </body>
    </html>
  );
}
