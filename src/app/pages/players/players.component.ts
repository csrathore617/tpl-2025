import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Player } from '../../types/models';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">🏏 Player Directory</h1>
        <p class="page-subtitle">Browse all registered players for TPL2026</p>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <input class="form-control search-input" placeholder="🔍 Search player..." [(ngModel)]="search" (ngModelChange)="applyFilters()">
        <select class="form-control" style="width:auto" [(ngModel)]="filterRole" (ngModelChange)="applyFilters()">
          <option value="">All Roles</option>
          <option>Batsman</option><option>Bowler</option><option>All Rounder</option><option>Wicket Keeper</option>
        </select>
        <select class="form-control" style="width:auto" [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
          <option value="">All Status</option>
          <option>REGISTERED</option><option>VERIFIED</option><option>AVAILABLE</option><option>SOLD</option><option>UNSOLD</option>
        </select>
        <select class="form-control" style="width:auto" [(ngModel)]="sortBy" (ngModelChange)="applyFilters()">
          <option value="name">Sort: Name</option>
          <option value="player_id">Sort: ID</option>
          <option value="role">Sort: Role</option>
          <option value="status">Sort: Status</option>
        </select>
        <a routerLink="/players/register" class="btn btn-primary">+ Register</a>
      </div>

      <div *ngIf="loading" class="grid grid-4">
        <div class="player-card skeleton" style="height:280px" *ngFor="let i of [1,2,3,4,5,6,7,8]"></div>
      </div>

      <div *ngIf="!loading && filtered.length === 0" class="empty-state">
        <div class="icon">🏏</div>
        <h3>No players found</h3>
        <p>Try adjusting your filters or <a routerLink="/players/register">register a player</a></p>
      </div>

      <div class="grid grid-4" *ngIf="!loading && filtered.length > 0">
        <div class="player-card" *ngFor="let p of filtered">
          <div class="player-card-header">
            <div *ngIf="p.photo; else noPhoto">
              <img [src]="api.getImageUrl(p.photo)" class="avatar avatar-xl" [alt]="p.name" style="margin:0 auto">
            </div>
            <ng-template #noPhoto>
              <div class="avatar avatar-xl avatar-placeholder" style="margin:0 auto;font-size:2rem">
                {{ p.name.charAt(0) }}
              </div>
            </ng-template>
            <div style="margin-top:12px">
              <div style="font-weight:700;font-size:1.05rem">{{ p.name }}</div>
              <div style="color:var(--text-muted);font-size:0.8rem">{{ p.player_id }}</div>
            </div>
          </div>
          <div class="player-card-body">
            <div class="player-info-row"><span>Role</span><span class="text-primary">{{ p.role }}</span></div>
            <div class="player-info-row"><span>Batting</span><span>{{ p.batting_style || '—' }}</span></div>
            <div class="player-info-row"><span>City</span><span>{{ p.city || '—' }}</span></div>
            <div class="player-info-row">
              <span>Status</span>
              <span class="badge badge-{{ p.status.toLowerCase() }}">{{ p.status }}</span>
            </div>
            <div class="player-info-row" *ngIf="p.status === 'SOLD'">
              <span>Team</span><span class="text-success">{{ p.team_id }}</span>
            </div>
            <a [routerLink]="['/players', p.player_id]" class="btn btn-secondary btn-sm" style="width:100%;justify-content:center;margin-top:12px">View Profile</a>
          </div>
        </div>
      </div>

      <div style="margin-top:1rem;color:var(--text-muted);font-size:0.85rem" *ngIf="!loading">
        Showing {{ filtered.length }} of {{ players.length }} players
      </div>
    </div>
  `,
  styles: [`
    .player-info-row { display: flex; justify-content: space-between; font-size: 0.82rem; padding: 4px 0; border-bottom: 1px solid rgba(55,65,81,0.3); color: var(--text-muted); }
    .player-info-row span:last-child { color: var(--text); font-weight: 500; }
  `]
})
export class PlayersComponent implements OnInit {
  players: Player[] = [];
  filtered: Player[] = [];
  loading = true;
  search = '';
  filterRole = '';
  filterStatus = '';
  sortBy = 'name';

  constructor(public api: ApiService) {}

  ngOnInit() {
    this.api.getPlayers().subscribe({ next: p => { this.players = p; this.applyFilters(); this.loading = false; }, error: () => this.loading = false });
  }

  applyFilters() {
    let result = [...this.players];
    if (this.search) result = result.filter(p => p.name.toLowerCase().includes(this.search.toLowerCase()) || p.player_id.toLowerCase().includes(this.search.toLowerCase()));
    if (this.filterRole) result = result.filter(p => p.role === this.filterRole);
    if (this.filterStatus) result = result.filter(p => p.status === this.filterStatus);
    result.sort((a, b) => String(a[this.sortBy as keyof Player]).localeCompare(String(b[this.sortBy as keyof Player])));
    this.filtered = result;
  }
}
