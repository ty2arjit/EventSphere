import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/" className="flex items-center hover:text-foreground transition-colors">
        <Home className="size-3.5" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
            {item.href && !isLast ? (
              <Link href={item.href} className="truncate hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={`truncate ${isLast ? "text-foreground font-medium" : ""}`}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
