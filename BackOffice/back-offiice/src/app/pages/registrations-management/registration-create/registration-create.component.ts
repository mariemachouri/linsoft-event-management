import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationService, Registration } from '../../../core/services/registration.service';
import { EventService, Event } from '../../../core/services/event.service';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-registration-create',
  templateUrl: './registration-create.component.html',
  styleUrls: ['./registration-create.component.scss']
})
export class RegistrationCreateComponent implements OnInit {

  registrationForm: FormGroup;
  loading = false;
  loadingData = true;
  error: string = '';
  success: string = '';
  
  events: Event[] = [];
  users: UserResponse[] = [];
  
  // Options pour les statuts
  statuses = [
    { value: 'PENDING', label: 'En attente', color: 'warning', icon: 'icon-time-alarm' },
    { value: 'CONFIRMED', label: 'Confirmé', color: 'success', icon: 'icon-check-2' },
    { value: 'WAITLISTED', label: 'Liste d\'attente', color: 'info', icon: 'icon-calendar-60' },
    { value: 'CANCELLED', label: 'Annulé', color: 'danger', icon: 'icon-simple-remove' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private registrationService: RegistrationService,
    private eventService: EventService,
    private userService: UserService,
    private router: Router
  ) {
    this.registrationForm = this.formBuilder.group({
      eventId: ['', [Validators.required]],
      participantId: ['', [Validators.required]],
      status: ['PENDING', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadingData = true;
    this.error = '';

    // Charger les événements et utilisateurs en parallèle
    forkJoin({
      events: this.eventService.getAllEvents(),
      users: this.userService.getAllUsers()
    }).subscribe({
      next: (data) => {
        this.events = data.events.filter(e => e.status === 'PUBLISHED'); // Uniquement les événements publiés
        this.users = data.users;
        this.loadingData = false;
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.error = 'Impossible de charger les données. Vérifiez que les services sont actifs.';
        this.loadingData = false;
      }
    });
  }

  get f() {
    return this.registrationForm.controls;
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (this.registrationForm.invalid) {
      Object.keys(this.registrationForm.controls).forEach(key => {
        this.registrationForm.controls[key].markAsTouched();
      });
      return;
    }

    this.loading = true;

    const registrationData: Registration = {
      eventId: this.f['eventId'].value,
      userId: this.f['participantId'].value,
      status: this.f['status'].value,
      registrationDate: new Date().toISOString()
    };

    this.registrationService.createRegistration(registrationData).subscribe({
      next: (registration) => {
        this.success = 'Inscription créée avec succès !';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/registrations']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error creating registration:', err);
        this.loading = false;
        
        if (err.status === 400) {
          this.error = 'Données invalides. Vérifiez les champs du formulaire';
        } else if (err.status === 409) {
          this.error = 'Cet utilisateur est déjà inscrit à cet événement';
        } else {
          this.error = 'Erreur lors de la création de l\'inscription';
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/registrations']);
  }

  getEventDisplay(event: Event): string {
    const date = new Date(event.startDate);
    return `${event.name} - ${date.toLocaleDateString('fr-FR')}`;
  }

  getUserDisplay(user: UserResponse): string {
    return `${user.username} - ${user.email}`;
  }

  getStatusColor(status: string): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'secondary';
  }

  getStatusLabel(status: string): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  }
}
