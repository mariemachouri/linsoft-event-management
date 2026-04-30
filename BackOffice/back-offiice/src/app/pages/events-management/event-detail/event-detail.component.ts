import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, Event } from '../../../core/services/event.service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {

  event: Event | null = null;
  loading = false;
  error: string | null = null;
  eventId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    this.loadEvent();
  }

  loadEvent(): void {
    this.loading = true;
    this.error = null;
    
    this.eventService.getEventById(this.eventId).subscribe({
      next: (data) => {
        this.event = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.error = 'Error loading event.';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  getEventImageUrl(): string {
    if (!this.event) return '';
    if (this.event.imageUrl) return this.event.imageUrl;
    const seed = encodeURIComponent(this.event.id || this.event.name || 'event');
    return `https://picsum.photos/seed/${seed}/600/240`;
  }

  editEvent(): void {
    this.router.navigate(['/events/edit', this.eventId]);
  }

  deleteEvent(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      this.eventService.deleteEvent(this.eventId).subscribe({
        next: () => {
          this.router.navigate(['/events']);
        },
        error: (err) => {
          console.error('Error deleting event:', err);
          alert('Error deleting event');
        }
      });
    }
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'DRAFT': 'Draft',
      'PUBLISHED': 'Published',
      'CANCELLED': 'Cancelled',
      'COMPLETED': 'Completed'
    };
    return labels[status] || status;
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

  getCategoryLabel(category: string): string {
    const labels: any = {
      'CONFERENCE': 'Conference',
      'WORKSHOP': 'Workshop',
      'MEETUP': 'Meetup',
      'SEMINAR': 'Seminar'
    };
    return labels[category] || category;
  }
}
