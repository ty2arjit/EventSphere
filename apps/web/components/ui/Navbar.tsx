"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/communities", label: "Communities" },
  { href: "/verify", label: "Verify Certificate" },
];

export function Navbar() {
  const pathname = usePathname();

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
          <Link
            href="/profile"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>
    </header>
  );
}
