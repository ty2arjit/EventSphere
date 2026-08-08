export interface EventSettingsProps {
  requireApproval: boolean;
  allowWaitlist: boolean;
  showAttendeeList: boolean;
  allowGuestRegistration: boolean;
}

export class EventSettings {
  constructor(private readonly props: EventSettingsProps) {}

  static defaults(): EventSettings {
    return new EventSettings({
      requireApproval: false,
      allowWaitlist: true,
      showAttendeeList: true,
      allowGuestRegistration: false,
    });
  }

  static fromPersistence(props: EventSettingsProps): EventSettings {
    return new EventSettings(props);
  }

  get requireApproval(): boolean { return this.props.requireApproval; }
  get allowWaitlist(): boolean { return this.props.allowWaitlist; }
  get showAttendeeList(): boolean { return this.props.showAttendeeList; }
  get allowGuestRegistration(): boolean { return this.props.allowGuestRegistration; }

  update(fields: Partial<EventSettingsProps>): void {
    if (fields.requireApproval !== undefined) this.props.requireApproval = fields.requireApproval;
    if (fields.allowWaitlist !== undefined) this.props.allowWaitlist = fields.allowWaitlist;
    if (fields.showAttendeeList !== undefined) this.props.showAttendeeList = fields.showAttendeeList;
    if (fields.allowGuestRegistration !== undefined) this.props.allowGuestRegistration = fields.allowGuestRegistration;
  }

  toJSON(): EventSettingsProps {
    return { ...this.props };
  }
}
