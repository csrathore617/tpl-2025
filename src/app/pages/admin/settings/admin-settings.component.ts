import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding:2rem;max-width:700px">
      <h1 style="margin-bottom:0.5rem">Settings</h1>
      <p style="color:var(--text-muted);margin-bottom:2rem">Configure tournament and auction settings</p>

      <div class="card" style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1.5rem;color:var(--primary)">💰 Auction Configuration</h3>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Initial Purse (₹)</label>
            <input class="form-control" type="number" [(ngModel)]="form.initialPurse" min="1000">
          </div>
          <div class="form-group">
            <label class="form-label">Base Bid (₹)</label>
            <input class="form-control" type="number" [(ngModel)]="form.baseBid" min="100">
          </div>
          <div class="form-group">
            <label class="form-label">Bid Increment (₹)</label>
            <input class="form-control" type="number" [(ngModel)]="form.bidIncrement" min="100">
          </div>
          <div class="form-group">
            <label class="form-label">Auction Timer (seconds)</label>
            <input class="form-control" type="number" [(ngModel)]="form.auctionTimer" min="5" max="120">
          </div>
          <div class="form-group">
            <label class="form-label">Maximum Teams</label>
            <input class="form-control" type="number" [(ngModel)]="form.maxTeams" min="2" max="10">
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1.5rem;color:var(--primary)">🏟️ Tournament Information</h3>
        <div class="form-group">
          <label class="form-label">Tournament Date</label>
          <input class="form-control" [(ngModel)]="form.tournamentDate" placeholder="e.g. 1st Week of November 2026">
        </div>
        <div class="form-group">
          <label class="form-label">Tournament Venue</label>
          <input class="form-control" [(ngModel)]="form.tournamentVenue" placeholder="Venue name and location">
        </div>
      </div>

      <div *ngIf="saved" style="background:rgba(34,197,94,0.1);border:1px solid var(--success);color:#86efac;padding:10px 16px;border-radius:8px;margin-bottom:1rem">
        ✅ Settings saved successfully!
      </div>

      <button class="btn btn-primary btn-lg" (click)="save()" [disabled]="saving">
        {{ saving ? 'Saving...' : '💾 Save Settings' }}
      </button>
    </div>
  `
})
export class AdminSettingsComponent implements OnInit {
  form: any = {};
  saving = false; saved = false;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getSettings().subscribe(s => this.form = { ...s });
  }

  save() {
    this.saving = true; this.saved = false;
    this.api.updateSettings(this.form).subscribe({
      next: () => { this.saving = false; this.saved = true; this.toast.success('Settings saved!'); setTimeout(() => this.saved = false, 3000); },
      error: (err) => { this.saving = false; this.toast.error(err.error?.error || 'Failed'); }
    });
  }
}
