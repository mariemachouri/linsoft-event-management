import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService, UserResponse, UserUpdateRequest } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.scss']
})
export class UserEditComponent implements OnInit {

  userForm: FormGroup;
  loading = false;
  loadingUser = true;
  error: string = '';
  success: string = '';
  userId: string = '';
  currentUser: UserResponse | null = null;
  
  availableRoles = [
    { value: 'admin', label: 'Administrateur', description: 'Accès complet au système' },
    { value: 'user', label: 'Utilisateur', description: 'Accès standard' },
    { value: 'event-organizer', label: 'Organisateur d\'événements', description: 'Peut créer et gérer des événements' },
    { value: 'participant', label: 'Participant', description: 'Peut s\'inscrire aux événements' }
  ];

  selectedRoles: string[] = [];
  originalRoles: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.userForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.maxLength(100)]],
      lastName: ['', [Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];
    if (this.userId) {
      this.loadUser();
    } else {
      this.error = 'ID utilisateur manquant';
      this.loadingUser = false;
    }
  }

  loadUser(): void {
    this.loadingUser = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadingUser = false;
        
        // Remplir le formulaire
        this.userForm.patchValue({
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        });

        // Charger les rôles
        if (user.roles && Array.isArray(user.roles)) {
          this.selectedRoles = user.roles.map(r => typeof r === 'string' ? r : r.name || r.value);
          this.originalRoles = [...this.selectedRoles];
        }
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error = 'Impossible de charger l\'utilisateur';
        this.loadingUser = false;
      }
    });
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

    const updateRequest: UserUpdateRequest = {
      email: this.f['email'].value || undefined,
      firstName: this.f['firstName'].value || undefined,
      lastName: this.f['lastName'].value || undefined
    };

    // Mettre à jour les informations de base
    this.userService.updateUser(this.userId, updateRequest).subscribe({
      next: () => {
        // Gérer les changements de rôles
        this.updateRoles();
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.loading = false;
        
        if (err.status === 404) {
          this.error = 'Utilisateur non trouvé';
        } else if (err.status === 400) {
          this.error = 'Données invalides. Vérifiez les champs du formulaire';
        } else {
          this.error = 'Erreur lors de la mise à jour de l\'utilisateur';
        }
      }
    });
  }

  updateRoles(): void {
    // Déterminer les rôles à ajouter et à supprimer
    const rolesToAdd = this.selectedRoles.filter(r => !this.originalRoles.includes(r));
    const rolesToRemove = this.originalRoles.filter(r => !this.selectedRoles.includes(r));

    let rolesUpdated = 0;
    const totalUpdates = (rolesToAdd.length > 0 ? 1 : 0) + (rolesToRemove.length > 0 ? 1 : 0);

    if (totalUpdates === 0) {
      // Pas de changement de rôles
      this.showSuccessAndRedirect();
      return;
    }

    // Ajouter les nouveaux rôles
    if (rolesToAdd.length > 0) {
      this.userService.assignRoles(this.userId, rolesToAdd).subscribe({
        next: () => {
          rolesUpdated++;
          if (rolesUpdated === totalUpdates) {
            this.showSuccessAndRedirect();
          }
        },
        error: (err) => {
          console.error('Error adding roles:', err);
          this.loading = false;
          this.error = 'Utilisateur mis à jour mais erreur lors de l\'ajout des rôles';
        }
      });
    }

    // Retirer les rôles supprimés
    if (rolesToRemove.length > 0) {
      this.userService.removeRoles(this.userId, rolesToRemove).subscribe({
        next: () => {
          rolesUpdated++;
          if (rolesUpdated === totalUpdates) {
            this.showSuccessAndRedirect();
          }
        },
        error: (err) => {
          console.error('Error removing roles:', err);
          this.loading = false;
          this.error = 'Utilisateur mis à jour mais erreur lors de la suppression des rôles';
        }
      });
    }
  }

  showSuccessAndRedirect(): void {
    this.success = 'Utilisateur mis à jour avec succès !';
    this.loading = false;
    setTimeout(() => {
      this.router.navigate(['/users']);
    }, 1500);
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
