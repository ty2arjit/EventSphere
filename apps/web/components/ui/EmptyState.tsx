import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export function EmptyState({
  icon: Icon,
  message,
}: {
  icon: ComponentType<LucideProps>;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border py-10 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
