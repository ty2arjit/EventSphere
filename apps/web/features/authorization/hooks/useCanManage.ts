"use client";

import { useEffect, useState } from "react";
import { canManage } from "../api/authorizationClient";

/**
 * Asks the backend directly whether the current user can perform
 * `permission` on this resource, instead of re-deriving an ad-hoc
 * owner/member heuristic in the frontend that can drift out of sync with
 * real per-resource authorization. Returns false while loading or for any
 * missing/unauthenticated caller — the safe default for gating UI controls.
 */
export function useCanManage(
  permission: string,
  communityId: string | null | undefined,
  eventId?: string | null,
  userId?: string | null,
): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!communityId || !userId) {
      setAllowed(false);
      return;
    }
    const controller = new AbortController();
    canManage(permission, communityId, eventId, { signal: controller.signal }).then((result) => {
      if (result.ok) setAllowed(result.data.allowed);
    });
    return () => controller.abort();
  }, [permission, communityId, eventId, userId]);

  return allowed;
}
