import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface Token {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor() { }

  /**
   * Sauvegarde le token et le refresh token dans localStorage
   */
  setToken(token: Token): void {
    localStorage.setItem(environment.tokenKey, token.access_token);
    localStorage.setItem(environment.refreshTokenKey, token.refresh_token);
    // Optionnel: sauvegarder les expiration times
    localStorage.setItem('token_expiry', (Date.now() + token.expires_in * 1000).toString());
    localStorage.setItem('refresh_token_expiry', (Date.now() + token.refresh_expires_in * 1000).toString());
  }

  /**
   * Récupère le access token
   */
  getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  /**
   * Récupère le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  /**
   * Vérifie si le token est valide (non expiré)
   */
  isTokenValid(): boolean {
    const token = this.getToken();
    const expiry = localStorage.getItem('token_expiry');

    if (!token || !expiry) {
      return false;
    }

    const expiryTime = parseInt(expiry, 10);
    return Date.now() < expiryTime;
  }

  /**
   * Vérifie si le refresh token est valide
   */
  isRefreshTokenValid(): boolean {
    const refreshToken = this.getRefreshToken();
    const expiry = localStorage.getItem('refresh_token_expiry');

    if (!refreshToken || !expiry) {
      return false;
    }

    const expiryTime = parseInt(expiry, 10);
    return Date.now() < expiryTime;
  }

  /**
   * Supprime les tokens (logout)
   */
  clearToken(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('refresh_token_expiry');
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.isTokenValid() || this.isRefreshTokenValid();
  }
}
