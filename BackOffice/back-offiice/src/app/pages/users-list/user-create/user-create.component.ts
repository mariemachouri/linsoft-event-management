import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService, UserCreateRequest } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.scss']
})
export class UserCreateComponent implements OnInit {

  userForm: FormGroup;
  loading = false;
  error: string = '';
  success: string = '';
  
  availableRoles = [
    { value: 'admin', label: 'Administrateur', description: 'Accès complet au système' },
    { value: 'user', label: 'Utilisateur', description: 'Accès standard' },
    { value: 'event-organizer', label: 'Organisateur d\'événements', description: 'Peut créer et gérer des événements' },
    { value: 'participant', label: 'Participant', description: 'Peut s\'inscrire aux événements' }
  ];

  selectedRoles: string[] = ['user']; // Par défaut, rôle user

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.userForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  get f() {
    return this.userForm.controls;
  }

  toggleRole(role: string): void {
    const index = this.selectedRoles.indexOf(role);
    if (index > -1) {
      // Si le rôle est déjà sélectionné, le retirer (sauf si c'est le seul)
      if (this.selectedRoles.length > 1) {
        this.selectedRoles.splice(index, 1);
      }
    } else {
      // Ajouter le rôle
      this.selectedRoles.push(role);
    }
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles.includes(role);
  }

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.controls[key].markAsTouched();
      });
      return;
    }

    this.loading = true;

    const createRequest: UserCreateRequest = {
      username: this.f['username'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      firstName: this.f['firstName'].value || undefined,
      lastName: this.f['lastName'].value || undefined
    };

    this.userService.createUser(createRequest).subscribe({
      next: (user) => {
        // Si des rôles sont sélectionnés, les assigner
        if (this.selectedRoles.length > 0 && user.id) {
          this.userService.assignRoles(user.id, this.selectedRoles).subscribe({
            next: () => {
              this.success = 'Utilisateur créé avec succès !';
              setTimeout(() => {
                this.router.navigate(['/users']);
              }, 1500);
            },
            error: (err) => {
              console.error('Error assigning roles:', err);
              this.error = 'Utilisateur créé mais erreur lors de l\'assignation des rôles';
              this.loading = false;
            }
          });
        } else {
          this.success = 'Utilisateur créé avec succès !';
          setTimeout(() => {
            this.router.navigate(['/users']);
          }, 1500);
        }
      },
      error: (err) => {
        console.error('Error creating user:', err);
        this.loading = false;
        
        if (err.status === 409) {
          this.error = 'Ce nom d\'utilisateur ou email existe déjà';
        } else if (err.status === 400) {
          this.error = 'Données invalides. Vérifiez les champs du formulaire';
        } else {
          this.error = 'Erreur lors de la création de l\'utilisateur';
        }
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
