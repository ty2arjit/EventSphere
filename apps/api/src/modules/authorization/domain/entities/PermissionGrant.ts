import { ContextLevel } from '../valueObjects/ContextLevel';
import { ResponsibilityReference } from '../valueObjects/ResponsibilityReference';

export interface PermissionGrantProps {
  id: string;
  permissionId: string;
  contextLevel: ContextLevel;
  contextId: string | null;
  responsibilityRef: ResponsibilityReference;
  grantedAt: Date;
  revokedAt: Date | null;
}

export class PermissionGrant {
  constructor(private readonly props: PermissionGrantProps) {}

  static create(
    id: string,
    permissionId: string,
    contextLevel: ContextLevel,
    contextId: string | null,
    responsibilityRef: ResponsibilityReference,
  ): PermissionGrant {
    return new PermissionGrant({
      id,
      permissionId,
      contextLevel,
      contextId,
      responsibilityRef,
      grantedAt: new Date(),
      revokedAt: null,
    });
  }

  static fromPersistence(props: PermissionGrantProps): PermissionGrant {
    return new PermissionGrant(props);
  }

  get id(): string { return this.props.id; }
  get permissionId(): string { return this.props.permissionId; }
  get contextLevel(): ContextLevel { return this.props.contextLevel; }
  get contextId(): string | null { return this.props.contextId; }
  get responsibilityRef(): ResponsibilityReference { return this.props.responsibilityRef; }
  get grantedAt(): Date { return this.props.grantedAt; }
  get revokedAt(): Date | null { return this.props.revokedAt; }
  get isActive(): boolean { return this.props.revokedAt === null; }

  revoke(now: Date = new Date()): void {
    this.props.revokedAt = now;
  }

  matches(permissionId: string, contextLevel: ContextLevel, contextId: string | null, responsibilityRef: ResponsibilityReference): boolean {
    if (!this.isActive) return false;
    if (this.props.permissionId !== permissionId) return false;
    if (this.props.contextLevel !== contextLevel) return false;
    if (this.props.responsibilityRef.type !== responsibilityRef.type) return false;
    if (this.props.responsibilityRef.id !== responsibilityRef.id) return false;
    if (this.props.contextId !== null && this.props.contextId !== contextId) return false;
    return true;
  }
}
