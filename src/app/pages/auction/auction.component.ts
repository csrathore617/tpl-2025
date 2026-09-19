import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { AuctionState, Team, AuctionRecord } from '../../types/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-auction',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Sold/Unsold overlay -->
    <div class="sold-overlay" *ngIf="showSoldOverlay" (click)="showSoldOverlay=false">
      <div class="sold-card">
        <div [class]="soldData.status === 'SOLD' ? 'sold-text' : 'unsold-text'">
          {{ soldData.status }}!
        </div>
        <ng-container *ngIf="soldData.status === 'SOLD'">
          <h2 style="margin:1rem 0 0.5rem">{{ soldData.player?.name }}</h2>
          <p style="color:var(--text-muted)">Sold to</p>
          <h2 style="color:var(--success);font-size:1.8rem">{{ soldData.team?.team_name }}</h2>
          <div class="bid-amount" style="margin:1rem 0">₹{{ soldData.finalBid | number }}</div>
          <p style="color:var(--text-muted)">Purse Remaining: <strong style="color:var(--accent)">₹{{ soldData.team?.remaining_purse | number }}</strong></p>
        </ng-container>
        <ng-container *ngIf="soldData.status === 'UNSOLD'">
          <h2 style="margin:1rem 0;color:var(--text-muted)">{{ soldData.player?.name }}</h2>
          <p style="color:var(--text-muted)">No bids received</p>
        </ng-container>
        <button class="btn btn-secondary" style="margin-top:1.5rem" (click)="showSoldOverlay=false">Close</button>
      </div>
    </div>

    <div class="container" style="padding:1.5rem">
      <div class="auction-header">
        <div>
          <h1 style="font-size:2rem">🏏 Live Auction</h1>
          <p style="color:var(--text-muted)">TPL2026 T10 Cricket League</p>
        </div>
        <div class="auction-status-badge" [class]="'status-' + (auctionState?.state || 'NOT_STARTED').toLowerCase()">
          <span class="live-dot" *ngIf="auctionState?.state === 'LIVE'"></span>
          {{ auctionState?.state || 'NOT_STARTED' }}
        </div>
      </div>

      <div class="auction-layout">
        <!-- LEFT: Current Player -->
        <div class="auction-left">
          <div class="auction-card" *ngIf="auctionState?.currentPlayer; else noPlayer">
            <div style="text-align:center;margin-bottom:1.5rem">
              <div *ngIf="auctionState?.currentPlayer?.photo; else noPhoto">
                <img [src]="api.getImageUrl(auctionState!.currentPlayer!.photo)" class="avatar" style="width:100px;height:100px;margin:0 auto">
              </div>
              <ng-template #noPhoto>
                <div class="avatar avatar-placeholder" style="width:100px;height:100px;margin:0 auto;font-size:2.5rem">
                  {{ auctionState?.currentPlayer?.name?.charAt(0) }}
                </div>
              </ng-template>
              <h2 style="margin-top:1rem;font-size:1.5rem">{{ auctionState?.currentPlayer?.name }}</h2>
              <div style="color:var(--text-muted);font-size:0.85rem">{{ auctionState?.currentPlayer?.player_id }}</div>
              <span class="badge badge-{{ (auctionState?.currentPlayer?.role || '').toLowerCase().replace(' ','-') }}" style="margin-top:8px">
                {{ auctionState?.currentPlayer?.role }}
              </span>
            </div>
            <div class="player-mini-info">
              <div><span>Batting</span><span>{{ auctionState?.currentPlayer?.batting_style || '—' }}</span></div>
              <div><span>Bowling</span><span>{{ auctionState?.currentPlayer?.bowling_style || '—' }}</span></div>
              <div><span>City</span><span>{{ auctionState?.currentPlayer?.city || '—' }}</span></div>
            </div>
            <div style="text-align:center;margin-top:1rem">
              <div style="color:var(--text-muted);font-size:0.8rem">BASE PRICE</div>
              <div style="font-size:1.5rem;font-weight:700;color:var(--accent)">₹{{ auctionState?.baseBid | number }}</div>
            </div>
          </div>
          <ng-template #noPlayer>
            <div class="auction-card" style="text-align:center;padding:3rem">
              <div style="font-size:3rem;margin-bottom:1rem">🏏</div>
              <h3 style="color:var(--text-muted)">No player selected</h3>
              <p style="color:var(--text-muted);font-size:0.85rem;margin-top:8px">
                {{ auctionState?.state === 'NOT_STARTED' ? 'Auction has not started yet' : 'Waiting for next player...' }}
              </p>
            </div>
          </ng-template>
        </div>

        <!-- CENTER: Bidding Area -->
        <div class="auction-center">
          <div class="auction-card" style="text-align:center">
            <!-- Timer -->
            <div style="display:flex;justify-content:center;margin-bottom:1.5rem">
              <div class="timer-circle" [class.urgent]="(auctionState?.timerSeconds || 0) <= 5 && auctionState?.state === 'LIVE'">
                {{ auctionState?.state === 'LIVE' ? (auctionState?.timerSeconds || 0) : '—' }}
              </div>
            </div>

            <div style="color:var(--text-muted);font-size:0.8rem;letter-spacing:1px;text-transform:uppercase">CURRENT BID</div>
            <div class="bid-amount">
              {{ auctionState?.currentBid ? '₹' + (auctionState!.currentBid | number) : '—' }}
            </div>

            <div *ngIf="auctionState?.currentBidTeamName" style="margin-top:0.5rem">
              <div style="color:var(--text-muted);font-size:0.8rem">HIGHEST BID BY</div>
              <div style="font-size:1.3rem;font-weight:700;color:var(--success)">{{ auctionState?.currentBidTeamName }}</div>
            </div>

            <div *ngIf="auctionState?.state === 'LIVE'" style="margin-top:1rem;color:var(--text-muted);font-size:0.85rem">
              Min next bid: <strong style="color:var(--accent)">₹{{ auctionState?.minNextBid | number }}</strong>
            </div>

            <!-- Team Owner Bid Button -->
            <div *ngIf="auth.isTeamOwner && auctionState?.state === 'LIVE'" style="margin-top:1.5rem">
              <button class="btn btn-primary btn-xl" style="width:100%;font-size:1.2rem"
                [disabled]="bidLoading || !canBid()"
                (click)="placeBid()">
                {{ bidLoading ? 'Placing Bid...' : 'BID ₹' + ((auctionState?.minNextBid || 0) | number) }}
              </button>
              <div *ngIf="myTeam" style="margin-top:8px;color:var(--text-muted);font-size:0.82rem">
                Your purse: <strong style="color:var(--accent)">₹{{ myTeam.remaining_purse | number }}</strong>
              </div>
            </div>

            <!-- Bid History -->
            <div style="margin-top:1.5rem;text-align:left">
              <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Live Bid History</div>
              <div *ngIf="auctionState?.bidHistory?.length === 0" style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem">
                No bids yet
              </div>
              <div class="bid-history-item" *ngFor="let b of (auctionState?.bidHistory || []).slice(0,8)">
                <span style="color:var(--text-muted);font-size:0.75rem">{{ b.bid_time | date:'HH:mm:ss' }}</span>
                <span style="font-weight:600">{{ b.team_name }}</span>
                <span style="color:var(--accent);font-weight:700">₹{{ b.bid_amount | number }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Teams Purse -->
        <div class="auction-right">
          <div class="auction-card">
            <h3 style="margin-bottom:1rem;font-size:1rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Team Purses</h3>
            <div class="purse-item" *ngFor="let t of teams" [class.leading]="t.team_id === auctionState?.currentBidTeamId">
              <div>
                <div style="font-weight:600;font-size:0.9rem">{{ t.team_name }}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">{{ t.players_count || 0 }} players</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;color:var(--accent)">₹{{ t.remaining_purse | number }}</div>
                <div style="font-size:0.7rem;color:var(--text-muted)">{{ getPursePercent(t) }}% left</div>
              </div>
            </div>

            <div style="margin-top:1.5rem;border-top:1px solid var(--border);padding-top:1rem">
              <div class="auction-stat"><span>Players Remaining</span><span class="text-primary">{{ stats.available }}</span></div>
              <div class="auction-stat"><span>Players Sold</span><span class="text-success">{{ stats.sold }}</span></div>
              <div class="auction-stat"><span>Players Unsold</span><span class="text-muted">{{ stats.unsold }}</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Auction History -->
      <div style="margin-top:2rem">
        <h2 style="margin-bottom:1rem">📊 Auction History</h2>
        <div class="table-wrap card" style="padding:0">
          <table>
            <thead><tr>
              <th>Player</th><th>Base</th><th>Final Bid</th><th>Team</th><th>Status</th><th>Time</th>
            </tr></thead>
            <tbody>
              <tr *ngFor="let a of history">
                <td>{{ a.player_name }}</td>
                <td>₹{{ a.base_price | number }}</td>
                <td><strong style="color:var(--accent)">{{ a.final_bid ? '₹' + (a.final_bid | number) : '—' }}</strong></td>
                <td>{{ a.winning_team_name || '—' }}</td>
                <td><span class="badge badge-{{ a.status.toLowerCase() }}">{{ a.status }}</span></td>
                <td style="color:var(--text-muted);font-size:0.8rem">{{ a.auction_time | date:'short' }}</td>
              </tr>
              <tr *ngIf="history.length === 0">
                <td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No auction history yet</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auction-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .auction-status-badge { padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
    .status-live { background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid #ef4444; }
    .status-paused { background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid #f59e0b; }
    .status-ready { background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid #3b82f6; }
    .status-not_started, .status-completed { background: rgba(148,163,184,0.2); color: #94a3b8; border: 1px solid #475569; }
    .status-sold { background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid #22c55e; }
    .status-unsold { background: rgba(148,163,184,0.2); color: #94a3b8; border: 1px solid #475569; }
    .auction-layout { display: grid; grid-template-columns: 260px 1fr 260px; gap: 1.5rem; }
    .player-mini-info div { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(55,65,81,0.3); font-size: 0.82rem; color: var(--text-muted); }
    .player-mini-info div span:last-child { color: var(--text); font-weight: 500; }
    .purse-item.leading { border-color: var(--success); background: rgba(34,197,94,0.05); }
    .auction-stat { display: flex; justify-content: space-between; padding: 5px 0; font-size: 0.85rem; color: var(--text-muted); }
    .auction-stat span:last-child { font-weight: 700; }
    @media (max-width: 1024px) { .auction-layout { grid-template-columns: 1fr 1fr; } .auction-right { grid-column: 1/-1; } }
    @media (max-width: 640px) { .auction-layout { grid-template-columns: 1fr; } .auction-header { flex-direction: column; gap: 1rem; align-items: flex-start; } }
  `]
})
export class AuctionComponent implements OnInit, OnDestroy {
  auctionState: AuctionState | null = null;
  teams: Team[] = [];
  history: AuctionRecord[] = [];
  myTeam: Team | null = null;
  showSoldOverlay = false;
  soldData: any = {};
  bidLoading = false;
  stats = { available: 0, sold: 0, unsold: 0 };
  private sub?: Subscription;

  constructor(
    public auth: AuthService,
    public api: ApiService,
    private socket: SocketService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadAll();
    this.sub = this.socket.events$.subscribe(({ event, data }) => {
      switch (event) {
        case 'AUCTION_STATE':
        case 'AUCTION_STARTED':
          this.auctionState = { ...this.auctionState, ...data };
          break;
        case 'PLAYER_SELECTED':
        case 'RANDOM_PLAYER_SELECTED':
          this.loadState();
          break;
        case 'BID_PLACED':
          if (this.auctionState) {
            this.auctionState.currentBid = data.currentBid;
            this.auctionState.currentBidTeamName = data.team;
            this.auctionState.minNextBid = data.minNextBid;
            if (!this.auctionState.bidHistory) this.auctionState.bidHistory = [];
            this.auctionState.bidHistory.unshift(data.bid);
          }
          break;
        case 'TIMER_UPDATED':
          if (this.auctionState) this.auctionState.timerSeconds = data.seconds;
          break;
        case 'PLAYER_SOLD':
          this.soldData = { status: 'SOLD', player: data.player, team: data.team, finalBid: data.finalBid };
          this.showSoldOverlay = true;
          if (this.auctionState) this.auctionState.state = 'SOLD';
          this.loadAll();
          setTimeout(() => this.showSoldOverlay = false, 5000);
          break;
        case 'PLAYER_UNSOLD':
          this.soldData = { status: 'UNSOLD', player: data.player };
          this.showSoldOverlay = true;
          if (this.auctionState) this.auctionState.state = 'UNSOLD';
          this.loadAll();
          setTimeout(() => this.showSoldOverlay = false, 3000);
          break;
        case 'TEAM_PURSE_UPDATED':
          this.loadTeams();
          break;
        case 'AUCTION_PAUSED':
          if (this.auctionState) this.auctionState.state = 'PAUSED';
          break;
        case 'AUCTION_RESUMED':
          if (this.auctionState) this.auctionState.state = 'LIVE';
          break;
        case 'AUCTION_COMPLETED':
          this.loadAll();
          break;
      }
    });
  }

  loadAll() {
    this.loadState();
    this.loadTeams();
    this.api.getAuctionHistory().subscribe(h => this.history = h.reverse());
    this.api.getStats().subscribe(s => {
      this.stats = { available: s.availablePlayers, sold: s.soldPlayers, unsold: s.unsoldPlayers };
    });
    if (this.auth.isTeamOwner && this.auth.currentUser?.teamId) {
      this.api.getTeam(this.auth.currentUser.teamId).subscribe(t => this.myTeam = t);
    }
  }

  loadState() {
    this.api.getAuctionState().subscribe(s => this.auctionState = s);
  }

  loadTeams() {
    this.api.getTeams().subscribe(t => this.teams = t);
  }

  canBid(): boolean {
    if (!this.myTeam || !this.auctionState) return false;
    return Number(this.myTeam.remaining_purse) >= (this.auctionState.minNextBid || 0);
  }

  placeBid() {
    if (!this.auctionState) return;
    this.bidLoading = true;
    this.api.placeBid(this.auctionState.minNextBid).subscribe({
      next: () => { this.bidLoading = false; this.toast.success('Bid placed!'); },
      error: (err) => { this.bidLoading = false; this.toast.error(err.error?.error || 'Bid failed'); }
    });
  }

  getPursePercent(t: Team): number {
    return t.initial_purse > 0 ? Math.round((Number(t.remaining_purse) / Number(t.initial_purse)) * 100) : 0;
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
