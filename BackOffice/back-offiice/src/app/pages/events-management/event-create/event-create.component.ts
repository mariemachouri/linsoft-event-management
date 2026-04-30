import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService, Event } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss']
})
export class EventCreateComponent implements OnInit {

  eventForm: FormGroup;
  loading = false;
  error: string = '';
  success: string = '';
  organizerEmail: string = '';
  imagePreview: string | null = null;
  
  // Options pour les catégories
  categories = [
    { value: 'CONFERENCE', label: 'Conference', icon: 'icon-badge' },
    { value: 'WORKSHOP', label: 'Workshop', icon: 'icon-settings' },
    { value: 'MEETUP', label: 'Meetup', icon: 'icon-chat-33' },
    { value: 'SEMINAR', label: 'Seminar', icon: 'icon-book-bookmark' }
  ];

  // Status options
  statuses = [
    { value: 'DRAFT', label: 'Draft', color: 'secondary' },
    { value: 'PUBLISHED', label: 'Published', color: 'success' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private eventService: EventService,
    private router: Router,
    private authService: AuthService
  ) {
    this.eventForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      location: ['', [Validators.required, Validators.maxLength(200)]],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      maxParticipants: [0, [Validators.min(0)]],
      category: ['CONFERENCE', [Validators.required]],
      status: ['DRAFT', [Validators.required]],
      imageUrl: ['']
    }, { validators: this.dateValidator });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user?.email) {
        this.organizerEmail = user.email;
      }
    });
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

  onFileSelected(evt: globalThis.Event): void {
    const input = evt.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.error = 'Veuillez sélectionner un fichier image valide.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagePreview = result;
      this.eventForm.patchValue({ imageUrl: result });
    };
    reader.readAsDataURL(file);
  }

  clearImage(): void {
    this.imagePreview = null;
    this.eventForm.patchValue({ imageUrl: '' });
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
      name: this.f['title'].value,
      description: this.f['description'].value || undefined,
      location: this.f['location'].value,
      startDate: this.f['startDate'].value,
      endDate: this.f['endDate'].value,
      maxParticipants: this.f['maxParticipants'].value || 0,
      status: this.f['status'].value,
      organizerId: this.organizerEmail || 'achoury.mayem@gmail.com',
      imageUrl: this.f['imageUrl'].value || undefined
    };

    this.eventService.createEvent(eventData).subscribe({
      next: (event) => {
        this.success = 'Événement créé avec succès !';
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/events']);
        }, 1500);
      },
      error: (err) => {
        console.error('Error creating event:', err);
        this.loading = false;
        
        if (err.status === 400) {
          this.error = 'Données invalides. Vérifiez les champs du formulaire';
        } else {
          this.error = 'Error creating event';
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/events']);
  }
}
