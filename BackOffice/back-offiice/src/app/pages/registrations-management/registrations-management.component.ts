import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RegistrationService, Registration } from '../../core/services/registration.service';

@Component({
  selector: 'app-registrations-management',
  templateUrl: './registrations-management.component.html',
  styleUrls: ['./registrations-management.component.scss']
})
export class RegistrationsManagementComponent implements OnInit {

  registrations: Registration[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private registrationService: RegistrationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadRegistrations();
  }

  loadRegistrations(): void {
    this.loading = true;
    this.error = null;
    this.registrationService.getAllRegistrations().subscribe({
      next: (data) => {
        this.registrations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading registrations:', err);
        this.error = 'Erreur lors du chargement des inscriptions. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  createRegistration(): void {
    this.router.navigate(['/registrations/create']);
  }

  editRegistration(id: string): void {
    this.router.navigate(['/registrations/edit', id]);
  }

  deleteRegistration(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
      this.registrationService.deleteRegistration(id).subscribe({
        next: () => {
          this.loadRegistrations();
        },
        error: (err) => {
          console.error('Error deleting registration:', err);
          alert('Erreur lors de la suppression de l\'inscription');
        }
      });
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'badge-warning';
      case 'CONFIRMED':
        return 'badge-success';
      case 'WAITLISTED':
        return 'badge-info';
      case 'CANCELLED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmé';
      case 'WAITLISTED':
        return 'Liste d\'attente';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status || 'Inconnu';
    }
  }
}
