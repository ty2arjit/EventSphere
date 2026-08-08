import { randomUUID } from "node:crypto";

export interface CommitteeRoleProps {
  id: string;
  name: string;
  description: string | null;
  reportsToRoleId: string | null;
  createdAt: Date;
}

export class CommitteeRole {
  readonly id: string;
  name: string;
  description: string | null;
  reportsToRoleId: string | null;
  readonly createdAt: Date;

  constructor(props: CommitteeRoleProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.reportsToRoleId = props.reportsToRoleId;
    this.createdAt = props.createdAt;
  }

  static create(name: string, description: string | null = null): CommitteeRole {
    return new CommitteeRole({
      id: randomUUID(),
      name,
      description,
      reportsToRoleId: null,
      createdAt: new Date(),
    });
  }

  setReportsTo(roleId: string | null): void {
    this.reportsToRoleId = roleId;
  }

  update(name: string, description: string | null): void {
    this.name = name;
    this.description = description;
  }
}
