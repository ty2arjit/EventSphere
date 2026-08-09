export const PERMISSIONS = {
  EVENT_MANAGE: 'event:manage',
  COMMITTEE_MANAGE: 'committee:manage',
  PARTICIPATION_MANAGE: 'participation:manage',
  TASK_MANAGE: 'task:manage',
  ANNOUNCEMENT_MANAGE: 'announcement:manage',
  AUTHORIZATION_MANAGE: 'authorization:manage',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
