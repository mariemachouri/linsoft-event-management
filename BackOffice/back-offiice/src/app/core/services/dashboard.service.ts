import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EventService } from './event.service';
import { UserService } from './user.service';
import { RegistrationService } from './registration.service';

export interface DashboardStats {
  totalEvents: number;
  totalUsers: number;
  totalRegistrations: number;
  recentEvents: any[];
  topEvents: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private dashboardApiUrl = environment.services.dashboard;

  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private userService: UserService,
    private registrationService: RegistrationService
  ) { }

  /**
   * Récupérer les statistiques du dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return combineLatest([
      this.eventService.getAllEvents().pipe(catchError(() => of([]))),
      this.userService.getAllUsers().pipe(catchError(() => of([]))),
      this.registrationService.getAllRegistrations().pipe(catchError(() => of([])))
    ]).pipe(
      map(([events, users, registrations]) => {
        return {
          totalEvents: events.length,
          totalUsers: users.length,
          totalRegistrations: registrations.length,
          recentEvents: events.slice(0, 5),
          topEvents: events.slice(0, 3)
        };
      }),
      catchError(() => {
        // En cas d'erreur, retourner des stats vides
        return of({
          totalEvents: 0,
          totalUsers: 0,
          totalRegistrations: 0,
          recentEvents: [],
          topEvents: []
        });
      })
    );
  }

  /**
   * Récupérer les analytics du dashboard (depuis le service dashboard)
   */
  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.dashboardApiUrl}/analytics`).pipe(
      catchError(() => of(null))
    );
  }
}
