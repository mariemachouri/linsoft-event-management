import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UserResponse {
  id?: string;
  keycloakId?: string;
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

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly apiUrl = environment.services.users;
  private readonly TTL = 60_000;

  private cache$: Observable<UserResponse[]> | null = null;
  private cacheAt = 0;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserResponse[]> {
    if (!this.cache$ || Date.now() - this.cacheAt > this.TTL) {
      this.cache$ = this.http.get<UserResponse[]>(this.apiUrl).pipe(shareReplay(1));
      this.cacheAt = Date.now();
    }
    return this.cache$;
  }

  invalidateCache(): void {
    this.cache$ = null;
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  getUserByUsername(username: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/username/${username}`);
  }

  createUser(request: UserCreateRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, request).pipe(
      tap(() => this.invalidateCache())
    );
  }

  updateUser(id: string, request: UserUpdateRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, request).pipe(
      tap(() => this.invalidateCache())
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.invalidateCache())
    );
  }

  assignRoles(userId: string, roles: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/roles`, roles).pipe(
      tap(() => this.invalidateCache())
    );
  }

  removeRoles(userId: string, roles: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/roles`, { body: roles }).pipe(
      tap(() => this.invalidateCache())
    );
  }
}
