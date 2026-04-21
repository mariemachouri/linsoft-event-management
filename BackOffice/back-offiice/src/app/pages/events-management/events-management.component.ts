import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService, Event } from '../../core/services/event.service';

@Component({
  selector: 'app-events-management',
  templateUrl: './events-management.component.html',
  styleUrls: ['./events-management.component.scss']
})
export class EventsManagementComponent implements OnInit {

  events: Event[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private eventService: EventService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.error = null;
    this.eventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.error = 'Error loading events. Please try again.';
        this.loading = false;
      }
    });
  }

  createEvent(): void {
    this.router.navigate(['/events/create']);
  }

  editEvent(id: string): void {
    this.router.navigate(['/events/edit', id]);
  }

  viewEvent(id: string): void {
    // Naviguer vers la page de détails de l'événement
    this.router.navigate(['/events/view', id]);
  }

  deleteEvent(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.loadEvents();
        },
        error: (err) => {
          console.error('Error deleting event:', err);
          alert('Error deleting event');
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'badge-secondary';
      case 'PUBLISHED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      case 'COMPLETED':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'PUBLISHED':
        return 'Published';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'CONFERENCE':
        return 'Conference';
      case 'WORKSHOP':
        return 'Workshop';
      case 'MEETUP':
        return 'Meetup';
      case 'SEMINAR':
        return 'Seminar';
      default:
        return category;
    }
  }
}
