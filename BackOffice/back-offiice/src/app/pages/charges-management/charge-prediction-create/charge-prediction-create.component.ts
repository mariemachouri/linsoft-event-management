import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  ChargePredictionService, 
  EventMetrics, 
  EventCategory,
  ChargePrediction
} from '../../../core/services/charge-prediction.service';
import { EventService } from '../../../core/services/event.service';

@Component({
  selector: 'app-charge-prediction-create',
  templateUrl: './charge-prediction-create.component.html',
  styleUrls: ['./charge-prediction-create.component.scss']
})
export class ChargePredictionCreateComponent implements OnInit {
  predictionForm: FormGroup;
  loading = false;
  errorMessage = '';
  events: any[] = [];
  
  // Résultat de la prédiction IA
  predictionResult: ChargePrediction | null = null;
  
  // Étape du workflow (1=formulaire, 2=résultat)
  currentStep = 1;
  
  // Options pour les dropdowns
  eventCategories = Object.values(EventCategory);
  locationOptions = ['online', 'venue'];

  constructor(
    private fb: FormBuilder,
    private chargePredictionService: ChargePredictionService,
    private eventService: EventService,
    private router: Router
  ) {
    this.predictionForm = this.fb.group({
      eventId: ['', Validators.required],
      expectedAttendees: [50, [Validators.required, Validators.min(1)]],
      eventType: [EventCategory.CONFERENCE, Validators.required],
      durationHours: [2, [Validators.required, Validators.min(1)]],
      location: ['venue', Validators.required],
      city: ['', Validators.required],
      cateringRequired: [false],
      equipmentRequired: [false],
      venueSize: [100, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        // Filtrer les événements publiés uniquement
        this.events = events.filter(e => e.status === 'PUBLISHED');
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.errorMessage = 'Impossible de charger les événements';
      }
    });
  }

  onSubmit(): void {
    if (this.predictionForm.invalid) {
      Object.keys(this.predictionForm.controls).forEach(key => {
        this.predictionForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.predictionForm.value;
    
    // Récupérer l'événement sélectionné pour obtenir l'organizerId
    const selectedEvent = this.events.find(e => e.id === formValue.eventId);
    if (!selectedEvent) {
      this.errorMessage = 'Événement non trouvé';
      this.loading = false;
      return;
    }

    const eventMetrics: EventMetrics = {
      expectedAttendees: formValue.expectedAttendees,
      eventType: formValue.eventType,
      durationHours: formValue.durationHours,
      location: formValue.location,
      city: formValue.city,
      cateringRequired: formValue.cateringRequired,
      equipmentRequired: formValue.equipmentRequired,
      venueSize: formValue.venueSize
    };

    const request = {
      eventId: formValue.eventId,
      organizerId: selectedEvent.organizerId,
      eventMetrics: eventMetrics
    };

    this.chargePredictionService.createPrediction(request).subscribe({
      next: (prediction) => {
        this.predictionResult = prediction;
        this.currentStep = 2; // Passer à l'affichage du résultat
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la création de la prédiction:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de la création de la prédiction';
        this.loading = false;
      }
    });
  }

  // Méthodes utilitaires pour le template
  getConfidencePercentage(): number {
    if (!this.predictionResult?.predictionResult) return 0;
    return Math.round(this.predictionResult.predictionResult.confidenceScore * 100);
  }

  getTotalCost(): number {
    if (!this.predictionResult?.predictionResult) return 0;
    return this.predictionResult.predictionResult.predictedTotalCost;
  }

  getBreakdownEntries(): Array<{label: string, value: number, percentage: number}> {
    if (!this.predictionResult?.predictionResult?.breakdown) return [];
    
    const breakdown = this.predictionResult.predictionResult.breakdown;
    const total = this.getTotalCost();
    
    const entries = [
      { label: 'Lieu', value: breakdown.venueCost },
      { label: 'Restauration', value: breakdown.cateringCost },
      { label: 'Équipement', value: breakdown.equipmentCost },
      { label: 'Personnel', value: breakdown.staffingCost },
      { label: 'Marketing', value: breakdown.marketingCost },
      { label: 'Assurance', value: breakdown.insuranceCost },
      { label: 'Divers', value: breakdown.miscellaneousCost }
    ];

    return entries
      .filter(e => e.value > 0)
      .map(e => ({
        ...e,
        percentage: total > 0 ? Math.round((e.value / total) * 100) : 0
      }));
  }

  backToForm(): void {
    this.currentStep = 1;
    this.predictionResult = null;
  }

  goToPaymentDecision(): void {
    if (this.predictionResult) {
      this.router.navigate(['/charges/payment-decision', this.predictionResult.id]);
    }
  }

  cancel(): void {
    this.router.navigate(['/charges']);
  }
}
