import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Mode développement: créer un utilisateur fictif
    localStorage.setItem('dev_mode_user', 'true');
    localStorage.setItem('current_user', JSON.stringify({ 
      username: 'dev-user', 
      email: 'dev@test.com',
      roles: ['admin', 'user']
    }));
    return true;
  }
}
