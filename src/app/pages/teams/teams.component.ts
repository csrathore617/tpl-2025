import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Team } from '../../types/models';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">🏆 Teams</h1>
        <p class="page-subtitle">Meet the TPL2026 competing teams</p>
      </div>

      <div *ngIf="loading" class="grid grid-3">
        <div class="team-card skeleton" style="height:220px" *ngFor="let i of [1,2,3,4,5]"></div>
      </div>

      <div *ngIf="!loading && teams.length === 0" class="empty-state">
        <div class="icon">🏆</div>
        <h3>No teams registered yet</h3>
        <p>Teams will be added by the tournament admin</p>
      </div>

      <div class="grid grid-3" *ngIf="!loading && teams.length > 0">
        <div class="team-card" *ngFor="let t of teams" [style.border-top]="'4px solid ' + (t.team_color || '#f97316')">
          <div class="team-card-header">
            <div *ngIf="t.logo; else noLogo">
              <img [src]="api.getImageUrl(t.logo)" class="team-logo" [alt]="t.team_name">
            </div>
            <ng-template #noLogo>
              <div class="team-logo-placeholder" [style.background]="t.team_color || '#1a73e8'">
                {{ t.short_name || t.team_name.charAt(0) }}
              </div>
            </ng-template>
            <div>
              <h3 style="font-size:1.3rem">{{ t.team_name }}</h3>
              <div style="color:var(--text-muted);font-size:0.8rem">{{ t.short_name }} · {{ t.city || 'N/A' }}</div>
              <span class="badge badge-{{ t.status.toLowerCase() }}" style="margin-top:4px">{{ t.status }}</span>
            </div>
          </div>
          <div style="padding:0 1.5rem 1.5rem">
            <div class="team-stat-row"><span>Owner</span><span>{{ t.owner_name }}</span></div>
            <div class="team-stat-row"><span>Players</span><span class="text-primary">{{ t.players_count || 0 }}</span></div>
            <div class="team-stat-row"><span>Purse Remaining</span><span class="text-accent">₹{{ t.remaining_purse | number }}</span></div>
            <div style="margin-top:12px">
              <div class="purse-bar">
                <div class="purse-bar-fill" [style.width]="getPursePercent(t) + '%'"></div>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);margin-top:4px">
                <span>₹{{ t.remaining_purse | number }} remaining</span>
                <span>of ₹{{ t.initial_purse | number }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && teams.length >= 5" class="info-banner">
        🔒 Team Registration Closed – Maximum 5 teams reached
      </div>
    </div>
  `,
  styles: [`
    .team-stat-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(55,65,81,0.3); font-size: 0.85rem; color: var(--text-muted); }
    .team-stat-row span:last-child { color: var(--text); font-weight: 500; }
    .info-banner { margin-top: 2rem; background: rgba(59,130,246,0.1); border: 1px solid var(--info); color: #93c5fd; padding: 12px 20px; border-radius: 8px; text-align: center; }
  `]
})
export class TeamsComponent implements OnInit {
  teams: Team[] = [];
  loading = true;

  constructor(public api: ApiService) {}

  ngOnInit() {
    this.api.getTeams().subscribe({ next: t => { this.teams = t; this.loading = false; }, error: () => this.loading = false });
  }

  getPursePercent(t: Team): number {
    return t.initial_purse > 0 ? Math.round((Number(t.remaining_purse) / Number(t.initial_purse)) * 100) : 0;
  }
}
