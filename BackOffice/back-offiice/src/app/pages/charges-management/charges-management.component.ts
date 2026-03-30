import { Component, OnInit } from '@angular/core';
import { ChargeService, Charge } from '../../core/services/charge.service';

@Component({
  selector: 'app-charges-management',
  templateUrl: './charges-management.component.html',
  styleUrls: ['./charges-management.component.scss']
})
export class ChargesManagementComponent implements OnInit {

  charges: Charge[] = [];
  loading = false;
  error: string | null = null;

  constructor(private chargeService: ChargeService) { }

  ngOnInit(): void {
    this.loadCharges();
  }

  loadCharges(): void {
    this.loading = true;
    this.error = null;
    this.chargeService.getAllCharges().subscribe({
      next: (data) => {
        this.charges = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading charges:', err);
        this.error = 'Failed to load charges. Please try again.';
        this.loading = false;
      }
    });
  }

  deleteCharge(id: string): void {
    if (confirm('Are you sure you want to delete this charge?')) {
      this.chargeService.deleteCharge(id).subscribe({
        next: () => {
          this.loadCharges();
        },
        error: (err) => {
          console.error('Error deleting charge:', err);
          alert('Failed to delete charge');
        }
      });
    }
  }

  getTotalCharges(): number {
    return this.charges.reduce((sum, charge) => sum + charge.amount, 0);
  }
}
