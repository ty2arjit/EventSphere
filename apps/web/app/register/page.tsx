import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "@/features/authentication";

export const metadata: Metadata = {
  title: "Create Account | EventSphere",
  description: "Create your EventSphere account.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Sign up to join the EventSphere community.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-foreground">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
