import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileRegistrationForm } from "./ProfileRegistrationForm";

/**
 * `/profile` — Walking Skeleton route.
 *
 * Deliberately a SERVER Component: it renders static structure only. The
 * interactive form arrives in Step 4 as a separate `'use client'` component
 * mounted into the placeholder below, keeping the client bundle limited to the
 * parts that genuinely need interactivity (Next.js 16 guidance: push the
 * `'use client'` boundary down to the specific interactive component rather
 * than marking whole routes).
 *
 * Contains no business logic, no API calls, and no client state — presentation
 * structure only (Constitution Article 29).
 */

export const metadata: Metadata = {
  title: "Register Profile | EventSphere",
  description:
    "Walking Skeleton — verifies the EventSphere stack end to end by registering a profile.",
};

export default function ProfilePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register Profile</CardTitle>
          <CardDescription>
            Walking Skeleton — verifies the full stack from browser to database.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <section aria-labelledby="registration-form-heading">
            <h2 id="registration-form-heading" className="sr-only">
              Registration form
            </h2>
            <ProfileRegistrationForm />
          </section>

          {/* Step 7 renders the created profile here on success. */}
          <section aria-labelledby="registration-result-heading">
            <h2 id="registration-result-heading" className="sr-only">
              Registration result
            </h2>
            <p className="text-sm text-muted-foreground">
              Result panel — implemented in Step 7.
            </p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}
