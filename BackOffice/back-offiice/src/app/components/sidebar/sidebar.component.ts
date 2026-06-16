import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";

declare interface RouteInfo {
  path: string;
  title: string;
  rtlTitle: string;
  icon: string;
  class: string;
  requiredRole?: string;
  hidden?: boolean;
}

export const ROUTES: RouteInfo[] = [
  {
    path: "/welcome",
    title: "Accueil",
    rtlTitle: "الرئيسية",
    icon: "icon-app",
    class: ""
  },
  {
    path: "/dashboard",
    title: "Tableau de bord",
    rtlTitle: "لوحة القيادة",
    icon: "icon-chart-pie-36",
    class: ""
  },
  {
    path: "/events",
    title: "Événements",
    rtlTitle: "الأحداث",
    icon: "icon-calendar-60",
    class: ""
  },
  {
    path: "/registrations",
    title: "Inscriptions",
    rtlTitle: "التسجيلات",
    icon: "icon-badge",
    class: ""
  },
  {
    path: "/users",
    title: "Utilisateurs",
    rtlTitle: "المستخدمين",
    icon: "icon-single-02",
    class: "",
    requiredRole: "admin"
  },
  {
    path: "/charges/catalog",
    title: "Catalogue des charges",
    rtlTitle: "كتالوج الرسوم",
    icon: "icon-book-bookmark",
    class: ""
  },
  {
    path: "/charges/items",
    title: "Charges par événement",
    rtlTitle: "رسوم الأحداث",
    icon: "icon-money-coins",
    class: ""
  },
  {
    path: "/charges/predictions",
    title: "Prédictions IA",
    rtlTitle: "تنبؤات الذكاء الاصطناعي",
    icon: "icon-chart-bar-32",
    class: ""
  },
  {
    path: "/notifications",
    title: "Notifications",
    rtlTitle: "الإخطارات",
    icon: "icon-bell-55",
    class: ""
  },
  {
    path: "/user-profile",
    title: "Profil utilisateur",
    rtlTitle: "الملف الشخصي",
    icon: "icon-single-02",
    class: ""
  },
  {
    path: "/charges/payment-decision",
    title: "Décision de paiement",
    rtlTitle: "قرار الدفع",
    icon: "",
    class: "",
    hidden: true
  },
  {
    path: "/charges/create",
    title: "Nouvelle prédiction",
    rtlTitle: "",
    icon: "",
    class: "",
    hidden: true
  },
  {
    path: "/events/create",
    title: "Nouvel événement",
    rtlTitle: "",
    icon: "",
    class: "",
    hidden: true
  },
  {
    path: "/events/edit",
    title: "Modifier l'événement",
    rtlTitle: "",
    icon: "",
    class: "",
    hidden: true
  },
  {
    path: "/events/view",
    title: "Détail de l'événement",
    rtlTitle: "",
    icon: "",
    class: "",
    hidden: true
  }
];

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.css"]
})
export class SidebarComponent implements OnInit {
  menuItems: any[];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.menuItems = ROUTES.filter(menuItem => {
      if (menuItem.hidden) return false;
      if (!menuItem.requiredRole) return true;
      return this.authService.hasRole(menuItem.requiredRole);
    });
  }

  isMobileMenu() {
    if (window.innerWidth > 991) {
      return false;
    }
    return true;
  }

  logout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    const body = document.getElementsByTagName('body')[0];
    if (body.classList.contains('sidebar-mini')) {
      body.classList.remove('sidebar-mini');
    } else {
      body.classList.add('sidebar-mini');
    }
  }
}

