import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenService, Token } from './token.service';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse extends Token { }

export interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject: BehaviorSubject<UserInfo | null>;
  public currentUser$: Observable<UserInfo | null>;

  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {
    // Initialiser le user depuis localStorage (session recovery)
    const storedUser = localStorage.getItem('current_user');
    this.currentUserSubject = new BehaviorSubject<UserInfo | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();

    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.tokenService.isAuthenticated());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  /**
   * Connexion utilisateur
   */
  login(username: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { username, password };

    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/api/auth/login`,
      loginRequest
    ).pipe(
      tap(response => {
        // Sauvegarder les tokens
        this.tokenService.setToken(response);
        this.isAuthenticatedSubject.next(true);

        // Optionnel: récupérer les infos utilisateur après login
        // Pour l'instant, sauvegarder info basique
        const userInfo: UserInfo = { username };
        localStorage.setItem('current_user', JSON.stringify(userInfo));
        this.currentUserSubject.next(userInfo);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => new Error('Login failed'));
      })
    );
  }

  /**
   * Rafraîchir le token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.tokenService.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/api/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        this.tokenService.setToken(response);
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.logout();
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.tokenService.clearToken();
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Récupérer l'utilisateur actuel
   */
  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si authentifié
   */
  isAuthenticated(): boolean {
    // Mode développement: permettre l'accès s'il y a un utilisateur en localStorage
    const devUser = localStorage.getItem('dev_mode_user');
    if (devUser) {
      return true;
    }
    
    return this.tokenService.isAuthenticated();
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Vérifier si l'utilisateur a l'un des rôles spécifiés
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return roles.some(role => user?.roles?.includes(role)) || false;
  }
}
