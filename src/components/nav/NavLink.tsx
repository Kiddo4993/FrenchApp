"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** One nav item, rendered for either the desktop sidebar or the mobile bottom tab bar. Shares a
 * `layoutId`-based active indicator across all items of its own variant, so Framer Motion animates
 * it sliding to the new position on navigation instead of just toggling a class. Extracted from
 * AppShell, which previously wrote out the sidebar and tab-bar `.map()` blocks in full twice —
 * flagged by code review as a real risk (adding/changing a nav item meant editing two near-identical
 * blocks) and the natural place to hang the animation besides. */
export function NavLink({
  href,
  label,
  icon: Icon,
  active,
  variant,
  badge,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  variant: "sidebar" | "tabbar";
  /** shown as a count pill (sidebar) or a small dot (tabbar) when > 0 */
  badge?: number;
}) {
  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className={cn(
          "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground",
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active-pill"
            className="absolute inset-0 rounded-lg bg-sidebar-accent"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          />
        )}
        <Icon className="relative z-10 size-5" aria-hidden />
        <span className="relative z-10">{label}</span>
        {Boolean(badge) && (
          <span className="relative z-10 ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            {badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative flex min-w-11 flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <span className="relative">
        <Icon className="size-5" aria-hidden />
        {Boolean(badge) && <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-primary" />}
      </span>
      {label}
      {active && (
        <motion.span
          layoutId="tabbar-active-dot"
          className="absolute -top-2 h-0.5 w-6 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
    </Link>
  );
}
