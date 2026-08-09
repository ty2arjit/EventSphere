"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { useCurrentUser } from "@/features/authentication/hooks/useCurrentUser";
import { getCommunityById, acceptInvitation } from "@/features/community/api/communityClient";
import { getErrorMessage } from "@/lib/api/errorMessages";
import type { CommunityResponse } from "@/features/community/types";

type State =
  | { status: "loading" }
  | { status: "loaded"; community: CommunityResponse }
  | { status: "error"; message: string };

export default function AcceptInvitationPage() {
  const params = useParams<{ communityId: string; invitationId: string }>();
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const [state, setState] = useState<State>({ status: "loading" });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    getCommunityById(params.communityId).then((result) => {
      if (result.ok) setState({ status: "loaded", community: result.data });
      else setState({ status: "error", message: result.error.message });
    });
  }, [params.communityId]);

  async function handleAccept() {
    setAccepting(true);
    const result = await acceptInvitation(params.communityId, params.invitationId);
    setAccepting(false);
    if (result.ok) {
      toast.success("Welcome to the community!");
      if (state.status === "loaded") router.push(`/communities/${state.community.slug}`);
    } else {
      toast.error(getErrorMessage(result.error));
    }
  }

  return (
    <div className="mx-auto flex max-w-md items-center justify-center py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Community invitation</CardTitle>
          <CardDescription>You've been invited to join a community on EventSphere.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.status === "loading" && <Spinner label="Loading invitation…" />}
          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          {state.status === "loaded" && (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-4">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="size-5" />
                </span>
                <div>
                  <p className="font-heading font-medium">{state.community.name}</p>
                  {state.community.description && (
                    <p className="text-sm text-muted-foreground">{state.community.description}</p>
                  )}
                </div>
              </div>

              {!userLoading && !user && (
                <div className="space-y-2 text-center text-sm text-muted-foreground">
                  <p>Sign in, then come back to this page to accept.</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    Sign in
                  </Link>
                </div>
              )}

              {!userLoading && user && (
                <Button className="w-full" onClick={handleAccept} disabled={accepting}>
                  {accepting ? "Joining…" : `Accept and join ${state.community.name}`}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
