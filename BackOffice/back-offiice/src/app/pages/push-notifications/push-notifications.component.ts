import { Component, OnInit } from '@angular/core';
import { FirebaseMessagingService } from '../../core/services/firebase-messaging.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-push-notifications',
  templateUrl: './push-notifications.component.html',
  styleUrls: ['./push-notifications.component.scss']
})
export class PushNotificationsComponent implements OnInit {
  fcmToken: string | null = null;
  isPermissionGranted = false;
  notifications: any[] = [];
  isLoading = false;

  constructor(
    private firebaseMessaging: FirebaseMessagingService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.checkPermission();
    this.listenForMessages();
  }

  /**
   * Check notification permission status
   */
  checkPermission(): void {
    if ('Notification' in window) {
      this.isPermissionGranted = Notification.permission === 'granted';
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermission(): Promise<void> {
    this.isLoading = true;
    try {
      const token = await this.firebaseMessaging.requestPermission();
      
      if (token) {
        this.fcmToken = token;
        this.isPermissionGranted = true;
        
        // Optionally send token to backend
        await this.saveTokenToBackend(token);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Save FCM token to backend
   */
  async saveTokenToBackend(token: string): Promise<void> {
    try {
      const userId = localStorage.getItem('userId'); // Adjust according to your auth
      
      await this.http.post(`${environment.apiUrl}/api/users/fcm-token`, {
        userId: userId,
        fcmToken: token
      }).toPromise();
      
      console.log('✅ FCM token saved to backend');
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
    }
  }

  /**
   * Listen for incoming messages
   */
  listenForMessages(): void {
    this.firebaseMessaging.getMessages$().subscribe((message) => {
      if (message) {
        this.notifications.unshift({
          title: message.notification?.title || 'Notification',
          body: message.notification?.body || '',
          timestamp: new Date(),
          data: message.data
        });
      }
    });
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    if (!this.fcmToken) {
      alert('Veuillez d\'abord activer les notifications');
      return;
    }

    try {
      await this.http.post(`${environment.services.notifications}`, {
        recipientId: this.fcmToken,
        type: 'PUSH',
        message: 'Ceci est une notification de test !',
        status: 'PENDING'
      }).toPromise();
      
      console.log('✅ Test notification sent');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  }

  /**
   * Copy token to clipboard
   */
  copyToken(): void {
    if (this.fcmToken) {
      navigator.clipboard.writeText(this.fcmToken);
      alert('Token copié dans le presse-papier !');
    }
  }

  /**
   * Clear notifications
   */
  clearNotifications(): void {
    this.notifications = [];
  }
}
