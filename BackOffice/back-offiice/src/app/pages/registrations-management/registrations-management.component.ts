import { Component, OnInit } from '@angular/core';
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

  constructor(private registrationService: RegistrationService) { }

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
        this.error = 'Failed to load registrations. Please try again.';
        this.loading = false;
      }
    });
  }

  deleteRegistration(id: string): void {
    if (confirm('Are you sure you want to delete this registration?')) {
      this.registrationService.deleteRegistration(id).subscribe({
        next: () => {
          this.loadRegistrations();
        },
        error: (err) => {
          console.error('Error deleting registration:', err);
          alert('Failed to delete registration');
        }
      });
    }
  }
}
