export type CommitteeLifecycleState =
  | "Planning"
  | "Formation"
  | "Active"
  | "Completed"
  | "Archived";

const VALID_TRANSITIONS: Record<CommitteeLifecycleState, CommitteeLifecycleState[]> = {
  Planning: ["Formation"],
  Formation: ["Active"],
  Active: ["Completed"],
  Completed: ["Archived"],
  Archived: [],
};

export function canTransitionCommittee(
  from: CommitteeLifecycleState,
  to: CommitteeLifecycleState,
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function isTerminalCommitteeState(state: CommitteeLifecycleState): boolean {
  return state === "Archived";
}
