import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TournamentSettings } from '../../types/models';

@Component({
  selector: 'app-venue-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="padding:2rem 1.5rem;max-width:900px">
      <div class="page-header">
        <h1 class="page-title">🏟️ Venue & Contact</h1>
        <p class="page-subtitle">Find us and get in touch</p>
      </div>

      <div *ngIf="loading" class="grid grid-2">
        <div class="card skeleton" style="height:200px"></div>
        <div class="card skeleton" style="height:200px"></div>
      </div>

      <div class="grid grid-2" *ngIf="!loading && settings">
        <div class="card">
          <h2 style="color:var(--primary);margin-bottom:1.5rem;font-size:1.4rem">🏟️ Venue</h2>
          <div class="info-row" *ngIf="settings.venue_name">
            <span class="info-icon">📍</span>
            <div>
              <div class="info-label">Venue</div>
              <div class="info-value">{{ settings.venue_name }}</div>
            </div>
          </div>
          <div class="info-row" *ngIf="settings.venue_address">
            <span class="info-icon">🗺️</span>
            <div>
              <div class="info-label">Address</div>
              <div class="info-value">{{ settings.venue_address }}</div>
            </div>
          </div>
          <div class="info-row" *ngIf="settings.opening_time || settings.closing_time">
            <span class="info-icon">🕐</span>
            <div>
              <div class="info-label">Open Hours</div>
              <div class="info-value">{{ settings.opening_time }} – {{ settings.closing_time }}</div>
            </div>
          </div>
          <a *ngIf="settings.maps_url" [href]="settings.maps_url" target="_blank" class="btn btn-secondary btn-sm" style="margin-top:1rem">
            🗺️ View on Map
          </a>
        </div>

        <div class="card">
          <h2 style="color:var(--primary);margin-bottom:1.5rem;font-size:1.4rem">📞 Contact</h2>
          <div class="info-row" *ngIf="settings.phone">
            <span class="info-icon">📱</span>
            <div>
              <div class="info-label">Phone</div>
              <div class="info-value">{{ settings.phone }}</div>
              <div style="color:var(--text-muted);font-size:0.78rem" *ngIf="settings.phone_available">Available: {{ settings.phone_available }}</div>
            </div>
          </div>
          <div class="contact-btns" *ngIf="settings.phone || settings.whatsapp">
            <a *ngIf="settings.phone" [href]="phoneUrl" class="btn btn-success btn-sm">📞 Call</a>
            <a *ngIf="settings.whatsapp" [href]="whatsappUrl" target="_blank" class="btn btn-success btn-sm">💬 WhatsApp</a>
          </div>
          <div class="info-row" style="margin-top:1rem" *ngIf="settings.primary_email">
            <span class="info-icon">📧</span>
            <div>
              <div class="info-label">Email</div>
              <div class="info-value">{{ settings.primary_email }}</div>
              <div style="color:var(--text-muted);font-size:0.78rem" *ngIf="settings.support_email">Support: {{ settings.support_email }}</div>
              <div style="color:var(--text-muted);font-size:0.78rem" *ngIf="settings.response_time">Response: {{ settings.response_time }}</div>
            </div>
          </div>
          <div class="contact-btns" *ngIf="settings.primary_email" style="margin-top:0.5rem">
            <a [href]="mailUrl" class="btn btn-info btn-sm">📧 Email Us</a>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && !settings" class="empty-state">
        <div class="icon">🏟️</div>
        <h3>Venue information coming soon</h3>
      </div>
    </div>
  `,
  styles: [`
    .info-row { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
    .info-icon { font-size: 1.5rem; flex-shrink: 0; }
    .info-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-weight: 600; margin-top: 2px; }
    .contact-btns { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 0.5rem; }
  `]
})
export class VenueContactComponent implements OnInit {
  settings: TournamentSettings | null = null;
  loading = true;
  phoneUrl = '';
  whatsappUrl = '';
  mailUrl = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getTournamentSettings().subscribe({
      next: s => {
        this.settings = s;
        this.loading = false;
        this.phoneUrl = 'tel:' + (s.phone || '');
        this.whatsappUrl = 'https://wa.me/' + (s.whatsapp || '').replace(/[^0-9]/g, '');
        this.mailUrl = 'mailto:' + (s.primary_email || '');
      },
      error: () => this.loading = false
    });
  }
}
