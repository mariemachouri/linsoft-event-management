import { Component, OnInit } from '@angular/core';
import { ChargeCatalogService, ChargeCatalogItem } from '../../../core/services/charge-catalog.service';

@Component({
  selector: 'app-charge-catalog',
  templateUrl: './charge-catalog.component.html',
  styleUrls: ['./charge-catalog.component.scss']
})
export class ChargeCatalogComponent implements OnInit {

  items: ChargeCatalogItem[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  showForm = false;
  editMode = false;
  selectedId: string | null = null;

  form: ChargeCatalogItem = this.emptyForm();

  categories = ['EQUIPMENT', 'SUPPLIES', 'VENUE', 'CATERING', 'STAFFING', 'MARKETING', 'INSURANCE', 'OTHER'];
  units = ['pièce', 'heure', 'jour', 'forfait'];

  constructor(private catalogService: ChargeCatalogService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.catalogService.getAllCatalogItems().subscribe({
      next: (data) => { this.items = data; this.loading = false; },
      error: () => { this.errorMessage = 'Erreur lors du chargement du catalogue.'; this.loading = false; }
    });
  }

  openAdd(): void {
    this.form = this.emptyForm();
    this.editMode = false;
    this.selectedId = null;
    this.showForm = true;
    this.clearMessages();
  }

  openEdit(item: ChargeCatalogItem): void {
    this.form = { ...item };
    this.editMode = true;
    this.selectedId = item.id || null;
    this.showForm = true;
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm = false;
    this.clearMessages();
  }

  save(): void {
    if (!this.form.name?.trim()) {
      this.errorMessage = 'Le nom est obligatoire.';
      return;
    }
    if (this.editMode && this.selectedId) {
      this.catalogService.updateCatalogItem(this.selectedId, this.form).subscribe({
        next: () => { this.successMessage = 'Élément mis à jour.'; this.showForm = false; this.loadItems(); },
        error: () => { this.errorMessage = 'Erreur lors de la mise à jour.'; }
      });
    } else {
      this.catalogService.createCatalogItem(this.form).subscribe({
        next: () => { this.successMessage = 'Élément ajouté au catalogue.'; this.showForm = false; this.loadItems(); },
        error: () => { this.errorMessage = 'Erreur lors de la création.'; }
      });
    }
  }

  delete(item: ChargeCatalogItem): void {
    if (!confirm(`Supprimer "${item.name}" du catalogue ?`)) return;
    this.catalogService.deleteCatalogItem(item.id!).subscribe({
      next: () => { this.successMessage = 'Élément supprimé.'; this.loadItems(); },
      error: () => { this.errorMessage = 'Erreur lors de la suppression.'; }
    });
  }

  private emptyForm(): ChargeCatalogItem {
    return { name: '', description: '', category: 'EQUIPMENT', unit: 'pièce', defaultUnitPrice: 0, currency: 'EUR', active: true };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
