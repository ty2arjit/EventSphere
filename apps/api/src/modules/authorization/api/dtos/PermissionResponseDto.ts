export interface PermissionResponseDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface GrantResponseDto {
  id: string;
  permissionId: string;
  contextLevel: string;
  contextId: string | null;
  responsibilityRef: { type: string; id: string };
  grantedAt: string;
  revokedAt: string | null;
}

export interface EvaluationResultDto {
  decision: 'Allow' | 'Deny';
}
