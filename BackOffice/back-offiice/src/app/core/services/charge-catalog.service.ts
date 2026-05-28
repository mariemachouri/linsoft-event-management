import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChargeCatalogItem {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;        // pièce, heure, jour, forfait
  defaultUnitPrice: number;
  currency?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChargeItem {
  id?: string;
  eventId: string;
  catalogItemId?: string;
  item?: string;         // alias for description (backend compat)
  description?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  amount?: number;       // calculé côté backend
  currency?: string;
  status?: string;       // PENDING, APPROVED, PAID, REJECTED, CANCELLED
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChargeCatalogService {

  private catalogUrl = `${environment.apiUrl}/api/charge-catalog`;
  private chargesUrl = `${environment.apiUrl}/api/charges`;

  constructor(private http: HttpClient) {}

  // ── Catalogue ──────────────────────────────────────────────────────────────

  getAllCatalogItems(): Observable<ChargeCatalogItem[]> {
    return this.http.get<ChargeCatalogItem[]>(this.catalogUrl);
  }

  getActiveCatalogItems(): Observable<ChargeCatalogItem[]> {
    return this.http.get<ChargeCatalogItem[]>(`${this.catalogUrl}?active=true`);
  }

  getCatalogItemById(id: string): Observable<ChargeCatalogItem> {
    return this.http.get<ChargeCatalogItem>(`${this.catalogUrl}/${id}`);
  }

  createCatalogItem(item: ChargeCatalogItem): Observable<ChargeCatalogItem> {
    return this.http.post<ChargeCatalogItem>(this.catalogUrl, item);
  }

  updateCatalogItem(id: string, item: ChargeCatalogItem): Observable<ChargeCatalogItem> {
    return this.http.put<ChargeCatalogItem>(`${this.catalogUrl}/${id}`, item);
  }

  deleteCatalogItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.catalogUrl}/${id}`);
  }

  // ── Charges d'un événement ─────────────────────────────────────────────────

  getChargesByEvent(eventId: string): Observable<ChargeItem[]> {
    return this.http.get<ChargeItem[]>(`${this.chargesUrl}?eventId=${eventId}`);
  }

  getAllCharges(): Observable<ChargeItem[]> {
    return this.http.get<ChargeItem[]>(this.chargesUrl);
  }

  createChargeItem(item: ChargeItem): Observable<ChargeItem> {
    return this.http.post<ChargeItem>(this.chargesUrl, item);
  }

  updateChargeItem(id: string, item: Partial<ChargeItem>): Observable<ChargeItem> {
    return this.http.put<ChargeItem>(`${this.chargesUrl}/${id}`, item);
  }

  updateChargeStatus(id: string, status: string): Observable<ChargeItem> {
    return this.http.put<ChargeItem>(`${this.chargesUrl}/${id}/status`, { status });
  }

  deleteChargeItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.chargesUrl}/${id}`);
  }
}
