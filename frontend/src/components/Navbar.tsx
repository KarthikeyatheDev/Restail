"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Sparkles, 
  History, 
  Settings, 
  LayoutDashboard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { fetchFilesStatus } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const [allReady, setAllReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetchFilesStatus()
      .then((data) => setAllReady(data.all_ready))
      .catch(() => setAllReady(false));
  }, [pathname]);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Tailor Resume", href: "/tailor", icon: Sparkles },
    { label: "History", href: "/history", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-zinc-900">Restail</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">AI Resume Tailoring</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 font-semibold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-zinc-900" : "text-zinc-500"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side status indicator & CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50/50 px-2.5 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            {allReady === null ? (
              <span className="h-2 w-2 rounded-full bg-zinc-300 animate-pulse" />
            ) : allReady ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-700">Source Files Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-medium text-amber-700">Setup Source Files</span>
              </>
            )}
          </Link>

          <Link
            href="/tailor"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-zinc-800"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Tailor New Resume
          </Link>
        </div>
      </div>
    </header>
  );
}
