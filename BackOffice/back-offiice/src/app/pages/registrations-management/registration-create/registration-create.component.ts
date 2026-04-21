import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationService, Registration } from '../../../core/services/registration.service';
import { EventService, Event } from '../../../core/services/event.service';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
    { value: 'PENDING', label: 'Pending', color: 'warning', icon: 'icon-time-alarm' },
    { value: 'CONFIRMED', label: 'Confirmed', color: 'success', icon: 'icon-check-2' },
    { value: 'WAITLISTED', label: 'Waitlisted', color: 'info', icon: 'icon-calendar-60' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'danger', icon: 'icon-simple-remove' }
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

    forkJoin({
      events: this.eventService.getAllEvents().pipe(catchError(() => of([]))),
      users: this.userService.getAllUsers().pipe(catchError(() => of([])))
    }).subscribe({
      next: (data) => {
        this.events = (data.events as Event[]).filter(e => e.status === 'PUBLISHED');
        this.users = data.users as UserResponse[];
        this.loadingData = false;
      },
      error: () => {
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
      participantId: this.f['participantId'].value,
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
          this.error = 'Error creating registration';
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
