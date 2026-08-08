import { CommunityDetail } from "@/features/community/components/CommunityDetail";

interface CommunityPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CommunityPageProps) {
  const { slug } = await params;
  return {
    title: `${slug} | EventSphere`,
    description: `Community page for ${slug}`,
  };
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-3xl p-6">
      <CommunityDetail slug={slug} />
    </main>
  );
}
