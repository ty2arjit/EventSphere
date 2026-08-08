"use client";

import { useCallback, useEffect, useState } from "react";
import { getMe, refresh as refreshSession } from "../api/authClient";
import type { AuthenticatedUser } from "../types";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AuthenticatedUser }
  | { status: "unauthenticated" };

export function useCurrentUser() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const load = useCallback(async (signal?: AbortSignal) => {
    const result = await getMe({ signal });
    if (result.ok) {
      setState({ status: "authenticated", user: result.data.user });
      return;
    }

    if (result.error.kind === "UNAUTHORIZED") {
      const refreshResult = await refreshSession({ signal });
      if (refreshResult.ok) {
        const retry = await getMe({ signal });
        if (retry.ok) {
          setState({ status: "authenticated", user: retry.data.user });
          return;
        }
      }
    }

    setState({ status: "unauthenticated" });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const refreshUser = useCallback(() => load(), [load]);

  return {
    user: state.status === "authenticated" ? state.user : null,
    isLoading: state.status === "loading",
    isAuthenticated: state.status === "authenticated",
    refreshUser,
  };
}
