import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserResponse {
  id?: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: any[];
  createdAt?: string;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface UserUpdateRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  /**
   * Récupérer tous les utilisateurs
   */
  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${environment.services.users}`);
  }

  /**
   * Récupérer un utilisateur par ID
   */
  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${environment.services.users}/${id}`);
  }

  /**
   * Récupérer un utilisateur par username
   */
  getUserByUsername(username: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${environment.services.users}/username/${username}`);
  }

  /**
   * Créer un nouvel utilisateur
   */
  createUser(request: UserCreateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${environment.services.users}`, request);
  }

  /**
   * Mettre à jour un utilisateur
   */
  updateUser(id: string, request: UserUpdateRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${environment.services.users}/${id}`, request);
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.services.users}/${id}`);
  }

  /**
   * Assigner des rôles à un utilisateur
   */
  assignRoles(userId: string, roles: string[]): Observable<void> {
    return this.http.post<void>(`${environment.services.users}/${userId}/roles`, roles);
  }

  /**
   * Supprimer des rôles d'un utilisateur
   */
  removeRoles(userId: string, roles: string[]): Observable<void> {
    return this.http.delete<void>(`${environment.services.users}/${userId}/roles`, {
      body: roles
    });
  }
}
