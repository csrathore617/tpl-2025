import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';
import { TournamentSettings } from '../../../types/models';

@Component({
  selector: 'app-admin-tournament-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding:2rem;max-width:700px">
      <h1 style="margin-bottom:0.5rem">Venue & Contact</h1>
      <p style="color:var(--text-muted);margin-bottom:2rem">Manage venue and contact information shown publicly</p>

      <div class="card" style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1.5rem;color:var(--primary)">🏟️ Venue Information</h3>
        <div class="form-group">
          <label class="form-label">Venue Name</label>
          <input class="form-control" [(ngModel)]="form.venue_name" placeholder="e.g. Thebri Cricket Ground">
        </div>
        <div class="form-group">
          <label class="form-label">Full Address</label>
          <input class="form-control" [(ngModel)]="form.venue_address" placeholder="Full address">
        </div>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Opening Time</label>
            <input class="form-control" [(ngModel)]="form.opening_time" placeholder="e.g. 7:00 AM">
          </div>
          <div class="form-group">
            <label class="form-label">Closing Time</label>
            <input class="form-control" [(ngModel)]="form.closing_time" placeholder="e.g. 7:00 PM">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Google Maps URL</label>
          <input class="form-control" [(ngModel)]="form.maps_url" placeholder="https://maps.google.com/...">
        </div>
      </div>

      <div class="card" style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1.5rem;color:var(--primary)">📞 Contact Information</h3>
        <div class="grid grid-2">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input class="form-control" [(ngModel)]="form.phone" placeholder="+91 8000632162">
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp Number</label>
            <input class="form-control" [(ngModel)]="form.whatsapp" placeholder="+91 8000632162">
          </div>
          <div class="form-group">
            <label class="form-label">Phone Available Hours</label>
            <input class="form-control" [(ngModel)]="form.phone_available" placeholder="9:00 AM - 6:00 PM">
          </div>
          <div class="form-group">
            <label class="form-label">Response Time</label>
            <input class="form-control" [(ngModel)]="form.response_time" placeholder="Within 24 hours">
          </div>
          <div class="form-group">
            <label class="form-label">Primary Email</label>
            <input class="form-control" type="email" [(ngModel)]="form.primary_email">
          </div>
          <div class="form-group">
            <label class="form-label">Support Email</label>
            <input class="form-control" type="email" [(ngModel)]="form.support_email">
          </div>
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
export class AdminTournamentSettingsComponent implements OnInit {
  form: any = {};
  saving = false; saved = false;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.api.getTournamentSettings().subscribe(s => this.form = { ...s });
  }

  save() {
    this.saving = true; this.saved = false;
    this.api.updateTournamentSettings(this.form).subscribe({
      next: () => { this.saving = false; this.saved = true; this.toast.success('Saved!'); setTimeout(() => this.saved = false, 3000); },
      error: (err) => { this.saving = false; this.toast.error(err.error?.error || 'Failed'); }
    });
  }
}
