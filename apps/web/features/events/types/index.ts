export interface SessionResponse {
  id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  room: string | null;
  startAt: string | null;
  endAt: string | null;
  state: string;
}

export interface EventResponse {
  id: string;
  communityId: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  category: string | null;
  tags: string[];
  mode: string;
  visibility: string;
  location: {
    venue: string | null;
    address: string | null;
    city: string | null;
    onlineUrl: string | null;
  };
  capacity: { min: number | null; max: number | null };
  startDate: string | null;
  endDate: string | null;
  state: string;
  settings: {
    requireApproval: boolean;
    allowWaitlist: boolean;
    showAttendeeList: boolean;
    allowGuestRegistration: boolean;
  };
  sessions: SessionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface EventListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  mode: string;
  state: string;
  startDate: string | null;
  sessionCount: number;
  createdAt: string;
}

export interface EventBrowseItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  mode: string;
  state: string;
  startDate: string | null;
  city: string | null;
  venue: string | null;
  communityId: string;
  communityName: string;
  communitySlug: string;
}

export interface CreateEventInput {
  communityId: string;
  name: string;
  slug: string;
  description?: string | null;
  mode?: string;
  visibility?: string;
}
