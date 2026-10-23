import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Restail — Personal AI Resume Tailoring",
  description: "Generate tailored LaTeX resumes from your master resume and target job descriptions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50/50 text-zinc-900 selection:bg-zinc-200">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Restail &mdash; Tailor resumes with absolute fidelity and zero fabrication.</span>
            <span>LaTeX &bull; Next.js &bull; Python Flask</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
