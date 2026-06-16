import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/services/auth.service';

interface PortalCard {
  title: string;
  subtitle: string;
  svg: string;
  safeSvg?: SafeHtml;
  route: string;
  color: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit, OnDestroy {

  firstName = '';
  greeting = '';
  currentDate = '';
  currentTime = '';
  isAdmin = false;

  private clockTimer: any;

  readonly cards: PortalCard[] = [
    {
      title: 'Tableau de bord',
      subtitle: 'KPIs & statistiques',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
      route: '/dashboard',
      color: '#cc1f24'
    },
    {
      title: 'Événements',
      subtitle: 'Créer & gérer les événements',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
      route: '/events',
      color: '#1565c0'
    },
    {
      title: 'Inscriptions',
      subtitle: 'Suivi des participants',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
      route: '/registrations',
      color: '#2e7d32'
    },
    {
      title: 'Utilisateurs',
      subtitle: 'Administration des comptes',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      route: '/users',
      color: '#7b1fa2',
      adminOnly: true
    },
    {
      title: 'Catalogue des charges',
      subtitle: 'Types & catégories de charges',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      route: '/charges/catalog',
      color: '#e65100'
    },
    {
      title: 'Charges événements',
      subtitle: 'Suivi financier par événement',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      route: '/charges/items',
      color: '#00695c'
    },
    {
      title: 'Prédictions IA',
      subtitle: 'Analyses & prédictions',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      route: '/charges/predictions',
      color: '#ad1457'
    },
    {
      title: 'Notifications',
      subtitle: 'Alertes & communications',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
      route: '/notifications',
      color: '#1565c0'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.firstName = user?.firstName || user?.username || 'Administrateur';
    this.isAdmin = this.authService.hasRole('admin');
    this.cards.forEach(c => c.safeSvg = this.sanitizer.bypassSecurityTrustHtml(c.svg));
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 60_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
  }

  private updateClock(): void {
    const now = new Date();
    const h = now.getHours();
    this.greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
    this.currentDate = now.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    this.currentTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  get visibleCards(): PortalCard[] {
    return this.cards.filter(c => !c.adminOnly || this.isAdmin);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
