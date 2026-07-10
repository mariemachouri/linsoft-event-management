import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RegistrationService, Registration } from '../../core/services/registration.service';
import { EventService, Event } from '../../core/services/event.service';
import { UserService, UserResponse } from '../../core/services/user.service';
import { LINSOFT_LOGO_BASE64 } from '../../core/constants/pdf-logo.constant';

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

  collapsedState: Record<string, boolean> = {};

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

      groups.push({ event, registrations: regs, isFull, collapsed: !!this.collapsedState[eventId] });
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
    this.collapsedState[group.event.id!] = !this.collapsedState[group.event.id!];
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

  exportToCSV(group: EventGroup): void {
    const eventName = this.getEventDisplayName(group.event);
    const headers = ['Nom', 'Type', 'Email', 'Téléphone', 'Date d\'inscription', 'Statut'];
    const rows = group.registrations.map(reg => [
      this.getParticipantName(reg),
      reg.isGuest ? 'Visiteur' : 'Participant',
      this.getParticipantEmail(reg) || '',
      (reg as any).participantPhone || (reg as any).guestPhone || '',
      this.getRegistrationDate(reg)
        ? new Date(this.getRegistrationDate(reg)).toLocaleDateString('fr-FR') : '',
      reg.status || 'CONFIRMED'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `participants_${eventName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportToPDF(group: EventGroup): void {
    const eventName = this.getEventDisplayName(group.event);
    const date = new Date().toLocaleDateString('fr-FR');
    const rows = group.registrations.map(reg => `
      <tr>
        <td>${this.getParticipantName(reg)}</td>
        <td><span class="badge ${reg.isGuest ? 'badge-guest' : 'badge-member'}">${reg.isGuest ? 'Visiteur' : 'Participant'}</span></td>
        <td>${this.getParticipantEmail(reg) || '—'}</td>
        <td>${this.getRegistrationDate(reg) ? new Date(this.getRegistrationDate(reg)).toLocaleDateString('fr-FR') : '—'}</td>
        <td><span class="status-confirmed">Confirmé</span></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Participants — ${eventName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 30px; color: #222; font-size: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #E30613; padding-bottom: 14px; }
    .logo img { height: 34px; display: block; }
    .meta { text-align: right; color: #666; font-size: 11px; line-height: 1.6; }
    h1 { font-size: 15px; margin-bottom: 4px; color: #111; }
    .subtitle { color: #555; font-size: 11px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #E30613; color: white; }
    th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #fafafa; }
    .badge { padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
    .badge-guest { background: #fff3e0; color: #e65100; }
    .badge-member { background: #e8f5e9; color: #2e7d32; }
    .status-confirmed { color: #27ae60; font-weight: 600; }
    .footer { margin-top: 24px; color: #aaa; font-size: 10px; text-align: center; }
    @media print { body { padding: 15px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><img src="${LINSOFT_LOGO_BASE64}" alt="LinSoft"></div>
    <div class="meta">Gestion d'événements<br>Généré le ${date}</div>
  </div>
  <h1>Liste des participants — ${eventName}</h1>
  <p class="subtitle">${group.registrations.length} participant(s) · ${group.event.maxParticipants ? group.event.maxParticipants + ' places max' : 'places illimitées'}</p>
  <table>
    <thead>
      <tr><th>Nom</th><th>Type</th><th>Email</th><th>Date d'inscription</th><th>Statut</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">LinSoft — Plateforme de gestion d'événements · ${date}</div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    printWindow?.document.write(html);
    printWindow?.document.close();
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => { this.successMsg = null; }, 3000);
  }
}
