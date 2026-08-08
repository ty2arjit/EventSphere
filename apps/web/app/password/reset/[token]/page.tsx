import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordResetForm } from "@/features/authentication";

export const metadata: Metadata = {
  title: "Set New Password | EventSphere",
  description: "Choose a new password for your account.",
};

export default async function PasswordResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Choose a strong new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordResetForm token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
