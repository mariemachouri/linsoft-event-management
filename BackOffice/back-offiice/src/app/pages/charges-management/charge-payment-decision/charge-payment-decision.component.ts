import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  ChargePredictionService, 
  ChargePrediction,
  PaymentMethod
} from '../../../core/services/charge-prediction.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-charge-payment-decision',
  templateUrl: './charge-payment-decision.component.html',
  styleUrls: ['./charge-payment-decision.component.scss']
})
export class ChargePaymentDecisionComponent implements OnInit {
  decisionForm: FormGroup;
  loading = false;
  errorMessage = '';
  prediction: ChargePrediction | null = null;
  predictionId: string = '';
  
  paymentMethods = Object.values(PaymentMethod);

  constructor(
    private fb: FormBuilder,
    private chargePredictionService: ChargePredictionService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.decisionForm = this.fb.group({
      paymentMethod: [PaymentMethod.ONLINE, Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.predictionId = this.route.snapshot.paramMap.get('id') || '';
    if (this.predictionId) {
      this.loadPrediction();
    } else {
      this.errorMessage = 'ID de prédiction manquant';
    }
  }

  loadPrediction(): void {
    this.loading = true;
    this.chargePredictionService.getPredictionById(this.predictionId).subscribe({
      next: (prediction) => {
        this.prediction = prediction;
        
        // Si une décision existe déjà, pré-remplir le formulaire
        if (prediction.paymentDecision) {
          this.decisionForm.patchValue({
            paymentMethod: prediction.paymentDecision.paymentMethod,
            reason: prediction.paymentDecision.reason
          });
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la prédiction:', error);
        this.errorMessage = 'Prédiction non trouvée';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.decisionForm.invalid) {
      Object.keys(this.decisionForm.controls).forEach(key => {
        this.decisionForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request = {
      paymentMethod: this.decisionForm.value.paymentMethod,
      decidedBy: this.authService.getCurrentUserId(), // Récupérer l'ID utilisateur actuel
      reason: this.decisionForm.value.reason
    };

    this.chargePredictionService.updatePaymentDecision(this.predictionId, request).subscribe({
      next: (updatedPrediction) => {
        this.prediction = updatedPrediction;
        this.loading = false;
        
        // Afficher un message de succès et rediriger
        alert('Décision de paiement enregistrée avec succès !');
        
        // Si une approbation est requise, informer l'utilisateur
        if (updatedPrediction.paymentDecision?.requiresApproval) {
          alert('Cette prédiction nécessite une approbation admin (montant > 5000€)');
        }
        
        this.router.navigate(['/charges']);
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement de la décision:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'enregistrement';
        this.loading = false;
      }
    });
  }

  // Méthodes utilitaires pour le template
  getTotalCost(): number {
    if (!this.prediction?.predictionResult) return 0;
    return this.prediction.predictionResult.predictedTotalCost;
  }

  getConfidencePercentage(): number {
    if (!this.prediction?.predictionResult) return 0;
    return Math.round(this.prediction.predictionResult.confidenceScore * 100);
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const labels = {
      [PaymentMethod.ONLINE]: 'Paiement en ligne',
      [PaymentMethod.ONSITE]: 'Paiement sur place',
      [PaymentMethod.HYBRID]: 'Paiement hybride'
    };
    return labels[method] || method;
  }

  cancel(): void {
    this.router.navigate(['/charges']);
  }
}
