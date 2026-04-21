import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistrationService, Registration } from '../../../core/services/registration.service';
import { EventService, Event } from '../../../core/services/event.service';
import { UserService, UserResponse } from '../../../core/services/user.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-registration-edit',
  templateUrl: './registration-edit.component.html',
  styleUrls: ['./registration-edit.component.scss']
})
export class RegistrationEditComponent implements OnInit {

  registrationForm: FormGroup;
  loading = false;
  loadingRegistration = true;
  loadingData = true;
  error: string = '';
  success: string = '';
  registrationId: string = '';
  currentRegistration: Registration | null = null;
  
  events: Event[] = [];
  users: UserResponse[] = [];
  
  // Options pour les statuts
  statuses = [
    { value: 'PENDING', label: 'Pending', color: 'warning', icon: 'icon-time-alarm', description: 'Awaiting confirmation' },
    { value: 'CONFIRMED', label: 'Confirmed', color: 'success', icon: 'icon-check-2', description: 'Registration confirmed' },
    { value: 'WAITLISTED', label: 'Waitlisted', color: 'info', icon: 'icon-calendar-60', description: 'On waiting list' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'danger', icon: 'icon-simple-remove', description: 'Registration cancelled' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private registrationService: RegistrationService,
    private eventService: EventService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.registrationForm = this.formBuilder.group({
      eventId: [{ value: '', disabled: true }, [Validators.required]],
      participantId: [{ value: '', disabled: true }, [Validators.required]],
      status: ['PENDING', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.registrationId = this.route.snapshot.params['id'];
    this.loadData();
  }

  loadData(): void {
    this.loadingData = true;
    this.error = '';

    // Charger inscription, événements et utilisateurs en parallèle
    forkJoin({
      registration: this.registrationService.getRegistrationById(this.registrationId),
      events: this.eventService.getAllEvents(),
      users: this.userService.getAllUsers()
    }).subscribe({
      next: (data) => {
        this.currentRegistration = data.registration;
        this.events = data.events;
        this.users = data.users;
        
        this.registrationForm.patchValue({
          eventId: data.registration.eventId,
          participantId: data.registration.userId,
          status: data.registration.status || 'PENDING'
        });
        
        this.loadingData = false;
        this.loadingRegistration = false;
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.error = 'Unable to load data';
        this.loadingData = false;
        this.loadingRegistration = false;
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
      id: this.registrationId,
      eventId: this.currentRegistration!.eventId,
      participantId: this.currentRegistration!.participantId,
      status: this.f['status'].value,
      registrationDate: this.currentRegistration!.registrationDate
    };

    this.registrationService.updateRegistration(this.registrationId, registrationData).subscribe({
      next: (registration) => {
        this.success = 'Inscription mise à jour avec succès !';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/registrations']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error updating registration:', err);
        this.loading = false;
        
        if (err.status === 400) {
          this.error = 'Données invalides';
        } else if (err.status === 404) {
          this.error = 'Inscription non trouvée';
        } else {
          this.error = 'Error updating registration';
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/registrations']);
  }

  getEventDisplay(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    if (!event) return 'Événement inconnu';
    
    const date = new Date(event.startDate);
    return `${event.name} - ${date.toLocaleDateString('fr-FR')}`;
  }

  getUserDisplay(userId: string): string {
    const user = this.users.find(u => u.id === userId);
    if (!user) return 'Utilisateur inconnu';
    
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

  getStatusDescription(status: string): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj ? statusObj.description : '';
  }

  getStatusIcon(status: string): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj ? statusObj.icon : 'icon-single-02';
  }
}
