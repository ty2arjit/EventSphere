import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CommunityList } from "@/features/community";

export const metadata: Metadata = {
  title: "My Communities | EventSphere",
  description: "View and manage your communities.",
};

export default function CommunitiesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Communities</CardTitle>
          <Link
            href="/communities/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Community
          </Link>
        </CardHeader>
        <CardContent>
          <CommunityList />
        </CardContent>
      </Card>
    </div>
  );
}
