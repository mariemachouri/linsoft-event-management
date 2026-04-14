import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService, Event } from '../../../core/services/event.service';

@Component({
  selector: 'app-event-edit',
  templateUrl: './event-edit.component.html',
  styleUrls: ['./event-edit.component.scss']
})
export class EventEditComponent implements OnInit {

  eventForm: FormGroup;
  loading = false;
  loadingEvent = true;
  error: string = '';
  success: string = '';
  eventId: string = '';
  currentEvent: Event | null = null;
  
  // Options pour les catégories
  categories = [
    { value: 'CONFERENCE', label: 'Conférence', icon: 'icon-badge' },
    { value: 'WORKSHOP', label: 'Atelier', icon: 'icon-settings' },
    { value: 'MEETUP', label: 'Rencontre', icon: 'icon-chat-33' },
    { value: 'SEMINAR', label: 'Séminaire', icon: 'icon-book-bookmark' }
  ];

  // Options pour le statut avec gestion du workflow
  statuses = [
    { value: 'DRAFT', label: 'Brouillon', color: 'secondary', description: 'Non visible publiquement' },
    { value: 'PUBLISHED', label: 'Publié', color: 'success', description: 'Visible et ouvert aux inscriptions' },
    { value: 'CANCELLED', label: 'Annulé', color: 'danger', description: 'Événement annulé' },
    { value: 'COMPLETED', label: 'Terminé', color: 'info', description: 'Événement terminé' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.eventForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      location: ['', [Validators.required, Validators.maxLength(200)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      maxParticipants: [0, [Validators.min(0)]],
      category: ['CONFERENCE', [Validators.required]],
      status: ['DRAFT', [Validators.required]]
    }, { validators: this.dateValidator });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    this.loadEvent();
  }

  loadEvent(): void {
    this.loadingEvent = true;
    this.error = '';

    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.currentEvent = event;
        this.loadingEvent = false;
        
        // Convertir les dates ISO en format datetime-local
        const startDate = event.startDate ? this.formatDateForInput(event.startDate) : '';
        const endDate = event.endDate ? this.formatDateForInput(event.endDate) : '';
        
        this.eventForm.patchValue({
          title: event.name,
          description: event.description || '',
          location: event.location,
          startDate: startDate,
          endDate: endDate,
          maxParticipants: event.maxParticipants || 0,
          category: event.category || 'CONFERENCE',
          status: event.status
        });
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.loadingEvent = false;
        this.error = 'Impossible de charger l\'événement';
      }
    });
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Validateur personnalisé pour vérifier que la date de fin est après la date de début
  dateValidator(form: FormGroup) {
    const startDate = form.get('startDate');
    const endDate = form.get('endDate');
    
    if (startDate && endDate && startDate.value && endDate.value) {
      const start = new Date(startDate.value);
      const end = new Date(endDate.value);
      
      if (end < start) {
        endDate.setErrors({ dateInvalid: true });
        return { dateInvalid: true };
      }
    }
    
    return null;
  }

  get f() {
    return this.eventForm.controls;
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (this.eventForm.invalid) {
      Object.keys(this.eventForm.controls).forEach(key => {
        this.eventForm.controls[key].markAsTouched();
      });
      return;
    }

    this.loading = true;

    const eventData: Event = {
      id: this.eventId,
      name: this.f['title'].value,
      description: this.f['description'].value || undefined,
      location: this.f['location'].value,
      startDate: this.f['startDate'].value,
      endDate: this.f['endDate'].value,
      maxParticipants: this.f['maxParticipants'].value || 0,
      status: this.f['status'].value
    };

    this.eventService.updateEvent(this.eventId, eventData).subscribe({
      next: (event) => {
        this.success = 'Événement mis à jour avec succès !';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/events']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error updating event:', err);
        this.loading = false;
        
        if (err.status === 400) {
          this.error = 'Données invalides. Vérifiez les champs du formulaire';
        } else if (err.status === 404) {
          this.error = 'Événement non trouvé';
        } else {
          this.error = 'Erreur lors de la mise à jour de l\'événement';
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/events']);
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
}
