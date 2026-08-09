"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle2, Award, ListChecks } from "lucide-react";
import { getEventDashboard } from "../api/analyticsClient";
import type { EventDashboard as DashboardData } from "../types";
import { FadeIn } from "@/components/motion/FadeIn";
import { Spinner } from "@/components/ui/Spinner";

interface EventDashboardProps {
  eventId: string;
}

export function EventDashboardPanel({ eventId }: EventDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getEventDashboard(eventId, { signal: controller.signal }).then((result) => {
      if (result.ok) setData(result.data);
      setLoading(false);
    });
    return () => controller.abort();
  }, [eventId]);

  if (loading) return <Spinner label="Loading analytics…" />;
  if (!data) return <p className="text-sm text-muted-foreground">No analytics data available.</p>;

  // Each KPI gets its own hue so the dashboard reads at a glance, the same
  // idea as the colored state badges elsewhere on this page.
  const cards = [
    { label: "Enrollments", value: data.totalEnrollments, icon: Users, color: "sky" },
    {
      label: "Avg Attendance",
      value: `${Math.round(data.averageAttendance * 100)}%`,
      icon: CheckCircle2,
      color: "emerald",
    },
    { label: "Certificates", value: data.certificatesIssued, icon: Award, color: "violet" },
    {
      label: "Task Completion",
      value: `${Math.round(data.taskCompletionRate * 100)}%`,
      icon: ListChecks,
      color: "orange",
    },
  ] as const;

  const ICON_COLORS: Record<string, string> = {
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  };

  return (
    <FadeIn>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-background/60 p-4 text-center"
          >
            <span className={`mx-auto flex size-9 items-center justify-center rounded-lg ${ICON_COLORS[color]}`}>
              <Icon className="size-4" />
            </span>
            <p className="mt-2 font-heading text-2xl font-semibold">{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}
