"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <Button variant="ghost" size="sm" className="w-9 h-9" />;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-9 h-9"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? "☀️" : "🌙"}
    </Button>
  );
}
