import { Component, OnInit, ElementRef, OnDestroy } from "@angular/core";
import { ROUTES } from "../sidebar/sidebar.component";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from "../../core/services/auth.service";
import { AvatarService } from "../../core/services/avatar.service";
import { Subscription } from "rxjs";
import { environment } from "../../../environments/environment";

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.css"]
})
export class NavbarComponent implements OnInit, OnDestroy {
  private listTitles: any[] = [];
  location: Location;
  mobile_menu_visible: any = 0;
  private toggleButton: any;
  private sidebarVisible: boolean;

  public isCollapsed = true;

  closeResult: string = '';

  // ── Avatar (affichage seul — la modification se fait dans la page Profil) ──
  public avatarUrl: string | null = null;
  private avatarSub: Subscription = new Subscription();

  constructor(
    location: Location,
    private element: ElementRef,
    private router: Router,
    private modalService: NgbModal,
    private authService: AuthService,
    private avatarService: AvatarService
  ) {
    this.location = location;
    this.sidebarVisible = false;
  }
  // function that adds color white/transparent to the navbar on resize (this is for the collapse)
   updateColor = () => {
   var navbar = document.getElementsByClassName('navbar')[0];
     if (window.innerWidth < 993 && !this.isCollapsed) {
       navbar.classList.add('bg-white');
       navbar.classList.remove('navbar-transparent');
     } else {
       navbar.classList.remove('bg-white');
       navbar.classList.add('navbar-transparent');
     }
   };
  ngOnInit() {
    window.addEventListener("resize", this.updateColor);
    this.listTitles = ROUTES.filter(listTitle => listTitle);
    const navbar: HTMLElement = this.element.nativeElement;
    this.toggleButton = navbar.getElementsByClassName("navbar-toggler")[0];
    this.router.events.subscribe(event => {
      this.sidebarClose();
      var $layer: any = document.getElementsByClassName("close-layer")[0];
      if ($layer) {
        $layer.remove();
        this.mobile_menu_visible = 0;
      }
    });

    // ── Avatar : charge la photo de l'utilisateur (affichage seul) ──
    this.authService.currentUser$.subscribe(user => {
      const userId = user?.id || user?.username || '';
      if (userId) {
        this.avatarService.load(userId);
      }
    });
    // Reste synchronisé en direct avec la page profil
    this.avatarSub = this.avatarService.avatar$.subscribe(url => {
      this.avatarUrl = url;
    });
  }

  collapse() {
    this.isCollapsed = !this.isCollapsed;
    const navbar = document.getElementsByTagName("nav")[0];
    if (!this.isCollapsed) {
      navbar.classList.remove("navbar-transparent");
      navbar.classList.add("bg-white");
    } else {
      navbar.classList.add("navbar-transparent");
      navbar.classList.remove("bg-white");
    }
  }

  sidebarOpen() {
    const toggleButton = this.toggleButton;
    const mainPanel = <HTMLElement>(
      document.getElementsByClassName("main-panel")[0]
    );
    const html = document.getElementsByTagName("html")[0];
    if (window.innerWidth < 991) {
      mainPanel.style.position = "fixed";
    }

    setTimeout(function() {
      toggleButton.classList.add("toggled");
    }, 500);

    html.classList.add("nav-open");

    this.sidebarVisible = true;
  }
  sidebarClose() {
    const html = document.getElementsByTagName("html")[0];
    this.toggleButton.classList.remove("toggled");
    const mainPanel = <HTMLElement>(
      document.getElementsByClassName("main-panel")[0]
    );

    if (window.innerWidth < 991) {
      setTimeout(function() {
        mainPanel.style.position = "";
      }, 500);
    }
    this.sidebarVisible = false;
    html.classList.remove("nav-open");
  }
  sidebarToggle() {
    var body = document.getElementsByTagName('body')[0];
    if (body.classList.contains('sidebar-mini')) {
      body.classList.remove('sidebar-mini');
    } else {
      body.classList.add('sidebar-mini');
    }
  }

  getTitle() {
    var titlee = this.location.prepareExternalUrl(this.location.path());
    if (titlee.charAt(0) === "#") {
      titlee = titlee.slice(1);
    }

    for (var item = 0; item < this.listTitles.length; item++) {
      if (this.listTitles[item].path === titlee) {
        return this.listTitles[item].title;
      }
    }

    // Gérer les sous-routes dynamiques (ex: /events/edit/:id)
    for (var item = 0; item < this.listTitles.length; item++) {
      const basePath = this.listTitles[item].path;
      if (basePath !== '/dashboard' && titlee.startsWith(basePath + '/')) {
        return this.listTitles[item].title;
      }
    }

    return "Dashboard";
  }

  open(content: any) {
    this.modalService.open(content, {windowClass: 'modal-search'}).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }
  goToProfile(): void {
    this.router.navigate(['/user-profile']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  openKeycloak(): void {
    window.open(`${environment.keycloak.url}/admin/master/console/#/event-mgmt`, '_blank');
  }

  isAdmin(): boolean {
    return this.authService.hasRole('admin');
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(){
     window.removeEventListener("resize", this.updateColor);
     this.avatarSub.unsubscribe();
  }
}
