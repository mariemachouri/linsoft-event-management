import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegistrationService, Registration } from '../../core/services/registration.service';
import { EventService, Event } from '../../core/services/event.service';
import { UserService, UserResponse } from '../../core/services/user.service';

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
  filterStatus = '';

  get filteredRegistrations(): Registration[] {
    const q = this.searchQuery.toLowerCase();
    return this.registrations.filter(r => {
      const eventName = this.getEventName(r.eventId).toLowerCase();
      const participantName = this.getParticipantName(r.participantId).toLowerCase();
      const matchSearch = !q ||
        eventName.includes(q) ||
        participantName.includes(q) ||
        (r.id || '').toLowerCase().includes(q);
      const matchStatus = !this.filterStatus || (r.status || '').toUpperCase() === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  constructor(
    private registrationService: RegistrationService,
    private eventService: EventService,
    private userService: UserService,
    private router: Router
  ) { }

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

  createRegistration(): void {
    this.router.navigate(['/registrations/create']);
  }

  editRegistration(id: string): void {
    this.router.navigate(['/registrations/edit', id]);
  }

  confirmRegistration(id: string): void {
    this.registrationService.confirmRegistration(id).subscribe({
      next: (updated) => {
        const idx = this.registrations.findIndex(r => r.id === id);
        if (idx !== -1) this.registrations[idx] = updated;
        this.showSuccess('Inscription confirmée avec succès !');
      },
      error: () => { this.error = 'Erreur lors de la confirmation.'; }
    });
  }

  cancelRegistration(id: string): void {
    if (!confirm('Annuler cette inscription ?')) return;
    this.registrationService.cancelRegistration(id).subscribe({
      next: (updated) => {
        const idx = this.registrations.findIndex(r => r.id === id);
        if (idx !== -1) this.registrations[idx] = updated;
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

  getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event ? event.name : eventId || '—';
  }

  getParticipantName(participantId: string): string {
    const user = this.users.find(u => u.id === participantId || u.keycloakId === participantId);
    if (!user) return participantId || '—';
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
    return full || user.username || user.email || participantId;
  }

  getParticipantEmail(participantId: string): string {
    const user = this.users.find(u => u.id === participantId || u.keycloakId === participantId);
    return user?.email || '';
  }

  getRegistrationDate(reg: Registration): string {
    return reg.registeredAt || reg.registrationDate || reg.createdAt || '';
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':    return 'status-pending';
      case 'CONFIRMED':  return 'status-confirmed';
      case 'WAITLISTED': return 'status-waitlisted';
      case 'CANCELLED':  return 'status-cancelled';
      default:           return 'status-pending';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':    return 'En attente';
      case 'CONFIRMED':  return 'Confirmé';
      case 'WAITLISTED': return 'Liste d\'attente';
      case 'CANCELLED':  return 'Annulé';
      default:           return status || 'Inconnu';
    }
  }

  canConfirm(status: string): boolean {
    return status?.toUpperCase() === 'PENDING' || status?.toUpperCase() === 'WAITLISTED';
  }

  canCancel(status: string): boolean {
    return status?.toUpperCase() !== 'CANCELLED';
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => { this.successMsg = null; }, 3000);
  }
}

