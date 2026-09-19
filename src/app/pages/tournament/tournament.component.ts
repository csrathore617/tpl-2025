import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Settings, TournamentSettings } from '../../types/models';

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container" style="max-width:900px;padding:2rem 1.5rem">
      <div class="page-header">
        <h1 class="page-title">🏟️ Tournament Information</h1>
        <p class="page-subtitle">Everything you need to know about TPL2026</p>
      </div>

      <div class="grid grid-2" style="margin-bottom:2rem">
        <div class="info-card">
          <div class="info-icon">🏆</div>
          <div><div class="info-label">Tournament</div><div class="info-value">TPL2026</div></div>
        </div>
        <div class="info-card">
          <div class="info-icon">🏏</div>
          <div><div class="info-label">Format</div><div class="info-value">T10 Cricket League</div></div>
        </div>
        <div class="info-card">
          <div class="info-icon">📅</div>
          <div><div class="info-label">Tournament Date</div><div class="info-value">{{ settings?.tournamentDate || 'To Be Announced' }}</div></div>
        </div>
        <div class="info-card">
          <div class="info-icon">🏟️</div>
          <div><div class="info-label">Venue</div><div class="info-value">{{ ts?.venue_name || settings?.tournamentVenue || 'To Be Announced' }}</div></div>
        </div>
        <div class="info-card">
          <div class="info-icon">🏆</div>
          <div><div class="info-label">Teams</div><div class="info-value">Maximum {{ settings?.maxTeams || '5' }} Teams</div></div>
        </div>
        <div class="info-card">
          <div class="info-icon">💰</div>
          <div><div class="info-label">Auction Purse</div><div class="info-value">₹{{ settings?.initialPurse || '21,000' }} per team</div></div>
        </div>
        <div class="info-card">
          <div class="info-icon">🎯</div>
          <div><div class="info-label">Base Bid</div><div class="info-value">₹{{ settings?.baseBid || '100' }}</div></div>
        </div>
        <div class="info-card">
          <div class="info-icon">📝</div>
          <div><div class="info-label">Registration</div><div class="info-value">Open – Register Now</div></div>
        </div>
      </div>

      <ng-container *ngIf="ts">
        <div class="card" style="margin-bottom:1.5rem" *ngIf="ts.phone || ts.primary_email || ts.venue_address">
          <h2 style="color:var(--primary);margin-bottom:1rem">📞 Contact & Venue Details</h2>
          <div class="grid grid-2">
            <div class="info-card" *ngIf="ts.venue_address">
              <div class="info-icon">📍</div>
              <div><div class="info-label">Address</div><div class="info-value">{{ ts.venue_address }}</div></div>
            </div>
            <div class="info-card" *ngIf="ts.opening_time">
              <div class="info-icon">🕐</div>
              <div><div class="info-label">Venue Hours</div><div class="info-value">{{ ts.opening_time }} – {{ ts.closing_time }}</div></div>
            </div>
            <div class="info-card" *ngIf="ts.phone">
              <div class="info-icon">📱</div>
              <div>
                <div class="info-label">Phone</div>
                <div class="info-value">{{ ts.phone }}</div>
                <div style="font-size:0.78rem;color:var(--text-muted)">{{ ts.phone_available }}</div>
              </div>
            </div>
            <div class="info-card" *ngIf="ts.whatsapp">
              <div class="info-icon">💬</div>
              <div><div class="info-label">WhatsApp</div><div class="info-value">{{ ts.whatsapp }}</div></div>
            </div>
            <div class="info-card" *ngIf="ts.primary_email">
              <div class="info-icon">📧</div>
              <div><div class="info-label">Email</div><div class="info-value">{{ ts.primary_email }}</div></div>
            </div>
          </div>
          <div *ngIf="ts.maps_url" style="margin-top:1rem">
            <a [href]="ts.maps_url" target="_blank" class="btn btn-secondary btn-sm">📍 View on Maps</a>
          </div>
        </div>
      </ng-container>

      <div class="card rules-section" style="margin-bottom:1.5rem">
        <h2 style="color:var(--primary);margin-bottom:1rem">🏏 Match Format – T10 Rules</h2>
        <ul>
          <li>T10 format – 10 overs per innings</li>
          <li>6 legal balls per over</li>
          <li>Two innings per match (one per team)</li>
          <li>Maximum 2 overs per bowler (default T10 rule)</li>
          <li>First 3 overs are Powerplay (fielding restrictions apply)</li>
          <li>No-ball results in a Free Hit on the next delivery</li>
          <li>Normal cricket rules apply for wides and no-balls</li>
          <li>Playing XI finalized before match start</li>
        </ul>
      </div>

      <div class="card rules-section" style="margin-bottom:1.5rem">
        <h2 style="color:var(--primary);margin-bottom:1rem">⚖️ Tie-Breaking</h2>
        <ul>
          <li>If a match is tied, a Super Over will be played</li>
          <li>Each team faces 1 over in the Super Over</li>
          <li>If Super Over is also tied, the team with more boundaries wins</li>
          <li>Tournament admin may configure alternative tie-break methods</li>
        </ul>
      </div>

      <div class="card rules-section" style="margin-bottom:1.5rem">
        <h2 style="color:var(--primary);margin-bottom:1rem">👤 Player Eligibility</h2>
        <ul>
          <li>Player must be registered and verified by admin</li>
          <li>Player must belong to the team assigned through official auction</li>
          <li>Playing eligibility is subject to organizer approval</li>
          <li>Players must be present at the venue on match day</li>
        </ul>
      </div>

      <div class="card rules-section">
        <h2 style="color:var(--primary);margin-bottom:1rem">🤝 Code of Conduct</h2>
        <ul>
          <li>Players must maintain sportsmanship at all times</li>
          <li>Abuse or unsportsmanlike behavior may result in disciplinary action</li>
          <li>Umpire decisions during the match are final</li>
          <li>Any disputes must be raised with the tournament organizer</li>
          <li>These rules are set by TPL2026 Organizers and are subject to change</li>
        </ul>
      </div>

      <div class="card" style="margin-top:1.5rem;text-align:center;background:linear-gradient(135deg,rgba(249,115,22,0.1),rgba(30,58,95,0.2));border-color:var(--primary)">
        <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem">
          <strong style="color:var(--accent)">TPL2026 Organizer Rules</strong> – Rules are subject to change by the tournament organizer. Check announcements for updates.
        </p>
        <a routerLink="/players/register" class="btn btn-primary">Register as Player</a>
      </div>
    </div>
  `,
  styles: [`
    .info-card { display: flex; align-items: center; gap: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.2rem; }
    .info-icon { font-size: 2rem; }
    .info-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-weight: 700; font-size: 1.05rem; margin-top: 2px; }
  `]
})
export class TournamentComponent implements OnInit {
  settings: Settings | null = null;
  ts: TournamentSettings | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getSettings().subscribe(s => this.settings = s);
    this.api.getTournamentSettings().subscribe(t => this.ts = t);
  }
}
