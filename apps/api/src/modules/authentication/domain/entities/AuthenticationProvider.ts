export type ProviderName = 'password' | 'google';

export interface AuthenticationProviderProps {
  id: string;
  userCredentialId: string;
  provider: ProviderName;
  providerAccountId: string;
  linkedAt: Date;
}

/**
 * How this credential can be authenticated. Every locally-registered user
 * has a `password` provider; OAuth-linked users additionally have one
 * provider per external identity. All providers on a UserCredential
 * resolve to the same canonical User (Ch.20 invariant).
 */
export class AuthenticationProvider {
  private constructor(private props: AuthenticationProviderProps) {}

  static create(props: AuthenticationProviderProps): AuthenticationProvider {
    return new AuthenticationProvider(props);
  }

  static fromPersistence(props: AuthenticationProviderProps): AuthenticationProvider {
    return new AuthenticationProvider(props);
  }

  get id(): string {
    return this.props.id;
  }
  get userCredentialId(): string {
    return this.props.userCredentialId;
  }
  get provider(): ProviderName {
    return this.props.provider;
  }
  get providerAccountId(): string {
    return this.props.providerAccountId;
  }
  get linkedAt(): Date {
    return this.props.linkedAt;
  }
}
