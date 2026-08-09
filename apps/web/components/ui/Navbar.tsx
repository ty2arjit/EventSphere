"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { useCurrentUser } from "@/features/authentication/hooks/useCurrentUser";
import { logout } from "@/features/authentication/api/authClient";

const NAV_LINKS = [
  { href: "/communities", label: "Communities" },
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
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-primary">
            EventSphere
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!isLoading && user && (
            <>
              <Link
                href={`/profile/${user.id}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          )}
          {!isLoading && !user && (
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
