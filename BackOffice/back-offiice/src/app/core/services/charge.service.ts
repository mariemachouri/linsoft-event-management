import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Charge {
  id?: string;
  eventId: string;
  description: string;
  amount: number;
  category?: string;
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChargePrediction {
  eventId: string;
  predictedAmount: number;
  confidence?: number;
  factors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChargeService {

  private chargesApiUrl = environment.services.charges;

  constructor(private http: HttpClient) { }

  /**
   * Récupérer toutes les charges
   */
  getAllCharges(): Observable<Charge[]> {
    return this.http.get<Charge[]>(this.chargesApiUrl);
  }

  /**
   * Récupérer une charge par ID
   */
  getChargeById(id: string): Observable<Charge> {
    return this.http.get<Charge>(`${this.chargesApiUrl}/${id}`);
  }

  /**
   * Récupérer les charges par événement
   */
  getChargesByEvent(eventId: string): Observable<Charge[]> {
    return this.http.get<Charge[]>(`${this.chargesApiUrl}/event/${eventId}`);
  }

  /**
   * Créer une nouvelle charge
   */
  createCharge(charge: Charge): Observable<Charge> {
    return this.http.post<Charge>(this.chargesApiUrl, charge);
  }

  /**
   * Mettre à jour une charge
   */
  updateCharge(id: string, charge: Charge): Observable<Charge> {
    return this.http.put<Charge>(`${this.chargesApiUrl}/${id}`, charge);
  }

  /**
   * Supprimer une charge
   */
  deleteCharge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.chargesApiUrl}/${id}`);
  }

  /**
   * Obtenir une prédiction de coût pour un événement (AI)
   */
  getPrediction(eventId: string): Observable<ChargePrediction> {
    return this.http.get<ChargePrediction>(`${this.chargesApiUrl}/predict/${eventId}`);
  }

  /**
   * Récupérer le total des charges par événement
   */
  getTotalByEvent(eventId: string): Observable<number> {
    return this.http.get<number>(`${this.chargesApiUrl}/event/${eventId}/total`);
  }
}
