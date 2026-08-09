"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateEventForm } from "@/features/events";
import { getCommunityBySlug } from "@/features/community/api/communityClient";

interface Props {
  communitySlug: string;
}

export function CreateEventPageContent({ communitySlug }: Props) {
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCommunityBySlug(communitySlug).then((result) => {
      if (result.ok) setCommunityId(result.data.id);
      else setError(result.error.message);
    });
  }, [communitySlug]);

  if (error) return <p className="p-6 text-destructive">{error}</p>;
  if (!communityId) return <p className="p-6 text-muted-foreground">Loading…</p>;

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Event</CardTitle>
          <CardDescription>
            Create a new event for the {communitySlug} community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateEventForm communityId={communityId} />
        </CardContent>
      </Card>
    </div>
  );
}
