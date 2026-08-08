export type ResponsibilityType = 'CommunityPosition' | 'CommitteeRole' | 'PlatformAdmin';

export interface ResponsibilityReference {
  type: ResponsibilityType;
  id: string;
}

export function createResponsibilityReference(type: ResponsibilityType, id: string): ResponsibilityReference {
  return { type, id };
}
