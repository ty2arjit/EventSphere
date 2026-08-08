declare namespace Express {
  interface Request {
    user?: {
      id: string;
      sessionId: string;
      emailVerified: boolean;
    } | null;
  }
}
