import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseMessagingService {
  private messaging: Messaging | null = null;
  private currentToken$ = new BehaviorSubject<string | null>(null);
  private currentMessage$ = new BehaviorSubject<any>(null);

  constructor() {
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase app and messaging
   */
  private initializeFirebase(): void {
    try {
      const app = initializeApp(environment.firebase);
      this.messaging = getMessaging(app);
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
    }
  }

  /**
   * Request permission and get FCM token
   */
  async requestPermission(): Promise<string | null> {
    if (!this.messaging) {
      console.error('❌ Firebase Messaging not initialized');
      return null;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Get FCM token
        const token = await getToken(this.messaging, {
          vapidKey: 'BHJvqEoG4HlhtNv7DQPyEDp0hbRlWGqwOZ3W2jBE0ShOpYbXFdhzA7u4QHDAzDewPkHDCQu74EiSmbMEHKSE9ck'
        });
        
        if (token) {
          console.log('✅ FCM Token:', token);
          this.currentToken$.next(token);
          this.setupMessageListener();
          return token;
        } else {
          console.warn('⚠️ No registration token available');
          return null;
        }
      } else {
        console.warn('⚠️ Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Listen for foreground messages
   */
  private setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('📩 Message received (foreground):', payload);
      this.currentMessage$.next(payload);
      
      // Display notification
      this.showNotification(payload);
    });
  }

  /**
   * Display browser notification
   */
  private showNotification(payload: any): void {
    const notificationTitle = payload.notification?.title || 'Nouvelle notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/assets/img/brand/favicon.png',
      badge: '/assets/img/brand/favicon.png',
      data: payload.data
    };

    if (Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
    }
  }

  /**
   * Get current FCM token as observable
   */
  getToken$(): Observable<string | null> {
    return this.currentToken$.asObservable();
  }

  /**
   * Get messages as observable
   */
  getMessages$(): Observable<any> {
    return this.currentMessage$.asObservable();
  }

  /**
   * Get current token value
   */
  getCurrentToken(): string | null {
    return this.currentToken$.value;
  }
}
