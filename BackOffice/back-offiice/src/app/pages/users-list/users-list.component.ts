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

  exportToCSV(): void {
    const headers = ['Nom', 'Prénom', 'Username', 'Email', 'Rôle'];
    const rows = this.filteredUsers.map(u => [
      u.lastName  || '',
      u.firstName || '',
      u.username  || '',
      u.email     || '',
      this.getPrimaryRole(u)
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportToPDF(): void {
    const today = new Date().toLocaleDateString('fr-FR');
    const rows = this.filteredUsers.map(u => `
      <tr>
        <td>
          <div class="avatar" style="background:${this.getAvatarGradient(u.username)}">
            ${this.getInitials(u)}
          </div>
        </td>
        <td>${[u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || '—'}</td>
        <td>${u.username || '—'}</td>
        <td>${u.email || '—'}</td>
        <td><span class="role-badge ${this.isAdmin(u) ? 'role-admin' : 'role-user'}">${this.getPrimaryRole(u)}</span></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Utilisateurs</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;padding:30px;font-size:12px;color:#222}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #E30613;padding-bottom:14px;margin-bottom:24px}
  .logo{font-size:20px;font-weight:900}.logo span{color:#E30613}
  .meta{text-align:right;color:#888;font-size:11px;line-height:1.8}
  h1{font-size:15px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#E30613;color:#fff}
  th{padding:9px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase}
  td{padding:8px 12px;border-bottom:1px solid #eee;vertical-align:middle}
  tr:nth-child(even) td{background:#fafafa}
  .avatar{width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:11px}
  .role-badge{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
  .role-admin{background:#fdecea;color:#E30613}
  .role-user{background:#e8f5e9;color:#27ae60}
  .footer{margin-top:20px;color:#aaa;font-size:10px;text-align:center}
  @media print{body{padding:15px}}
</style></head><body>
  <div class="header">
    <div class="logo">LN<span>SOFT</span></div>
    <div class="meta">Gestion des utilisateurs<br>Généré le ${today}</div>
  </div>
  <h1>Liste des utilisateurs (${this.filteredUsers.length})</h1>
  <table>
    <thead><tr><th></th><th>Nom complet</th><th>Username</th><th>Email</th><th>Rôle</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">LinSoft · ${today}</div>
  <script>window.onload=()=>window.print()</script>
</body></html>`;
    const w = window.open('', '_blank');
    w?.document.write(html);
    w?.document.close();
  }
}
