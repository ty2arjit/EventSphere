export type EventLifecycleState =
  | 'Draft'
  | 'Published'
  | 'RegistrationOpen'
  | 'RegistrationClosed'
  | 'Live'
  | 'Completed'
  | 'Archived'
  | 'Cancelled';

const VALID_TRANSITIONS: Record<EventLifecycleState, EventLifecycleState[]> = {
  Draft: ['Published', 'Cancelled'],
  Published: ['RegistrationOpen', 'Cancelled'],
  RegistrationOpen: ['RegistrationClosed'],
  RegistrationClosed: ['Live'],
  Live: ['Completed'],
  Completed: ['Archived'],
  Archived: [],
  Cancelled: [],
};

export function canTransition(from: EventLifecycleState, to: EventLifecycleState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function isTerminal(state: EventLifecycleState): boolean {
  return state === 'Archived' || state === 'Cancelled';
}
