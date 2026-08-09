"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listEnrollments, approveEnrollment, rejectEnrollment } from "../api/participationClient";
import type { EnrollmentResponse } from "../types";
import { StaggerList } from "@/components/motion/StaggerList";

interface EnrollmentListProps {
  eventId: string;
  isOrganizer?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Waitlisted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
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

  if (loading) return <p className="text-muted-foreground text-sm">Loading enrollments...</p>;
  if (enrollments.length === 0) return <p className="text-muted-foreground text-sm">No enrollments yet.</p>;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Enrollments ({enrollments.length})</h3>
      <StaggerList>
        {enrollments.map((enrollment) => (
          <div
            key={enrollment.id}
            className="flex items-center justify-between border rounded-md p-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{enrollment.userId.slice(0, 8)}...</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[enrollment.status] ?? ""}`}>
                {enrollment.status}
              </span>
            </div>
            {isOrganizer && enrollment.status === "Pending" && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleApprove(enrollment.id)}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(enrollment.id)}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </StaggerList>
    </div>
  );
}
