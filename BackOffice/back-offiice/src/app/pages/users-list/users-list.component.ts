import { Component, OnInit } from '@angular/core';
import { UserService, UserResponse } from '../../core/services/user.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {

  users: UserResponse[] = [];
  loading = false;
  error = '';
  searchQuery = '';

  private readonly AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #cc1f24, #ff6b6b)',
    'linear-gradient(135deg, #2A3652, #4a6fa5)',
    'linear-gradient(135deg, #1d8cf8, #3358f4)',
    'linear-gradient(135deg, #e14eca, #a855f7)',
    'linear-gradient(135deg, #00c2ff, #0066cc)',
    'linear-gradient(135deg, #ff8d72, #e8632a)',
    'linear-gradient(135deg, #00c89a, #007a5c)',
    'linear-gradient(135deg, #8b5cf6, #6d28d9)',
  ];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get filteredUsers(): UserResponse[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.users;
    return this.users.filter(u =>
      (u.username   || '').toLowerCase().includes(q) ||
      (u.email      || '').toLowerCase().includes(q) ||
      (u.firstName  || '').toLowerCase().includes(q) ||
      (u.lastName   || '').toLowerCase().includes(q)
    );
  }

  get totalAdmins(): number {
    return this.users.filter(u => this.isAdmin(u)).length;
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Erreur lors du chargement des utilisateurs.';
        console.error(err);
      }
    });
  }

  deleteUser(id: string | undefined): void {
    if (!id) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== id);
        },
        error: (err) => {
          this.error = 'Erreur lors de la suppression de l\'utilisateur.';
          console.error(err);
        }
      });
    }
  }

  editUser(id: string | undefined): void {
    if (id) {
      window.location.href = `#/users/edit/${id}`;
    }
  }

  getInitials(user: UserResponse): string {
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return (user.username?.[0] || 'U').toUpperCase();
  }

  getAvatarGradient(username: string | undefined): string {
    const idx = (username?.charCodeAt(0) || 0) % this.AVATAR_GRADIENTS.length;
    return this.AVATAR_GRADIENTS[idx];
  }

  isAdmin(user: UserResponse): boolean {
    const roles = user.roles as any[];
    if (!roles?.length) return false;
    return roles.some(r => {
      const name: string = typeof r === 'string' ? r : (r.name || r.roleName || '');
      return name.toLowerCase().includes('admin');
    });
  }

  getPrimaryRole(user: UserResponse): string {
    return this.isAdmin(user) ? 'Administrateur' : 'Utilisateur';
  }
}
