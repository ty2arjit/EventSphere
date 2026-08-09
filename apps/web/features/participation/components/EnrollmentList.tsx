"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { listEnrollments, approveEnrollment, rejectEnrollment } from "../api/participationClient";
import type { EnrollmentResponse } from "../types";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";
import { Spinner } from "@/components/ui/Spinner";

interface EnrollmentListProps {
  eventId: string;
  isOrganizer?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Approved: "bg-primary/15 text-primary",
  Pending: "bg-accent/15 text-accent",
  Rejected: "bg-destructive/15 text-destructive",
  Waitlisted: "bg-secondary text-secondary-foreground",
  Cancelled: "bg-muted text-muted-foreground",
};

export function EnrollmentList({ eventId, isOrganizer = false }: EnrollmentListProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    listEnrollments(eventId, { signal: controller.signal }).then((result) => {
      if (result.ok) setEnrollments(result.data.data);
      setLoading(false);
    });
    return () => controller.abort();
  }, [eventId]);

  const handleApprove = async (id: string) => {
    const result = await approveEnrollment(id);
    if (result.ok) {
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "Approved" } : e)),
      );
      toast.success("Enrollment approved");
    }
  };

  const handleReject = async (id: string) => {
    const result = await rejectEnrollment(id);
    if (result.ok) {
      setEnrollments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "Rejected" } : e)),
      );
      toast.success("Enrollment rejected");
    }
  };

  if (loading) return <Spinner label="Loading enrollments…" />;
  if (enrollments.length === 0) return <p className="text-sm text-muted-foreground">No enrollments yet.</p>;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        Enrollments ({enrollments.length})
      </h4>
      <StaggerList className="space-y-2">
        {enrollments.map((enrollment) => (
          <StaggerItem key={enrollment.id}>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background/60 p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{enrollment.userId.slice(0, 8)}...</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[enrollment.status] ?? ""}`}
                >
                  {enrollment.status}
                </span>
              </div>
              {isOrganizer && enrollment.status === "Pending" && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleApprove(enrollment.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    <Check className="size-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(enrollment.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                  >
                    <X className="size-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  );
}
