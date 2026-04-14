import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
  id?: string;
  userId: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notificationsApiUrl = environment.services.notifications;

  constructor(private http: HttpClient) { }

  /**
   * Récupérer toutes les notifications
   */
  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.notificationsApiUrl);
  }

  /**
   * Récupérer une notification par ID
   */
  getNotificationById(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.notificationsApiUrl}/${id}`);
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
  markAsRead(id: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.notificationsApiUrl}/${id}/read`, {});
  }

  /**
   * Supprimer une notification
   */
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.notificationsApiUrl}/${id}`);
  }
}
