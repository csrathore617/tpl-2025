import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Player } from '../../types/models';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container" style="max-width:800px;padding-top:2rem">
      <a routerLink="/players" class="btn btn-secondary btn-sm" style="margin-bottom:1.5rem">← Back to Players</a>

      <div *ngIf="loading" class="card skeleton" style="height:400px"></div>

      <div *ngIf="!loading && !player" class="empty-state">
        <div class="icon">❌</div>
        <h3>Player not found</h3>
      </div>

      <div *ngIf="player" class="card">
        <div class="profile-header">
          <div *ngIf="player.photo; else noPhoto">
            <img [src]="api.getImageUrl(player.photo)" class="avatar avatar-xl" [alt]="player.name">
          </div>
          <ng-template #noPhoto>
            <div class="avatar avatar-xl avatar-placeholder">{{ player.name.charAt(0) }}</div>
          </ng-template>
          <div class="profile-info">
            <h1 style="font-size:2rem">{{ player.name }}</h1>
            <div style="color:var(--text-muted)">{{ player.player_id }}</div>
            <div style="margin-top:8px">
              <span class="badge badge-{{ player.status.toLowerCase() }}">{{ player.status }}</span>
            </div>
            <div *ngIf="player.status === 'SOLD'" style="margin-top:8px;color:var(--success);font-weight:600">
              Sold to {{ player.team_id }} for ₹{{ player.final_bid | number }}
            </div>
          </div>
        </div>

        <div class="grid grid-2" style="margin-top:2rem;gap:1rem">
          <div class="info-block">
            <div class="info-label">Playing Role</div>
            <div class="info-value text-primary">{{ player.role }}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Batting Style</div>
            <div class="info-value">{{ player.batting_style || '—' }}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Bowling Style</div>
            <div class="info-value">{{ player.bowling_style || '—' }}</div>
          </div>
          <div class="info-block">
            <div class="info-label">City</div>
            <div class="info-value">{{ player.city || '—' }}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Age</div>
            <div class="info-value">{{ player.age || '—' }}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Jersey Number</div>
            <div class="info-value">{{ player.jersey_number || '—' }}</div>
          </div>
          <div class="info-block" style="grid-column:1/-1">
            <div class="info-label">Experience</div>
            <div class="info-value">{{ player.experience || 'Not specified' }}</div>
          </div>
          <div class="info-block">
            <div class="info-label">Registered</div>
            <div class="info-value">{{ player.registration_date | date:'mediumDate' }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-header { display: flex; gap: 2rem; align-items: flex-start; }
    .profile-info { flex: 1; }
    .info-block { background: var(--bg-card2); padding: 1rem; border-radius: 8px; }
    .info-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .info-value { font-weight: 600; font-size: 1rem; }
    @media (max-width: 640px) { .profile-header { flex-direction: column; align-items: center; text-align: center; } }
  `]
})
export class PlayerDetailComponent implements OnInit {
  player: Player | null = null;
  loading = true;

  constructor(private route: ActivatedRoute, public api: ApiService) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.player = null;
        this.loading = true;
        return this.api.getPlayer(params.get('id') || '');
      })
    ).subscribe({
      next: p => { this.player = p; this.loading = false; },
      error: () => { this.player = null; this.loading = false; }
    });
  }
}
