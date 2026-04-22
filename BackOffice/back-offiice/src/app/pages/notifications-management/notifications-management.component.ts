import { Component, OnInit } from '@angular/core';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications-management',
  templateUrl: './notifications-management.component.html',
  styleUrls: ['./notifications-management.component.scss']
})
export class NotificationsManagementComponent implements OnInit {

  notifications: Notification[] = [];
  loading = false;
  error: string | null = null;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.error = null;
    this.notificationService.getAllNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.error = 'Failed to load notifications. Please try again.';
        this.loading = false;
      }
    });
  }

  deleteNotification(id: string): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(id).subscribe({
        next: () => {
          this.loadNotifications();
        },
        error: (err) => {
          console.error('Error deleting notification:', err);
          alert('Failed to delete notification');
        }
      });
    }
  }

  retryNotification(id: string): void {
    this.notificationService.retryNotification(id).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (err) => {
        console.error('Error retrying notification:', err);
      }
    });
  }
}
