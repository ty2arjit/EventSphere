export type SessionLifecycleState =
  | 'Draft'
  | 'Scheduled'
  | 'Ready'
  | 'Live'
  | 'Completed'
  | 'Cancelled';

const VALID_TRANSITIONS: Record<SessionLifecycleState, SessionLifecycleState[]> = {
  Draft: ['Scheduled', 'Cancelled'],
  Scheduled: ['Ready', 'Cancelled'],
  Ready: ['Live', 'Cancelled'],
  Live: ['Completed'],
  Completed: [],
  Cancelled: [],
};

export function canTransitionSession(from: SessionLifecycleState, to: SessionLifecycleState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
