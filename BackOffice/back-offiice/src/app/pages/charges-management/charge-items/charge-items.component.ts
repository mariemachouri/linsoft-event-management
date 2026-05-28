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

  statuses = ['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'];
  allCharges: ChargeItem[] = []; // toutes les charges tous events confondus

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
    // Charger toutes les charges au démarrage (historique global)
    this.loadAllCharges();
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
      next: (data) => { this.charges = data; this.loading = false; this.loadAllCharges(); },
      error: () => { this.errorMessage = 'Erreur lors du chargement des charges.'; this.loading = false; }
    });
  }

  loadAllCharges(): void {
    this.catalogService.getAllCharges().subscribe({
      next: (data) => { this.allCharges = data; },
      error: () => {}
    });
  }

  getEventName(eventId: string): string {
    const ev = this.events.find(e => e.id === eventId);
    return ev?.title || ev?.name || eventId;
  }

  cancelCharge(charge: ChargeItem): void {
    if (!confirm(`Annuler la charge "${charge.description || charge.item}" ?`)) return;
    this.catalogService.updateChargeStatus(charge.id!, 'REJECTED').subscribe({
      next: () => {
        this.successMessage = 'Charge annulée.';
        setTimeout(() => this.successMessage = '', 3000);
        this.loadAllCharges();
        if (this.selectedEventId) this.loadCharges();
      },
      error: () => { this.errorMessage = 'Erreur lors de l\'annulation.'; }
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
        next: () => {
          this.successMessage = 'Charge mise à jour.';
          setTimeout(() => this.successMessage = '', 3000);
          this.showForm = false;
          this.loadCharges();
          this.loadAllCharges();
        },
        error: () => { this.errorMessage = 'Erreur lors de la mise à jour.'; setTimeout(() => this.errorMessage = '', 4000); }
      });
    } else {
      this.catalogService.createChargeItem(this.form).subscribe({
        next: () => {
          this.successMessage = 'Charge ajoutée avec succès.';
          setTimeout(() => this.successMessage = '', 3000);
          this.showForm = false;
          this.loadCharges();
          this.loadAllCharges();
        },
        error: () => { this.errorMessage = 'Erreur lors de la création.'; setTimeout(() => this.errorMessage = '', 4000); }
      });
    }
  }

  updateStatus(charge: ChargeItem, status: string): void {
    this.catalogService.updateChargeStatus(charge.id!, status).subscribe({
      next: () => {
        this.successMessage = 'Statut mis à jour.';
        setTimeout(() => this.successMessage = '', 3000);
        this.loadCharges();
        this.loadAllCharges();
      },
      error: () => { this.errorMessage = 'Erreur lors de la mise à jour du statut.'; setTimeout(() => this.errorMessage = '', 4000); }
    });
  }

  delete(charge: ChargeItem): void {
    if (!confirm('Supprimer cette charge ?')) return;
    this.catalogService.deleteChargeItem(charge.id!).subscribe({
      next: () => {
        this.successMessage = 'Charge supprimée.';
        setTimeout(() => this.successMessage = '', 3000);
        this.loadCharges();
        this.loadAllCharges();
      },
      error: () => { this.errorMessage = 'Erreur lors de la suppression.'; setTimeout(() => this.errorMessage = '', 4000); }
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
