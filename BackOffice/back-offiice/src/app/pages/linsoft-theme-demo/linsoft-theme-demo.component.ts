import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-linsoft-theme-demo',
  templateUrl: './linsoft-theme-demo.component.html',
  styleUrls: ['./linsoft-theme-demo.component.scss']
})
export class LinsoftThemeDemoComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  showAlert(type: string): void {
    alert(`Bouton ${type} cliqué !`);
  }

  submitForm(): void {
    alert('Formulaire soumis !');
  }

}
