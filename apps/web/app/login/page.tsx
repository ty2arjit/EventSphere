import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageTransition } from "@/components/motion/PageTransition";
import { LoginForm } from "@/features/authentication";

export const metadata: Metadata = {
  title: "Sign In | EventSphere",
  description: "Sign in to your EventSphere account.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <PageTransition>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>
              <Link
                href="/password/reset/request"
                className="underline hover:text-foreground"
              >
                Forgot your password?
              </Link>
            </p>
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="underline hover:text-foreground"
              >
                Create one
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </PageTransition>
    </main>
  );
}
