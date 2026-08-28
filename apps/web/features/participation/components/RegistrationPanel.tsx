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
import { startRazorpayCheckout } from "../lib/razorpayCheckout";
import { updateEvent } from "@/features/events/api/eventClient";
import type { RegistrationResponse } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/Spinner";
import { FadeIn } from "@/components/motion/FadeIn";

interface EventPricing {
  isPaid: boolean;
  amount: number | null;
  currency: string;
}

interface RegistrationPanelProps {
  eventId: string;
  eventName?: string;
  pricing?: EventPricing;
  isOrganizer?: boolean;
  onEnrolled?: () => void;
}

/** Paise → "₹1,250.00" (or the currency's own formatting). */
function formatMoney(minorUnits: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(minorUnits / 100);
  } catch {
    return `${(minorUnits / 100).toFixed(2)} ${currency}`;
  }
}

export function RegistrationPanel({
  eventId,
  eventName = "this event",
  pricing,
  isOrganizer = false,
  onEnrolled,
}: RegistrationPanelProps) {
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const isPaid = pricing?.isPaid === true && (pricing?.amount ?? 0) > 0;

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
    setEnrolling(true);
    try {
      const result = await enroll(eventId);
      if (!result.ok) {
        toast.error("Enrollment failed");
        return;
      }

      // Free event, or a waitlisted paid entrant — nothing to pay.
      if (result.data.status !== "PendingPayment") {
        toast.success("Successfully enrolled!");
        onEnrolled?.();
        return;
      }

      // Paid event — the seat is held; open Razorpay to complete payment.
      const checkout = await startRazorpayCheckout({ eventId, eventName });
      if (checkout.status === "paid") {
        toast.success("Payment complete — you're enrolled!");
        onEnrolled?.();
      } else if (checkout.status === "dismissed") {
        toast.info("Payment cancelled. Your spot is held — you can pay any time to confirm.");
        onEnrolled?.();
      } else {
        toast.error(checkout.message);
        onEnrolled?.();
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <Spinner label="Loading registration…" />;

  return (
    <FadeIn>
      <div className="space-y-3">
        {isPaid && pricing && (
          <p className="text-sm font-medium">
            Registration fee:{" "}
            <span className="text-primary">{formatMoney(pricing.amount ?? 0, pricing.currency)}</span>
          </p>
        )}
        {!isPaid && <p className="text-sm text-muted-foreground">Free event</p>}

        {isOrganizer && (
          <PricingEditor
            eventId={eventId}
            pricing={pricing ?? { isPaid: false, amount: null, currency: "INR" }}
          />
        )}

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
              <Button onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? "Processing…" : isPaid ? "Register & Pay" : "Register Now"}
              </Button>
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

/**
 * Organizer-only: flip an event between free and paid and set the fee. The
 * amount is entered in rupees and stored as paise. The backend only enforces
 * "paid ⇒ positive fee" at publish time, so this can be edited freely while
 * the event is a Draft.
 */
function PricingEditor({ eventId, pricing }: { eventId: string; pricing: EventPricing }) {
  const [isPaid, setIsPaid] = useState(pricing.isPaid);
  const [rupees, setRupees] = useState(pricing.amount ? String(pricing.amount / 100) : "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const amountPaise = isPaid ? Math.round(Number(rupees) * 100) : null;
      if (isPaid && (!amountPaise || amountPaise <= 0)) {
        toast.error("Enter a fee greater than zero");
        return;
      }
      const result = await updateEvent(eventId, {
        pricing: { isPaid, amount: amountPaise, currency: "INR" },
      });
      if (result.ok) toast.success("Pricing updated");
      else toast.error("Failed to update pricing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-border/60 p-3 space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPaid}
          onChange={(e) => setIsPaid(e.target.checked)}
        />
        This is a paid event
      </label>
      {isPaid && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">₹</span>
          <Input
            type="number"
            min="1"
            step="0.01"
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
            placeholder="Registration fee"
            className="max-w-[10rem]"
          />
        </div>
      )}
      <Button size="sm" variant="outline" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save pricing"}
      </Button>
    </div>
  );
}
