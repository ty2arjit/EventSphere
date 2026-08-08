"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getRegistration,
  createRegistration,
  openRegistration,
  closeRegistration,
  enroll,
} from "../api/participationClient";
import type { RegistrationResponse } from "../types";
import { FadeIn } from "@/components/motion/FadeIn";

interface RegistrationPanelProps {
  eventId: string;
  isOrganizer?: boolean;
  onEnrolled?: () => void;
}

export function RegistrationPanel({ eventId, isOrganizer = false, onEnrolled }: RegistrationPanelProps) {
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    getRegistration(eventId, { signal: controller.signal }).then((result) => {
      if (result.ok) setRegistration(result.data);
      setLoading(false);
    });
    return () => controller.abort();
  }, [eventId]);

  const handleCreate = async () => {
    const result = await createRegistration(eventId, { approvalStrategy: "Automatic" });
    if (result.ok) {
      setRegistration(result.data);
      toast.success("Registration created");
    } else {
      toast.error("Failed to create registration");
    }
  };

  const handleToggle = async () => {
    if (!registration) return;
    const action = registration.isOpen ? closeRegistration : openRegistration;
    const result = await action(registration.id);
    if (result.ok) {
      setRegistration({ ...registration, isOpen: !registration.isOpen });
      toast.success(registration.isOpen ? "Registration closed" : "Registration opened");
    }
  };

  const handleEnroll = async () => {
    const result = await enroll(eventId);
    if (result.ok) {
      toast.success("Successfully enrolled!");
      onEnrolled?.();
    } else {
      toast.error("Enrollment failed");
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm">Loading registration...</p>;

  return (
    <FadeIn>
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-lg">Registration</h3>

        {!registration && isOrganizer && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
          >
            Setup Registration
          </button>
        )}

        {registration && (
          <>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${registration.isOpen ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm">
                {registration.isOpen ? "Open" : "Closed"} &middot;{" "}
                {registration.approvalStrategy} approval
              </span>
              {registration.maxParticipants && (
                <span className="text-muted-foreground text-xs">
                  (max {registration.maxParticipants})
                </span>
              )}
            </div>

            {isOrganizer && (
              <button
                onClick={handleToggle}
                className="px-3 py-1 border rounded-md text-sm hover:bg-muted"
              >
                {registration.isOpen ? "Close Registration" : "Open Registration"}
              </button>
            )}

            {!isOrganizer && registration.isOpen && (
              <button
                onClick={handleEnroll}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                Register Now
              </button>
            )}
          </>
        )}

        {!registration && !isOrganizer && (
          <p className="text-muted-foreground text-sm">Registration not yet available.</p>
        )}
      </div>
    </FadeIn>
  );
}
