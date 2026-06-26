import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Registration {
  id?: string;
  eventId: string;
  participantId: string;
  status?: string;
  registrationDate?: string;
  registeredAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isGuest?: boolean;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  participantEmail?: string;
  participantPhone?: string;
  participantName?: string;
}

export interface Notification {
  id?: string;
  userId: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {

  private readonly registrationsUrl = environment.services.registrations;
  private readonly notificationsUrl  = environment.services.notifications;
  private readonly TTL = 60_000;

  private regCache$: Observable<Registration[]> | null = null;
  private regCacheAt = 0;

  constructor(private http: HttpClient) {}

  // ── REGISTRATIONS ────────────────────────────────────────

  getAllRegistrations(): Observable<Registration[]> {
    if (!this.regCache$ || Date.now() - this.regCacheAt > this.TTL) {
      this.regCache$ = this.http.get<Registration[]>(this.registrationsUrl).pipe(shareReplay(1));
      this.regCacheAt = Date.now();
    }
    return this.regCache$;
  }

  invalidateCache(): void {
    this.regCache$ = null;
  }

  getRegistrationById(id: string): Observable<Registration> {
    return this.http.get<Registration>(`${this.registrationsUrl}/${id}`);
  }

  createRegistration(registration: Registration): Observable<Registration> {
    return this.http.post<Registration>(this.registrationsUrl, registration).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updateRegistration(id: string, registration: Registration): Observable<Registration> {
    return this.http.put<Registration>(`${this.registrationsUrl}/${id}`, registration).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updateStatus(id: string, status: string): Observable<Registration> {
    return this.http.put<Registration>(`${this.registrationsUrl}/${id}/status`, { status }).pipe(
      tap(() => this.invalidateCache())
    );
  }

  confirmRegistration(id: string): Observable<Registration> {
    return this.http.post<Registration>(`${this.registrationsUrl}/${id}/confirm`, {}).pipe(
      tap(() => this.invalidateCache())
    );
  }

  cancelRegistration(id: string): Observable<Registration> {
    return this.http.post<Registration>(`${this.registrationsUrl}/${id}/cancel`, {}).pipe(
      tap(() => this.invalidateCache())
    );
  }

  deleteRegistration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.registrationsUrl}/${id}`).pipe(
      tap(() => this.invalidateCache())
    );
  }

  getRegistrationCountByEvent(eventId: string): Observable<number> {
    return this.http.get<number>(`${this.registrationsUrl}/event/${eventId}/count`);
  }

  // ── NOTIFICATIONS ────────────────────────────────────────

  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.notificationsUrl);
  }

  getUserNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.notificationsUrl}?userId=${userId}`);
  }

  createNotification(notification: Notification): Observable<Notification> {
    return this.http.post<Notification>(this.notificationsUrl, notification);
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.notificationsUrl}/${id}/read`, {});
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.notificationsUrl}/${id}`);
  }
}
