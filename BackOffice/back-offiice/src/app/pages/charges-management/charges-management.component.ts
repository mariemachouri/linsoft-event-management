import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  ChargePredictionService,
  ChargePrediction,
  ChargeStatus
} from '../../core/services/charge-prediction.service';
import { AuthService } from '../../core/services/auth.service';
import { EventService, Event as EventModel } from '../../core/services/event.service';

@Component({
  selector: 'app-charges-management',
  templateUrl: './charges-management.component.html',
  styleUrls: ['./charges-management.component.scss']
})
export class ChargesManagementComponent implements OnInit {
  predictions: ChargePrediction[] = [];
  events: EventModel[] = [];
  loading = false;
  errorMessage = '';
  isAdmin = false;
  searchQuery = '';
  filterStatus = '';

  get filteredPredictions(): ChargePrediction[] {
    const q = this.searchQuery.toLowerCase();
    return this.predictions.filter(p => {
      const matchSearch = !q ||
        (p.eventId || '').toLowerCase().includes(q) ||
        (p.organizerId || '').toLowerCase().includes(q);
      const matchStatus = !this.filterStatus || p.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  constructor(
    private chargePredictionService: ChargePredictionService,
    private authService: AuthService,
    private eventService: EventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('admin');
    this.loadPredictions();
    this.eventService.getAllEvents().subscribe({ next: (events) => this.events = events, error: () => {} });
  }

  getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event ? (event.title || event.name || eventId) : eventId;
  }

  loadPredictions(): void {
    this.loading = true;
    this.chargePredictionService.getAllPredictions().subscribe({
      next: (predictions) => {
        this.predictions = predictions;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading predictions:', error);
        this.errorMessage = 'Unable to load predictions';
        this.loading = false;
      }
    });
  }

  createPrediction(): void {
    this.router.navigate(['/charges/create']);
  }

  viewDetails(prediction: ChargePrediction): void {
    this.router.navigate(['/charges/payment-decision', prediction.id]);
  }

  approvePrediction(prediction: ChargePrediction): void {
    if (!this.isAdmin) {
      alert('Seuls les administrateurs peuvent approuver les prédictions');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir APPROUVER cette prédiction de ${this.getTotalCost(prediction)} € ?`)) {
      const request = {
        adminId: this.authService.getCurrentUserId(),
        approved: true
      };

      this.chargePredictionService.approvePrediction(prediction.id!, request).subscribe({
        next: () => {
          alert('Prédiction approuvée avec succès');
          this.loadPredictions(); // Recharger la liste
        },
        error: (error) => {
          console.error('Error approving:', error);
          alert('Error approving prediction');
        }
      });
    }
  }

  rejectPrediction(prediction: ChargePrediction): void {
    if (!this.isAdmin) {
      alert('Seuls les administrateurs peuvent rejeter les prédictions');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir REJETER cette prédiction de ${this.getTotalCost(prediction)} € ?`)) {
      const request = {
        adminId: this.authService.getCurrentUserId(),
        approved: false
      };

      this.chargePredictionService.approvePrediction(prediction.id!, request).subscribe({
        next: () => {
          alert('Prédiction rejetée');
          this.loadPredictions(); // Recharger la liste
        },
        error: (error) => {
          console.error('Error rejecting:', error);
          alert('Error rejecting prediction');
        }
      });
    }
  }

  // Méthodes utilitaires pour le template
  getTotalCost(prediction: ChargePrediction): number {
    return prediction.predictionResult?.predictedTotalCost || 0;
  }

  getConfidencePercentage(prediction: ChargePrediction): number {
    if (!prediction.predictionResult) return 0;
    return Math.round(prediction.predictionResult.confidenceScore * 100);
  }

  getStatusBadgeClass(status: ChargeStatus): string {
    const classes = {
      [ChargeStatus.PENDING]: 'badge-warning',
      [ChargeStatus.APPROVED]: 'badge-success',
      [ChargeStatus.PAID]: 'badge-info',
      [ChargeStatus.REJECTED]: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  }

  getStatusLabel(status: ChargeStatus): string {
    const labels = {
      [ChargeStatus.PENDING]: 'En attente',
      [ChargeStatus.APPROVED]: 'Approuvé',
      [ChargeStatus.PAID]: 'Payé',
      [ChargeStatus.REJECTED]: 'Rejeté'
    };
    return labels[status] || status;
  }

  requiresApproval(prediction: ChargePrediction): boolean {
    return prediction.paymentDecision?.requiresApproval || false;
  }

  canApprove(prediction: ChargePrediction): boolean {
    return this.isAdmin && 
           prediction.status === ChargeStatus.PENDING && 
           this.requiresApproval(prediction);
  }

  canReject(prediction: ChargePrediction): boolean {
    return this.isAdmin &&
           (prediction.status === ChargeStatus.PENDING || prediction.status === ChargeStatus.APPROVED);
  }

  exportToCSV(): void {
    const headers = ['Événement', 'Organisateur', 'Coût prédit (€)', 'Confiance (%)', 'Statut', 'Approbation requise'];
    const rows = this.filteredPredictions.map(p => [
      this.getEventName(p.eventId || ''),
      p.organizerId || '—',
      String(this.getTotalCost(p).toFixed(2)),
      String(this.getConfidencePercentage(p)) + '%',
      this.getStatusLabel(p.status as ChargeStatus),
      this.requiresApproval(p) ? 'Oui' : 'Non'
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `charges_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportToPDF(): void {
    const today = new Date().toLocaleDateString('fr-FR');
    const totalBudget = this.filteredPredictions.reduce((s, p) => s + this.getTotalCost(p), 0);
    const avgConfidence = this.filteredPredictions.length
      ? Math.round(this.filteredPredictions.reduce((s, p) => s + this.getConfidencePercentage(p), 0) / this.filteredPredictions.length)
      : 0;

    const rows = this.filteredPredictions.map(p => `
      <tr>
        <td>${this.getEventName(p.eventId || '')}</td>
        <td>${p.organizerId || '—'}</td>
        <td style="font-weight:700;color:#E30613">${this.getTotalCost(p).toFixed(2)} €</td>
        <td>
          <div class="conf-bar">
            <div class="conf-fill" style="width:${this.getConfidencePercentage(p)}%"></div>
          </div>
          <span>${this.getConfidencePercentage(p)}%</span>
        </td>
        <td><span class="badge badge-${p.status?.toLowerCase()}">${this.getStatusLabel(p.status as ChargeStatus)}</span></td>
        <td>${this.requiresApproval(p) ? '<span style="color:#e67e22">⚠ Oui</span>' : '<span style="color:#27ae60">✓ Non</span>'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Prédictions IA — Charges</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;padding:30px;font-size:12px;color:#222}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #E30613;padding-bottom:14px;margin-bottom:20px}
  .logo{font-size:20px;font-weight:900}.logo span{color:#E30613}
  .meta{text-align:right;color:#888;font-size:11px;line-height:1.8}
  .kpi-row{display:flex;gap:16px;margin-bottom:20px}
  .kpi{flex:1;border:1px solid #eee;border-radius:8px;padding:12px 16px;text-align:center}
  .kpi-val{display:block;font-size:20px;font-weight:900;color:#E30613}
  .kpi-lbl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.5px}
  h1{font-size:15px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#E30613;color:#fff}
  th{padding:9px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase}
  td{padding:8px 12px;border-bottom:1px solid #eee;vertical-align:middle}
  tr:nth-child(even) td{background:#fafafa}
  .badge{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
  .badge-pending{background:#fff3e0;color:#e67e22}
  .badge-approved{background:#e8f5e9;color:#27ae60}
  .badge-paid{background:#e3f2fd;color:#1565c0}
  .badge-rejected{background:#fdecea;color:#e74c3c}
  .conf-bar{display:inline-block;width:60px;height:6px;background:#eee;border-radius:4px;margin-right:6px;vertical-align:middle}
  .conf-fill{height:100%;background:linear-gradient(90deg,#E30613,#ff6b6b);border-radius:4px}
  .footer{margin-top:20px;color:#aaa;font-size:10px;text-align:center}
  @media print{body{padding:15px}}
</style></head><body>
  <div class="header">
    <div class="logo">LN<span>SOFT</span></div>
    <div class="meta">Prédictions IA — Charges par événement<br>Généré le ${today}</div>
  </div>
  <div class="kpi-row">
    <div class="kpi"><span class="kpi-val">${this.filteredPredictions.length}</span><span class="kpi-lbl">Prédictions</span></div>
    <div class="kpi"><span class="kpi-val">${totalBudget.toFixed(2)} €</span><span class="kpi-lbl">Budget total prédit</span></div>
    <div class="kpi"><span class="kpi-val">${avgConfidence}%</span><span class="kpi-lbl">Confiance moyenne IA</span></div>
  </div>
  <h1>Charges par événement — Prédictions IA</h1>
  <table>
    <thead><tr><th>Événement</th><th>Organisateur</th><th>Coût prédit</th><th>Confiance IA</th><th>Statut</th><th>Approbation</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">LinSoft · Système de prédiction IA des charges · ${today}</div>
  <script>window.onload=()=>window.print()</script>
</body></html>`;
    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
  }
}
