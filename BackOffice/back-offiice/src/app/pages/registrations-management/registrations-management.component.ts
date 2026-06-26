import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegistrationService, Registration } from '../../core/services/registration.service';
import { EventService, Event } from '../../core/services/event.service';
import { UserService, UserResponse } from '../../core/services/user.service';

export interface EventGroup {
  event: Event;
  registrations: Registration[];
  isFull: boolean;
  collapsed: boolean;
}

@Component({
  selector: 'app-registrations-management',
  templateUrl: './registrations-management.component.html',
  styleUrls: ['./registrations-management.component.scss']
})
export class RegistrationsManagementComponent implements OnInit {

  registrations: Registration[] = [];
  events: Event[] = [];
  users: UserResponse[] = [];
  loading = false;
  error: string | null = null;
  successMsg: string | null = null;
  searchQuery = '';

  get eventGroups(): EventGroup[] {
    const q = this.searchQuery.toLowerCase();
    const grouped: Record<string, Registration[]> = {};

    for (const reg of this.registrations) {
      if (reg.status?.toUpperCase() === 'CANCELLED') continue;
      const key = reg.eventId;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(reg);
    }

    const groups: EventGroup[] = [];
    Object.keys(grouped).forEach(eventId => {
      const regs = grouped[eventId];
      const event = this.events.find(e => e.id === eventId);
      if (!event) return;

      const eventName = (event.name || event.title || '').toLowerCase();
      const matchesSearch = !q || eventName.includes(q) ||
        regs.some(r => this.getParticipantName(r).toLowerCase().includes(q) ||
                       this.getParticipantEmail(r).toLowerCase().includes(q));
      if (!matchesSearch) return;

      const isFull = !!(event.maxParticipants && event.maxParticipants > 0 &&
        (event.currentParticipants ?? 0) >= event.maxParticipants);

      groups.push({ event, registrations: regs, isFull, collapsed: false });
    });

    return groups.sort((a, b) =>
      (a.event.name || a.event.title || '').localeCompare(b.event.name || b.event.title || '')
    );
  }

  get totalParticipants(): number {
    return this.registrations.filter(r => r.status?.toUpperCase() !== 'CANCELLED').length;
  }

  get fullEventsCount(): number {
    return this.eventGroups.filter(g => g.isFull).length;
  }

  constructor(
    private registrationService: RegistrationService,
    private eventService: EventService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.error = null;
    forkJoin({
      registrations: this.registrationService.getAllRegistrations().pipe(catchError(() => of([]))),
      events: this.eventService.getAllEvents().pipe(catchError(() => of([]))),
      users: this.userService.getAllUsers().pipe(catchError(() => of([])))
    }).subscribe({
      next: (data) => {
        this.registrations = data.registrations as Registration[];
        this.events = data.events as Event[];
        this.users = data.users as UserResponse[];
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des inscriptions.';
        this.loading = false;
      }
    });
  }

  toggleGroup(group: EventGroup): void {
    group.collapsed = !group.collapsed;
  }

  cancelRegistration(id: string, group: EventGroup): void {
    if (!confirm('Annuler l\'inscription de ce participant ?')) return;
    this.registrationService.cancelRegistration(id).subscribe({
      next: () => {
        this.registrations = this.registrations.filter(r => r.id !== id);
        const event = group.event;
        if (event.currentParticipants && event.currentParticipants > 0) {
          event.currentParticipants--;
        }
        this.showSuccess('Inscription annulée.');
      },
      error: () => { this.error = 'Erreur lors de l\'annulation.'; }
    });
  }

  deleteRegistration(id: string): void {
    if (!confirm('Supprimer définitivement cette inscription ?')) return;
    this.registrationService.deleteRegistration(id).subscribe({
      next: () => {
        this.registrations = this.registrations.filter(r => r.id !== id);
        this.showSuccess('Inscription supprimée.');
      },
      error: () => { this.error = 'Erreur lors de la suppression.'; }
    });
  }

  getParticipantName(reg: Registration): string {
    if (reg.isGuest) {
      const full = [reg.guestFirstName, reg.guestLastName].filter(Boolean).join(' ');
      return full || 'Visiteur';
    }
    const user = this.users.find(u => u.id === reg.participantId || u.keycloakId === reg.participantId);
    if (!user) return reg.participantId || '—';
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return full || user.username || user.email || reg.participantId;
  }

  getParticipantEmail(reg: Registration): string {
    if (reg.isGuest) return reg.guestEmail || '';
    const user = this.users.find(u => u.id === reg.participantId || u.keycloakId === reg.participantId);
    return user?.email || '';
  }

  getParticipantInitial(reg: Registration): string {
    return this.getParticipantName(reg).charAt(0).toUpperCase() || '?';
  }

  getRegistrationDate(reg: Registration): string {
    return (reg as any).registeredAt || (reg as any).registrationDate || (reg as any).createdAt || '';
  }

  getEventDisplayName(event: Event): string {
    return event.name || event.title || '—';
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => { this.successMsg = null; }, 3000);
  }
}
