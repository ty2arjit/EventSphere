export interface PermissionProps {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export class Permission {
  constructor(private readonly props: PermissionProps) {}

  static create(id: string, name: string, description: string | null): Permission {
    return new Permission({ id, name, description, createdAt: new Date() });
  }

  static fromPersistence(props: PermissionProps): Permission {
    return new Permission(props);
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get createdAt(): Date { return this.props.createdAt; }

  update(name: string, description: string | null): void {
    this.props.name = name;
    this.props.description = description;
  }
}
