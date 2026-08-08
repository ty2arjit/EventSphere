"use client";

import { useEffect, useState } from "react";
import { getEventDashboard } from "../api/analyticsClient";
import type { EventDashboard as DashboardData } from "../types";
import { FadeIn } from "@/components/motion/FadeIn";

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

  if (loading) return <p className="text-muted-foreground text-sm">Loading analytics...</p>;
  if (!data) return <p className="text-muted-foreground text-sm">No analytics data available.</p>;

  const cards = [
    { label: "Enrollments", value: data.totalEnrollments, color: "text-blue-600" },
    { label: "Avg Attendance", value: `${Math.round(data.averageAttendance * 100)}%`, color: "text-green-600" },
    { label: "Certificates", value: data.certificatesIssued, color: "text-purple-600" },
    { label: "Task Completion", value: `${Math.round(data.taskCompletionRate * 100)}%`, color: "text-orange-600" },
  ];

  return (
    <FadeIn>
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Analytics Dashboard</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((card) => (
            <div key={card.label} className="border rounded-lg p-4 text-center">
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
