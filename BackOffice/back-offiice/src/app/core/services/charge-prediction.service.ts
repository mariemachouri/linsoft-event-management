import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces TypeScript correspondant au modèle Java
export interface EventMetrics {
  expectedAttendees: number;
  eventType: EventCategory;
  durationHours: number;
  location: string; // "online" ou "venue"
  city: string;
  cateringRequired: boolean;
  equipmentRequired: boolean;
  venueSize: number; // en m²
}

export interface CostBreakdown {
  venueCost: number;
  cateringCost: number;
  equipmentCost: number;
  staffingCost: number;
  marketingCost: number;
  insuranceCost: number;
  miscellaneousCost: number;
}

export interface ItemRecommendation {
  item: ChargeItemType;
  suggestedQuantity: number;
  reason: string;
}

export interface PredictionResult {
  predictedTotalCost: number;
  confidenceScore: number; // 0.0 à 1.0
  breakdown: CostBreakdown;
  aiModel: string; // "linear_regression", "neural_network"
  riskFactors: string[];
  recommendations: string[];
  itemRecommendations: ItemRecommendation[];
}

export interface PaymentDecision {
  paymentMethod: PaymentMethod;
  decidedBy: string; // User ID
  decisionDate: string;
  reason: string;
  requiresApproval: boolean;
}

export interface ChargePrediction {
  id?: string;
  eventId: string;
  organizerId: string;
  eventMetrics: EventMetrics;
  predictionResult?: PredictionResult;
  paymentDecision?: PaymentDecision;
  status: ChargeStatus;
  createdAt?: string;
}

export interface PredictionRequest {
  eventId: string;
  organizerId: string;
  eventMetrics: EventMetrics;
}

export interface PaymentDecisionRequest {
  paymentMethod: PaymentMethod;
  decidedBy: string;
  reason: string;
}

export interface ApprovalRequest {
  adminId: string;
  approved: boolean;
}

// Enums correspondant au backend Java
export enum EventCategory {
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  MEETUP = 'MEETUP',
  SEMINAR = 'SEMINAR'
}

export enum ChargeStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED'
}

export enum PaymentMethod {
  ONLINE = 'ONLINE',
  ONSITE = 'ONSITE',
  HYBRID = 'HYBRID'
}

export enum ChargeItemType {
  STYLO = 'STYLO',
  PC_PORTABLE = 'PC_PORTABLE',
  PROJECTEUR = 'PROJECTEUR',
  TABLE = 'TABLE',
  CHAISE = 'CHAISE',
  CABLE_HDMI = 'CABLE_HDMI',
  MICROPHONE = 'MICROPHONE'
}

@Injectable({
  providedIn: 'root'
})
export class ChargePredictionService {
  private apiUrl = `${environment.apiUrl}/charges-service/api/charge-predictions`;

  constructor(private http: HttpClient) {}

  // Lister toutes les prédictions
  getAllPredictions(): Observable<ChargePrediction[]> {
    return this.http.get<ChargePrediction[]>(this.apiUrl);
  }

  // Récupérer une prédiction par ID
  getPredictionById(id: string): Observable<ChargePrediction> {
    return this.http.get<ChargePrediction>(`${this.apiUrl}/${id}`);
  }

  // Créer une nouvelle prédiction avec IA
  createPrediction(request: PredictionRequest): Observable<ChargePrediction> {
    return this.http.post<ChargePrediction>(`${this.apiUrl}/predict`, request);
  }

  // Mettre à jour la décision de paiement
  updatePaymentDecision(
    predictionId: string,
    request: PaymentDecisionRequest
  ): Observable<ChargePrediction> {
    return this.http.put<ChargePrediction>(
      `${this.apiUrl}/${predictionId}/payment-decision`,
      request
    );
  }

  // Approuver ou rejeter une prédiction (admin uniquement)
  approvePrediction(
    predictionId: string,
    request: ApprovalRequest
  ): Observable<ChargePrediction> {
    return this.http.put<ChargePrediction>(
      `${this.apiUrl}/${predictionId}/approval`,
      request
    );
  }
}
