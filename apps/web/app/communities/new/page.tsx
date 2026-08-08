import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateCommunityForm } from "@/features/community";

export const metadata: Metadata = {
  title: "Create Community | EventSphere",
  description: "Create a new community on EventSphere.",
};

export default function NewCommunityPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create a Community</CardTitle>
          <CardDescription>
            Set up a new community for your group or organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateCommunityForm />
        </CardContent>
      </Card>
    </main>
  );
}
