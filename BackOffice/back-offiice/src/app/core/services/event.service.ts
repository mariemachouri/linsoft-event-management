import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type EventCategory = 'CONFERENCE' | 'WORKSHOP' | 'MEETUP' | 'SEMINAR';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface Event {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  startAt?: string;
  endAt?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  registrationsCount?: number;
  status: EventStatus;
  category?: EventCategory;
  organizerId?: string;
  imageUrl?: string;
  isOnline?: boolean;
  meetingLink?: string;
  locationLat?: number;
  locationLng?: number;
  chargeIds?: string[];
  chargePredictionId?: string;
  eventStatisticsId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {

  private readonly apiUrl = environment.services.events;
  private readonly TTL = 60_000; // 60 secondes

  private cache$: Observable<Event[]> | null = null;
  private cacheAt = 0;

  constructor(private http: HttpClient) {}

  getAllEvents(): Observable<Event[]> {
    if (!this.cache$ || Date.now() - this.cacheAt > this.TTL) {
      this.cache$ = this.http.get<Event[]>(this.apiUrl).pipe(shareReplay(1));
      this.cacheAt = Date.now();
    }
    return this.cache$;
  }

  invalidateCache(): void {
    this.cache$ = null;
  }

  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, event).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updateEvent(id: string, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event).pipe(
      tap(() => this.invalidateCache())
    );
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.invalidateCache())
    );
  }

  getEventCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }
}
