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
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
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

  if (loading) return <Spinner label="Loading registration…" />;

  return (
    <FadeIn>
      <div className="space-y-3">
        {!registration && isOrganizer && (
          <Button onClick={handleCreate}>Setup Registration</Button>
        )}

        {registration && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block size-2 rounded-full ${registration.isOpen ? "bg-emerald-500" : "bg-rose-500"}`}
              />
              <span className="text-sm">
                {registration.isOpen ? "Open" : "Closed"} &middot;{" "}
                {registration.approvalStrategy} approval
              </span>
              {registration.maxParticipants && (
                <span className="text-xs text-muted-foreground">
                  (max {registration.maxParticipants})
                </span>
              )}
            </div>

            {isOrganizer && (
              <Button variant="outline" size="sm" onClick={handleToggle}>
                {registration.isOpen ? "Close Registration" : "Open Registration"}
              </Button>
            )}

            {!isOrganizer && registration.isOpen && (
              <Button onClick={handleEnroll}>Register Now</Button>
            )}
          </>
        )}

        {!registration && !isOrganizer && (
          <p className="text-sm text-muted-foreground">Registration not yet available.</p>
        )}
      </div>
    </FadeIn>
  );
}
