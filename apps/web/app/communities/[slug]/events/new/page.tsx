import type { Metadata } from "next";
import { CreateEventPageContent } from "./CreateEventPageContent";

export const metadata: Metadata = {
  title: "Create Event | EventSphere",
  description: "Create a new event for your community.",
};

interface NewEventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewEventPage({ params }: NewEventPageProps) {
  const { slug } = await params;
  return <CreateEventPageContent communitySlug={slug} />;
}
