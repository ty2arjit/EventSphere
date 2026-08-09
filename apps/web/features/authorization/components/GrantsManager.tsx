"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/api/errorMessages";
import {
  listPermissions,
  listGrants,
  createGrant,
  revokeGrant,
  type PermissionResponse,
  type GrantResponse,
} from "../api/authorizationClient";

interface Position {
  id: string;
  name: string;
}

interface GrantsManagerProps {
  communityId: string;
  positions: Position[];
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function GrantsManager({ communityId, positions }: GrantsManagerProps) {
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [grants, setGrants] = useState<GrantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionId, setPermissionId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listPermissions({ signal: controller.signal }),
      listGrants({ signal: controller.signal }),
    ]).then(([permResult, grantResult]) => {
      if (permResult.ok) setPermissions(permResult.data.data);
      if (grantResult.ok) setGrants(grantResult.data.data);
      setLoading(false);
    });
    return () => controller.abort();
  }, [communityId]);

  const communityGrants = grants.filter(
    (g) => g.contextLevel === "Community" && g.contextId === communityId,
  );

  function permissionName(id: string) {
    return permissions.find((p) => p.id === id)?.name ?? id.slice(0, 8);
  }

  function positionName(id: string) {
    return positions.find((p) => p.id === id)?.name ?? id.slice(0, 8);
  }

  async function handleCreate() {
    if (!permissionId || !positionId) return;
    setSubmitting(true);
    const result = await createGrant({
      permissionId,
      contextLevel: "Community",
      contextId: communityId,
      responsibilityRef: { type: "CommunityPosition", id: positionId },
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Permission granted");
      const refreshed = await listGrants();
      if (refreshed.ok) setGrants(refreshed.data.data);
      setPermissionId("");
      setPositionId("");
    } else {
      toast.error(getErrorMessage(result.error));
    }
  }

  async function handleRevoke(id: string) {
    const result = await revokeGrant(id);
    if (result.ok) {
      setGrants((prev) => prev.filter((g) => g.id !== id));
      toast.success("Grant revoked");
    } else {
      toast.error(getErrorMessage(result.error));
    }
  }

  if (loading) return <Spinner label="Loading permissions…" />;

  return (
    <div className="space-y-4">
      {positions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a position first (in Positions above) before granting it permissions.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-background/60 p-4">
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Position</label>
            <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className={inputClass}>
              <option value="">Select a position…</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[10rem] flex-1 space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Permission</label>
            <select value={permissionId} onChange={(e) => setPermissionId(e.target.value)} className={inputClass}>
              <option value="">Select a permission…</option>
              {permissions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCreate} disabled={submitting || !permissionId || !positionId}>
            {submitting ? "Granting…" : "Grant"}
          </Button>
        </div>
      )}

      {communityGrants.length === 0 ? (
        <EmptyState icon={ShieldCheck} message="No permissions granted in this community yet." />
      ) : (
        <div className="space-y-2">
          {communityGrants.map((grant) => (
            <div
              key={grant.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
            >
              <span>
                <strong>{positionName(grant.responsibilityRef.id)}</strong> can{" "}
                <span className="font-mono text-xs">{permissionName(grant.permissionId)}</span>
              </span>
              <button
                onClick={() => handleRevoke(grant.id)}
                className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="size-3.5" />
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
