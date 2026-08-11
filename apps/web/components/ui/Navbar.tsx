"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { BrandMark } from "./BrandMark";
import { useCurrentUser } from "@/features/authentication/hooks/useCurrentUser";
import { logout } from "@/features/authentication/api/authClient";

const NAV_LINKS = [
  { href: "/communities", label: "Communities" },
  { href: "/events", label: "Events" },
  { href: "/verify", label: "Verify Certificate" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, refreshUser } = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await logout();
    await refreshUser();
    setSigningOut(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-semibold font-heading text-primary transition-transform hover:scale-[1.02]"
          >
            <BrandMark className="size-8" />
            EventSphere
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {!isLoading && user && (
            <>
              <Link
                href={`/profile/${user.id}`}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-50"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          )}
          {!isLoading && !user && (
            <Link
              href="/login"
              className="ml-1 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
