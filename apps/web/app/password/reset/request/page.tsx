import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordResetRequestForm } from "@/features/authentication";

export const metadata: Metadata = {
  title: "Reset Password | EventSphere",
  description: "Request a password reset link.",
};

export default function PasswordResetRequestPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PasswordResetRequestForm />
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="underline hover:text-foreground">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
