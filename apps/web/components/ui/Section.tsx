import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

interface SectionProps {
  icon?: ComponentType<LucideProps>;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ icon: Icon, title, action, children, className }: SectionProps) {
  return (
    <section
      className={`rounded-2xl border border-border bg-card shadow-soft ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <h2 className="flex items-center gap-2.5 font-heading text-base font-medium">
          {Icon && (
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
          )}
          {title}
        </h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
