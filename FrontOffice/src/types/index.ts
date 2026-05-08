// =============================================
//  Types — Event Management FrontOffice
// =============================================

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
export type EventCategory =
  | 'CONFERENCE'
  | 'WORKSHOP'
  | 'CONCERT'
  | 'SPORT'
  | 'NETWORKING'
  | 'FESTIVAL'
  | 'SEMINAR'
  | 'OTHER';

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'WAITLISTED';

export interface Event {
  id: string;
  title: string;
  name?: string;
  description: string;
  location: string;
  startAt?: string;
  endAt?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants: number;
  currentParticipants: number;
  organizerId: string;
  imageUrl?: string;
  category: EventCategory;
  status: EventStatus;
  chargeIds?: string[];
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  createdAt?: string;
  confirmedAt?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  roles?: string[];
  enabled?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}
