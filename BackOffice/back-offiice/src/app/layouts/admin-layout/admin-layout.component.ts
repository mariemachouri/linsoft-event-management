import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-admin-layout",
  templateUrl: "./admin-layout.component.html",
  styleUrls: ["./admin-layout.component.scss"]
})
export class AdminLayoutComponent implements OnInit {
  public sidebarColor: string = "red";
  public isLightMode: boolean = true;   // le wrapper démarre en mode clair (white-content)

  constructor() {}
  changeSidebarColor(color){
    var sidebar = document.getElementsByClassName('sidebar')[0];
    var mainPanel = document.getElementsByClassName('main-panel')[0];

    this.sidebarColor = color;

    if(sidebar != undefined){
        sidebar.setAttribute('data',color);
    }
    if(mainPanel != undefined){
        mainPanel.setAttribute('data',color);
    }
  }
  changeDashboardColor(color){
    var body = document.getElementsByTagName('body')[0];
    if (color === 'white-content') {
      this.isLightMode = true;
      body.classList.add('white-content');
    } else {
      this.isLightMode = false;
      body.classList.remove('white-content');
    }
  }
  ngOnInit() {}

  openSidebar(): void {
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('sidebar-mini');
  }

  isSidebarHidden(): boolean {
    const body = document.getElementsByTagName('body')[0];
    return body.classList.contains('sidebar-mini');
  }
}
