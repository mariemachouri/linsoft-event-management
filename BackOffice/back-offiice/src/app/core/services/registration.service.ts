import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}

export interface Notification {
  id?: string;
  userId: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private registrationsApiUrl = environment.services.registrations;
  private notificationsApiUrl = environment.services.notifications;

  constructor(private http: HttpClient) { }

  // ===== REGISTRATIONS =====

  /**
   * Récupérer toutes les inscriptions
   */
  getAllRegistrations(): Observable<Registration[]> {
    return this.http.get<Registration[]>(this.registrationsApiUrl);
  }

  /**
   * Récupérer une inscription par ID
   */
  getRegistrationById(id: string): Observable<Registration> {
    return this.http.get<Registration>(`${this.registrationsApiUrl}/${id}`);
  }

  /**
   * Créer une nouvelle inscription
   */
  createRegistration(registration: Registration): Observable<Registration> {
    return this.http.post<Registration>(this.registrationsApiUrl, registration);
  }

  updateRegistration(id: string, registration: Registration): Observable<Registration> {
    return this.http.put<Registration>(`${this.registrationsApiUrl}/${id}`, registration);
  }

  updateStatus(id: string, status: string): Observable<Registration> {
    return this.http.put<Registration>(`${this.registrationsApiUrl}/${id}/status`, { status });
  }

  confirmRegistration(id: string): Observable<Registration> {
    return this.http.post<Registration>(`${this.registrationsApiUrl}/${id}/confirm`, {});
  }

  cancelRegistration(id: string): Observable<Registration> {
    return this.http.post<Registration>(`${this.registrationsApiUrl}/${id}/cancel`, {});
  }

  deleteRegistration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.registrationsApiUrl}/${id}`);
  }

  /**
   * Récupérer le nombre d'inscriptions pour un événement
   */
  getRegistrationCountByEvent(eventId: string): Observable<number> {
    return this.http.get<number>(`${this.registrationsApiUrl}/event/${eventId}/count`);
  }

  // ===== NOTIFICATIONS =====

  /**
   * Récupérer toutes les notifications
   */
  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.notificationsApiUrl);
  }

  /**
   * Récupérer les notifications par utilisateur
   */
  getUserNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.notificationsApiUrl}?userId=${userId}`);
  }

  /**
   * Créer une notification
   */
  createNotification(notification: Notification): Observable<Notification> {
    return this.http.post<Notification>(this.notificationsApiUrl, notification);
  }

  /**
   * Marquer une notification comme lue
   */
  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.notificationsApiUrl}/${id}/read`, {});
  }

  /**
   * Supprimer une notification
   */
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.notificationsApiUrl}/${id}`);
  }
}
