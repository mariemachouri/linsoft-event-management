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
  error: string = '';
  displayedColumns: string[] = ['id', 'username', 'email', 'firstName', 'lastName', 'actions'];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
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
        this.error = 'Failed to load users';
        console.error('Error loading users:', err);
      }
    });
  }

  deleteUser(id: string | undefined): void {
    if (!id) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== id);
        },
        error: (err) => {
          this.error = 'Failed to delete user';
          console.error('Error deleting user:', err);
        }
      });
    }
  }

  editUser(id: string | undefined): void {
    if (id) {
      window.location.href = `#/users/edit/${id}`;
    }
  }

  viewUser(user: UserResponse): void {
    // TODO: Implémenter vue détaillée (modal ou page)
    console.log('View user:', user);
  }
}
