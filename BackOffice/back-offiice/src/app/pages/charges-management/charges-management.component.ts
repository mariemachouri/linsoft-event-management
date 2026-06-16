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
}
