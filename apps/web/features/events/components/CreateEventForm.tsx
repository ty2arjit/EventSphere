"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { createEvent } from "../api/eventClient";
import {
  createEventSchema,
  type CreateEventFormValues,
} from "../validation/createEventSchema";

interface CreateEventFormProps {
  communityId: string;
}

type Outcome = { status: "idle" } | { status: "error"; message: string };

export function CreateEventForm({ communityId }: CreateEventFormProps) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { name: "", slug: "", description: "", mode: "Offline", visibility: "Public" },
  });

  const nameValue = watch("name");

  function autoSlug() {
    const slug = nameValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setValue("slug", slug, { shouldValidate: true });
  }

  async function onSubmit(values: CreateEventFormValues) {
    setOutcome({ status: "idle" });
    const result = await createEvent({ ...values, communityId });
    if (result.ok) {
      toast.success("Event created!");
      router.push(`/events/${result.data.slug}`);
    } else {
      setOutcome({ status: "error", message: getErrorMessage(result.error) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="event-name">Event Name</Label>
        <Input id="event-name" {...register("name")} onBlur={autoSlug} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-slug">URL Slug</Label>
        <Input id="event-slug" {...register("slug")} />
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-description">Description</Label>
        <Textarea id="event-description" {...register("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-mode">Mode</Label>
          <select id="event-mode" {...register("mode")} className="w-full rounded-md border px-3 py-2 text-sm bg-background">
            <option value="Offline">In-Person</option>
            <option value="Online">Online</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-visibility">Visibility</Label>
          <select id="event-visibility" {...register("visibility")} className="w-full rounded-md border px-3 py-2 text-sm bg-background">
            <option value="Public">Public</option>
            <option value="Private">Private</option>
            <option value="InviteOnly">Invite Only</option>
          </select>
        </div>
      </div>

      {outcome.status === "error" && (
        <p role="alert" className="text-sm text-destructive">{outcome.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create Event"}
      </Button>
    </form>
  );
}
