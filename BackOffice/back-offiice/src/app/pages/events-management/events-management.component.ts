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
      case 'CONFERENCE': return 'Conférence';
      case 'WORKSHOP':   return 'Atelier';
      case 'MEETUP':     return 'Rencontre';
      case 'SEMINAR':    return 'Séminaire';
      default:           return category;
    }
  }

  exportToCSV(): void {
    const headers = ['Titre', 'Catégorie', 'Statut', 'Date début', 'Lieu', 'Participants', 'Capacité max'];
    const rows = this.upcomingEvents.map(e => [
      e.name || e.title || '',
      this.getCategoryLabel(e.category || ''),
      this.getStatusLabel(e.status || ''),
      e.startDate || e.startAt || '',
      e.location || '',
      String(e.currentParticipants ?? 0),
      String(e.maxParticipants ?? '∞')
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evenements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportToPDF(): void {
    const today = new Date().toLocaleDateString('fr-FR');
    const rows = this.upcomingEvents.map(e => `
      <tr>
        <td>${e.name || e.title || '—'}</td>
        <td>${this.getCategoryLabel(e.category || '')}</td>
        <td><span class="badge badge-${e.status?.toLowerCase()}">${this.getStatusLabel(e.status || '')}</span></td>
        <td>${e.startDate || e.startAt ? new Date(e.startDate || e.startAt || '').toLocaleDateString('fr-FR') : '—'}</td>
        <td>${e.location || '—'}</td>
        <td>${e.currentParticipants ?? 0} / ${e.maxParticipants ?? '∞'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Événements</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;padding:30px;font-size:12px;color:#222}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #E30613;padding-bottom:14px;margin-bottom:24px}
  .logo{font-size:20px;font-weight:900}.logo span{color:#E30613}
  .meta{text-align:right;color:#888;font-size:11px;line-height:1.8}
  h1{font-size:15px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#E30613;color:#fff}
  th{padding:9px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase}
  td{padding:8px 12px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#fafafa}
  .badge{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
  .badge-published{background:#e8f5e9;color:#27ae60}
  .badge-draft{background:#fff3e0;color:#e67e22}
  .badge-cancelled{background:#fdecea;color:#e74c3c}
  .badge-completed{background:#e3f2fd;color:#1565c0}
  .footer{margin-top:20px;color:#aaa;font-size:10px;text-align:center}
  @media print{body{padding:15px}}
</style></head><body>
  <div class="header">
    <div class="logo">LN<span>SOFT</span></div>
    <div class="meta">Gestion d'événements<br>Généré le ${today}</div>
  </div>
  <h1>Liste des événements (${this.upcomingEvents.length})</h1>
  <table>
    <thead><tr><th>Titre</th><th>Catégorie</th><th>Statut</th><th>Date début</th><th>Lieu</th><th>Participants</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">LinSoft · ${today}</div>
  <script>window.onload=()=>window.print()</script>
</body></html>`;
    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
  }
}
