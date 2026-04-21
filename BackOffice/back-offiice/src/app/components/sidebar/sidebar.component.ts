import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../core/services/auth.service";

declare interface RouteInfo {
  path: string;
  title: string;
  rtlTitle: string;
  icon: string;
  class: string;
  requiredRole?: string;
}

export const ROUTES: RouteInfo[] = [
  {
    path: "/dashboard",
    title: "Dashboard",
    rtlTitle: "لوحة القيادة",
    icon: "icon-chart-pie-36",
    class: ""
  },
  {
    path: "/events",
    title: "Events",
    rtlTitle: "الأحداث",
    icon: "icon-calendar-60",
    class: ""
  },
  {
    path: "/registrations",
    title: "Registrations",
    rtlTitle: "التسجيلات",
    icon: "icon-badge",
    class: ""
  },
  {
    path: "/users",
    title: "Users",
    rtlTitle: "المستخدمين",
    icon: "icon-single-02",
    class: "",
    requiredRole: "admin"
  },
  {
    path: "/charges",
    title: "Charges",
    rtlTitle: "الرسوم",
    icon: "icon-money-coins",
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
    title: "User Profile",
    rtlTitle: "الملف الشخصي",
    icon: "icon-single-02",
    class: ""
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
      // Si aucun rôle requis, afficher toujours
      if (!menuItem.requiredRole) {
        return true;
      }
      // Vérifier si l'utilisateur a le rôle requis
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

