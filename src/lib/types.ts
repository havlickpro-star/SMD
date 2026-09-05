export type Role = 'super_admin' | 'admin' | 'moderator' | 'participant';
export type Verification = 'unverified' | 'pending' | 'verified';
export type Visibility = 'public' | 'connected' | 'private';
export type BadgeId =
  | 'intervenant'
  | 'paneliste'
  | 'moderateur'
  | 'invite_officiel'
  | 'organisateur'
  | 'partenaire';
export type RequestStatus = 'pending' | 'accepted' | 'refused' | 'cancelled';

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: Role;
  emailVerified: boolean;
  suspended: boolean;
  mustChangePassword: boolean;
  resetCode?: string;
  loginAttempts: number;
  lockUntil?: number;
  lastLoginAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Profile {
  id: string;
  userId: string;
  eventId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarColor: string;
  civility?: string;
  title?: string;
  organization?: string;
  participantTypeId?: string;
  sectorId?: string;
  representedCountry?: string;
  residenceCountry?: string;
  city?: string;
  shortBio?: string;
  biography?: string;
  verification: Verification;
  badges: BadgeId[];
  featured: boolean;
  demo: boolean;
  published: boolean;
  topics: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ContactDetails {
  profileId: string;
  phone?: string;
  whatsapp?: string;
  fax?: string;
  proEmail?: string;
  linkedin?: string;
  website?: string;
  phoneVis: Visibility;
  whatsappVis: Visibility;
  faxVis: Visibility;
  emailVis: Visibility;
  linkedinVis: Visibility;
  websiteVis: Visibility;
}

export interface ParticipantType {
  id: string;
  name: string;
  active: boolean;
}
export interface Sector {
  id: string;
  name: string;
  active: boolean;
}
export interface Topic {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface Session {
  id: string;
  eventId: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;
  dayPart?: string; // Matin | Midi | Après-midi | Fin de journée
  title: string;
  description?: string;
  subItems?: string[];
  category: string;
  location?: string;
  room?: string;
  topicId?: string;
  parallelGroup?: string;
  urgent?: boolean;
  speakerIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AgendaItem {
  userId: string;
  sessionId: string;
  notToMiss: boolean;
  reminder: boolean;
  createdAt: number;
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: RequestStatus;
  createdAt: number;
  respondedAt?: number;
}

export interface Favorite {
  userId: string;
  profileId: string;
  createdAt: number;
}

export interface Notif {
  id: string;
  userId: string;
  type:
    | 'request'
    | 'accepted'
    | 'refused'
    | 'verified'
    | 'program'
    | 'announcement'
    | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'country' | 'topic' | 'type' | 'speakers' | 'list';
  audienceValue?: string;
  publishedAt: number;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: string;
  newData?: string;
  createdAt: number;
}

export interface EventItem {
  id: string;
  name: string;
  edition: string;
  year: number;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  theme: string;
  active: boolean;
}

export interface DB {
  version: number;
  event: EventItem;
  users: User[];
  profiles: Profile[];
  contacts: ContactDetails[];
  participantTypes: ParticipantType[];
  sectors: Sector[];
  topics: Topic[];
  sessions: Session[];
  agenda: AgendaItem[];
  requests: ConnectionRequest[];
  favorites: Favorite[];
  notifications: Notif[];
  announcements: Announcement[];
  audits: AuditLog[];
}
