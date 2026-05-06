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
  searchQuery = '';
  filterStatus = '';
  filterCategory = '';

  get upcomingEvents(): Event[] {
    const now = new Date().getTime();
    const q = this.searchQuery.toLowerCase();
    return this.events
      .filter(e => {
        const endDt = e.endDate || e.endAt || e.startDate || e.startAt;
        const isFuture = endDt ? new Date(endDt).getTime() >= now : false;
        const name = e.name || e.title || '';
        const matchSearch = !q ||
          name.toLowerCase().includes(q) ||
          (e.location || '').toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q);
        const matchStatus = !this.filterStatus || e.status === this.filterStatus;
        const matchCat = !this.filterCategory || e.category === this.filterCategory;
        return isFuture && matchSearch && matchStatus && matchCat;
      })
      .sort((a, b) => {
        const aDate = a.startDate || a.startAt || '';
        const bDate = b.startDate || b.startAt || '';
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });
  }

  getEventImageUrl(event: Event): string {
    if (event.imageUrl) return event.imageUrl;
    const seed = encodeURIComponent(event.id || event.name || 'event');
    return `https://picsum.photos/seed/${seed}/600/240`;
  }

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
    console.log('deleteEvent called with id:', id, typeof id);
    if (!id || id === 'undefined') {
      this.error = 'Impossible de supprimer : ID invalide.';
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.loadEvents();
        },
        error: (err) => {
          console.error('Error deleting event:', err);
          const msg = err?.error?.message || err?.message || `Erreur ${err?.status || ''}`;
          this.error = `Erreur lors de la suppression : ${msg}`;
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
