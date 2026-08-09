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

  const cards = [
    { label: "Enrollments", value: data.totalEnrollments, icon: Users },
    {
      label: "Avg Attendance",
      value: `${Math.round(data.averageAttendance * 100)}%`,
      icon: CheckCircle2,
    },
    { label: "Certificates", value: data.certificatesIssued, icon: Award },
    {
      label: "Task Completion",
      value: `${Math.round(data.taskCompletionRate * 100)}%`,
      icon: ListChecks,
    },
  ];

  return (
    <FadeIn>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-background/60 p-4 text-center"
          >
            <span className="mx-auto flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
