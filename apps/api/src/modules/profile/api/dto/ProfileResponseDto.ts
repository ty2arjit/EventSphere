export interface ProfileResponseDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  verifiedAt: string | null;
  profile: {
    avatarUrl: string | null;
    bio: string | null;
    headline: string | null;
    institution: string | null;
    department: string | null;
    graduationYear: number | null;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: string;
    notifyByEmail: boolean;
    notifyInApp: boolean;
  };
}
