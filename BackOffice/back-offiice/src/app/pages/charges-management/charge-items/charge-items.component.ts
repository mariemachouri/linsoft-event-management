import { Component, OnInit } from '@angular/core';
import { ChargeCatalogService, ChargeCatalogItem, ChargeItem } from '../../../core/services/charge-catalog.service';
import { EventService, Event } from '../../../core/services/event.service';

@Component({
  selector: 'app-charge-items',
  templateUrl: './charge-items.component.html',
  styleUrls: ['./charge-items.component.scss']
})
export class ChargeItemsComponent implements OnInit {

  events: Event[] = [];
  selectedEventId: string = '';
  selectedEventName: string = '';

  charges: ChargeItem[] = [];
  catalogItems: ChargeCatalogItem[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  showForm = false;
  editMode = false;
  selectedChargeId: string | null = null;

  form: ChargeItem = this.emptyForm();
  autoAmount = 0;

  statuses = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'];

  constructor(
    private catalogService: ChargeCatalogService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.eventService.getAllEvents().subscribe({
      next: (data) => { this.events = data; },
      error: () => { this.errorMessage = 'Impossible de charger les événements.'; }
    });
    this.catalogService.getActiveCatalogItems().subscribe({
      next: (data) => { this.catalogItems = data; },
      error: () => {}
    });
  }

  onEventChange(): void {
    if (!this.selectedEventId) { this.charges = []; return; }
    const ev = this.events.find(e => e.id === this.selectedEventId);
    this.selectedEventName = ev?.title || ev?.name || this.selectedEventId;
    this.loadCharges();
  }

  loadCharges(): void {
    this.loading = true;
    this.catalogService.getChargesByEvent(this.selectedEventId).subscribe({
      next: (data) => { this.charges = data; this.loading = false; },
      error: () => { this.errorMessage = 'Erreur lors du chargement des charges.'; this.loading = false; }
    });
  }

  openAdd(): void {
    this.form = this.emptyForm();
    this.form.eventId = this.selectedEventId;
    this.autoAmount = 0;
    this.editMode = false;
    this.selectedChargeId = null;
    this.showForm = true;
    this.clearMessages();
  }

  openEdit(charge: ChargeItem): void {
    this.form = { ...charge };
    this.autoAmount = this.form.amount || 0;
    this.editMode = true;
    this.selectedChargeId = charge.id || null;
    this.showForm = true;
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm = false;
    this.clearMessages();
  }

  onCatalogChange(): void {
    if (!this.form.catalogItemId) return;
    const cat = this.catalogItems.find(c => c.id === this.form.catalogItemId);
    if (cat) {
      if (!this.form.description) this.form.description = cat.name;
      this.form.unitPrice = cat.defaultUnitPrice;
      this.recalcAmount();
    }
  }

  onQuantityChange(): void {
    this.recalcAmount();
  }

  onUnitPriceChange(): void {
    this.recalcAmount();
  }

  recalcAmount(): void {
    const qty = this.form.quantity || 1;
    const price = this.form.unitPrice || 0;
    this.autoAmount = qty * price;
  }

  save(): void {
    if (!this.form.eventId) {
      this.errorMessage = 'Sélectionnez un événement.';
      return;
    }
    if (this.autoAmount > 0) this.form.amount = this.autoAmount;

    if (this.editMode && this.selectedChargeId) {
      this.catalogService.updateChargeItem(this.selectedChargeId, this.form).subscribe({
        next: () => { this.successMessage = 'Charge mise à jour.'; this.showForm = false; this.loadCharges(); },
        error: () => { this.errorMessage = 'Erreur lors de la mise à jour.'; }
      });
    } else {
      this.catalogService.createChargeItem(this.form).subscribe({
        next: () => { this.successMessage = 'Charge ajoutée avec succès.'; this.showForm = false; this.loadCharges(); },
        error: () => { this.errorMessage = 'Erreur lors de la création.'; }
      });
    }
  }

  updateStatus(charge: ChargeItem, status: string): void {
    this.catalogService.updateChargeStatus(charge.id!, status).subscribe({
      next: () => { this.successMessage = 'Statut mis à jour.'; this.loadCharges(); },
      error: () => { this.errorMessage = 'Erreur lors de la mise à jour du statut.'; }
    });
  }

  delete(charge: ChargeItem): void {
    if (!confirm('Supprimer cette charge ?')) return;
    this.catalogService.deleteChargeItem(charge.id!).subscribe({
      next: () => { this.successMessage = 'Charge supprimée.'; this.loadCharges(); },
      error: () => { this.errorMessage = 'Erreur lors de la suppression.'; }
    });
  }

  getTotalAmount(): number {
    return this.charges.reduce((sum, c) => sum + (c.amount || 0), 0);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-info',
      PAID: 'badge-success',
      REJECTED: 'badge-danger'
    };
    return map[status] || 'badge-secondary';
  }

  private emptyForm(): ChargeItem {
    return { eventId: '', catalogItemId: '', description: '', quantity: 1, unitPrice: 0, currency: 'EUR', status: 'PENDING' };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
