import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  startAt?: string;   // backend alias for startDate
  endAt?: string;     // backend alias for endDate
  maxParticipants?: number;
  currentParticipants?: number;
  registrationsCount?: number;
  status: EventStatus;
  category?: EventCategory;
  organizerId?: string;
  imageUrl?: string;
  isOnline?: boolean;
  meetingLink?: string;
  chargeIds?: string[];
  chargePredictionId?: string;
  eventStatisticsId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private eventsApiUrl = environment.services.events;

  constructor(private http: HttpClient) { }

  /**
   * Récupérer tous les événements
   */
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.eventsApiUrl);
  }

  /**
   * Récupérer un événement par ID
   */
  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.eventsApiUrl}/${id}`);
  }

  /**
   * Créer un nouvel événement
   */
  createEvent(event: Event): Observable<Event> {
    return this.http.post<Event>(this.eventsApiUrl, event);
  }

  /**
   * Mettre à jour un événement
   */
  updateEvent(id: string, event: Event): Observable<Event> {
    return this.http.put<Event>(`${this.eventsApiUrl}/${id}`, event);
  }

  /**
   * Supprimer un événement
   */
  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.eventsApiUrl}/${id}`);
  }

  /**
   * Récupérer le nombre d'événements
   */
  getEventCount(): Observable<number> {
    return this.http.get<number>(`${this.eventsApiUrl}/count`);
  }
}
