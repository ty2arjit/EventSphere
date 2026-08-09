import { EventDetail } from "@/features/events";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps) {
  const { slug } = await params;
  return {
    title: `${slug} | EventSphere`,
    description: `Event page for ${slug}`,
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-3xl">
      <EventDetail slug={slug} />
    </div>
  );
}
