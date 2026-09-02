"use client";

import { BarChart3, BookOpen, Flame, Home, RotateCcw, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { NavLink } from "./NavLink";

const NAV_ITEMS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/reviser", label: "Réviser", icon: RotateCcw },
  { href: "/grammaire", label: "Grammaire", icon: BookOpen },
  { href: "/progres", label: "Progrès", icon: BarChart3 },
  { href: "/reglages", label: "Réglages", icon: Settings },
] as const;

export interface AppShellHeaderData {
  level: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  currentStreak: number;
  dueCount: number;
  /** persisted Réglages → "Réduire les animations" override; mirrors prefers-reduced-motion via a data attribute (see globals.css) */
  reducedMotion?: boolean;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AppShell({
  header,
  children,
}: {
  header: AppShellHeaderData;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pct = Math.round((header.xpIntoLevel / Math.max(1, header.xpNeededForLevel)) * 100);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = header.reducedMotion ? "true" : "false";
  }, [header.reducedMotion]);

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-6 md:flex">
        <Link href="/" className="fr-text mb-8 px-2 text-2xl font-medium text-primary">
          Maîtrise
        </Link>

        <div className="mb-6 space-y-3 px-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="size-4 text-primary" aria-hidden />
              Niveau {header.level}
            </span>
            <span className="flex items-center gap-1 text-orange-500">
              <Flame className="size-4" aria-hidden />
              {header.currentStreak}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progression du niveau">
            <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              variant="sidebar"
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(pathname, item.href)}
              badge={item.href === "/reviser" ? header.dueCount : undefined}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-h-full flex-1 flex-col pb-16 md:pb-0">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
          <Link href="/" className="fr-text text-xl font-medium text-primary">
            Maîtrise
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-orange-500">
              <Flame className="size-4" aria-hidden />
              {header.currentStreak}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="size-4 text-primary" aria-hidden />
              {header.level}
            </span>
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t bg-background py-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              variant="tabbar"
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(pathname, item.href)}
              badge={item.href === "/reviser" ? header.dueCount : undefined}
            />
          ))}
        </nav>
      </div>
    </div>
  );
}
