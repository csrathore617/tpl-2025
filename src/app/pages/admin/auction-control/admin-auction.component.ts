import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { SocketService } from '../../../services/socket.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmModalComponent } from '../../../components/confirm-modal/confirm-modal.component';
import { AuctionState, Player, Team } from '../../../types/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-auction',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <!-- Random Player Animation Overlay -->
    <div class="modal-overlay" *ngIf="showRandom">
      <div class="modal" style="max-width:500px;text-align:center">
        <h2 style="margin-bottom:1.5rem;color:var(--primary)">🎲 Random Player Selection</h2>
        <div *ngIf="randomCycling" class="random-grid">
          <div class="random-player-card" *ngFor="let p of randomDisplay" [class.active]="p === randomHighlight">
            <div style="font-weight:700;font-size:0.9rem">{{ p.name }}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">{{ p.role }}</div>
          </div>
        </div>
        <div *ngIf="!randomCycling && randomSelected" style="padding:1rem">
          <div style="font-size:1rem;color:var(--text-muted);margin-bottom:0.5rem">PLAYER SELECTED</div>
          <h2 style="font-size:2rem;color:var(--accent)">{{ randomSelected.name }}</h2>
          <div style="color:var(--text-muted);margin:8px 0">{{ randomSelected.role }} · {{ randomSelected.player_id }}</div>
          <div style="color:var(--text-muted)">Base Price: <strong style="color:var(--primary)">₹{{ auctionState?.baseBid | number }}</strong></div>
        </div>
        <div class="modal-actions" style="justify-content:center">
          <button class="btn btn-secondary" (click)="showRandom=false">Close</button>
          <button class="btn btn-success" *ngIf="!randomCycling && randomSelected" (click)="startAuction();showRandom=false">▶ Start Auction</button>
        </div>
      </div>
    </div>

    <!-- Select Player Modal -->
    <div class="modal-overlay" *ngIf="showSelectPlayer" (click)="showSelectPlayer=false">
      <div class="modal" style="max-width:600px;max-height:80vh;overflow-y:auto" (click)="$event.stopPropagation()">
        <h2 class="modal-title">Select Player for Auction</h2>
        <input class="form-control" placeholder="🔍 Search player..." [(ngModel)]="playerSearch" (ngModelChange)="filterEligible()" style="margin-bottom:1rem">
        <div *ngFor="let p of eligibleFiltered" class="player-select-row" (click)="selectPlayer(p)">
          <div>
            <div style="font-weight:600">{{ p.name }}</div>
            <div style="font-size:0.78rem;color:var(--text-muted)">{{ p.player_id }} · {{ p.role }}</div>
          </div>
          <span class="badge badge-{{ p.status.toLowerCase() }}">{{ p.status }}</span>
        </div>
        <div *ngIf="eligibleFiltered.length === 0" style="text-align:center;color:var(--text-muted);padding:2rem">No eligible players</div>
      </div>
    </div>

    <app-confirm-modal [visible]="confirm.show" [title]="confirm.title" [message]="confirm.message"
      [confirmText]="confirm.confirmText" [confirmClass]="confirm.confirmClass"
      (confirmed)="confirm.action();confirm.show=false" (cancelled)="confirm.show=false">
    </app-confirm-modal>

    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
        <div>
          <h1>Auction Control</h1>
          <p style="color:var(--text-muted)">Manage the live auction</p>
        </div>
        <div class="auction-status-badge status-{{ (auctionState?.state || 'NOT_STARTED').toLowerCase() }}">
          <span class="live-dot" *ngIf="auctionState?.state === 'LIVE'"></span>
          {{ auctionState?.state || 'NOT_STARTED' }}
        </div>
      </div>

      <div class="auction-control-layout">
        <!-- Control Panel -->
        <div>
          <!-- Current Player Card -->
          <div class="card" style="margin-bottom:1.5rem">
            <h3 style="margin-bottom:1rem;color:var(--text-muted);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.5px">Current Player</h3>
            <div *ngIf="auctionState?.currentPlayer; else noPlayer" style="display:flex;gap:1rem;align-items:center">
              <div *ngIf="auctionState?.currentPlayer?.photo; else noPhoto">
                <img [src]="api.getImageUrl(auctionState!.currentPlayer!.photo)" class="avatar" style="width:64px;height:64px">
              </div>
              <ng-template #noPhoto>
                <div class="avatar avatar-placeholder" style="width:64px;height:64px;font-size:1.5rem">{{ auctionState?.currentPlayer?.name?.charAt(0) }}</div>
              </ng-template>
              <div>
                <div style="font-size:1.2rem;font-weight:700">{{ auctionState?.currentPlayer?.name }}</div>
                <div style="color:var(--text-muted);font-size:0.85rem">{{ auctionState?.currentPlayer?.player_id }} · {{ auctionState?.currentPlayer?.role }}</div>
                <div style="margin-top:4px">
                  <span style="color:var(--text-muted);font-size:0.8rem">Base: </span>
                  <strong style="color:var(--accent)">₹{{ auctionState?.baseBid | number }}</strong>
                </div>
              </div>
            </div>
            <ng-template #noPlayer>
              <p style="color:var(--text-muted)">No player selected. Use buttons below to select.</p>
            </ng-template>
          </div>

          <!-- Live Bid Info -->
          <div class="card" style="margin-bottom:1.5rem;text-align:center" *ngIf="auctionState?.state === 'LIVE' || auctionState?.currentBid">
            <div style="color:var(--text-muted);font-size:0.8rem;text-transform:uppercase">Current Bid</div>
            <div class="bid-amount">{{ auctionState?.currentBid ? '₹' + (auctionState!.currentBid | number) : '—' }}</div>
            <div *ngIf="auctionState?.currentBidTeamName" style="color:var(--success);font-weight:600">{{ auctionState?.currentBidTeamName }}</div>
            <div style="margin-top:1rem">
              <div class="timer-circle" style="margin:0 auto" [class.urgent]="(auctionState?.timerSeconds || 0) <= 5 && auctionState?.state === 'LIVE'">
                {{ auctionState?.state === 'LIVE' ? (auctionState?.timerSeconds || 0) : '—' }}
              </div>
            </div>
          </div>

          <!-- Control Buttons -->
          <div class="card" style="margin-bottom:1.5rem">
            <h3 style="margin-bottom:1rem;color:var(--text-muted);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.5px">Player Selection</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-info" (click)="showSelectPlayer=true;loadEligible()">🎯 Select Player</button>
              <button class="btn btn-warning" (click)="doRandomPlayer()">🎲 Random Player</button>
            </div>
          </div>

          <div class="card" style="margin-bottom:1.5rem">
            <h3 style="margin-bottom:1rem;color:var(--text-muted);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.5px">Auction Controls</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-success" (click)="startAuction()" [disabled]="!auctionState?.currentPlayer || auctionState?.state === 'LIVE'">▶ Start Auction</button>
              <button class="btn btn-warning" (click)="pauseAuction()" [disabled]="auctionState?.state !== 'LIVE'">⏸ Pause</button>
              <button class="btn btn-info" (click)="resumeAuction()" [disabled]="auctionState?.state !== 'PAUSED'">▶ Resume</button>
            </div>
          </div>

          <div class="card" style="margin-bottom:1.5rem">
            <h3 style="margin-bottom:1rem;color:var(--text-muted);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.5px">Result</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-success" (click)="confirmMarkSold()" [disabled]="!auctionState?.currentBidTeamId">✅ Mark Sold</button>
              <button class="btn btn-secondary" (click)="confirmMarkUnsold()" [disabled]="!auctionState?.currentPlayer">❌ Mark Unsold</button>
            </div>
          </div>

          <div class="card">
            <h3 style="margin-bottom:1rem;color:var(--text-muted);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.5px">Advanced</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-warning" (click)="confirmUndo()">↩ Undo Last</button>
              <button class="btn btn-danger" (click)="confirmReset()">🔄 Reset</button>
            </div>
          </div>
        </div>

        <!-- Right: Bid History + Teams -->
        <div>
          <div class="card" style="margin-bottom:1.5rem">
            <h3 style="margin-bottom:1rem;font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Live Bid History</h3>
            <div *ngIf="!auctionState?.bidHistory?.length" style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:1rem">No bids yet</div>
            <div class="bid-history-item" *ngFor="let b of (auctionState?.bidHistory || []).slice(0,10)">
              <span style="color:var(--text-muted);font-size:0.75rem">{{ b.bid_time | date:'HH:mm:ss' }}</span>
              <span style="font-weight:600">{{ b.team_name }}</span>
              <span style="color:var(--accent);font-weight:700">₹{{ b.bid_amount | number }}</span>
            </div>
          </div>

          <div class="card">
            <h3 style="margin-bottom:1rem;font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Team Purses</h3>
            <div class="purse-item" *ngFor="let t of teams" [class.leading]="t.team_id === auctionState?.currentBidTeamId">
              <div>
                <div style="font-weight:600;font-size:0.9rem">{{ t.team_name }}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">{{ t.players_count || 0 }} players</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:700;color:var(--accent)">₹{{ t.remaining_purse | number }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auction-control-layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
    .auction-status-badge { padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
    .status-live { background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid #ef4444; }
    .status-paused { background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid #f59e0b; }
    .status-ready { background: rgba(59,130,246,0.2); color: #60a5fa; border: 1px solid #3b82f6; }
    .status-not_started,.status-completed { background: rgba(148,163,184,0.2); color: #94a3b8; border: 1px solid #475569; }
    .status-sold { background: rgba(34,197,94,0.2); color: #4ade80; border: 1px solid #22c55e; }
    .status-unsold { background: rgba(148,163,184,0.2); color: #94a3b8; border: 1px solid #475569; }
    .player-select-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s; margin-bottom: 4px; }
    .player-select-row:hover { background: var(--bg-card2); }
    .random-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 1rem; }
    .purse-item.leading { border-color: var(--success); background: rgba(34,197,94,0.05); }
    @media (max-width: 900px) { .auction-control-layout { grid-template-columns: 1fr; } }
  `]
})
export class AdminAuctionComponent implements OnInit, OnDestroy {
  auctionState: AuctionState | null = null;
  teams: Team[] = [];
  eligiblePlayers: Player[] = [];
  eligibleFiltered: Player[] = [];
  playerSearch = '';
  showRandom = false; randomCycling = false; randomSelected: Player | null = null;
  randomDisplay: Player[] = []; randomHighlight: Player | null = null;
  showSelectPlayer = false;
  confirm = { show: false, title: '', message: '', confirmText: '', confirmClass: 'danger', action: () => {} };
  private sub?: Subscription;

  constructor(public api: ApiService, private socket: SocketService, private toast: ToastService) {}

  ngOnInit() {
    this.loadState(); this.loadTeams();
    this.sub = this.socket.events$.subscribe(({ event, data }) => {
      switch (event) {
        case 'AUCTION_STATE': case 'AUCTION_STARTED': this.auctionState = { ...this.auctionState, ...data }; break;
        case 'BID_PLACED':
          if (this.auctionState) {
            this.auctionState.currentBid = data.currentBid;
            this.auctionState.currentBidTeamName = data.team;
            this.auctionState.minNextBid = data.minNextBid;
            if (!this.auctionState.bidHistory) this.auctionState.bidHistory = [];
            this.auctionState.bidHistory.unshift(data.bid);
          }
          break;
        case 'TIMER_UPDATED': if (this.auctionState) this.auctionState.timerSeconds = data.seconds; break;
        case 'PLAYER_SOLD': case 'PLAYER_UNSOLD':
          if (this.auctionState) this.auctionState.state = event === 'PLAYER_SOLD' ? 'SOLD' : 'UNSOLD';
          this.loadTeams(); this.toast.success(event === 'PLAYER_SOLD' ? `${data.player?.name} SOLD for ₹${data.finalBid}` : `${data.player?.name} UNSOLD`);
          break;
        case 'AUCTION_PAUSED': if (this.auctionState) this.auctionState.state = 'PAUSED'; break;
        case 'AUCTION_RESUMED': if (this.auctionState) this.auctionState.state = 'LIVE'; break;
        case 'PLAYER_SELECTED': this.loadState(); break;
        case 'TEAM_PURSE_UPDATED': this.loadTeams(); break;
      }
    });
  }

  loadState() { this.api.getAuctionState().subscribe(s => this.auctionState = s); }
  loadTeams() { this.api.getTeams().subscribe(t => this.teams = t); }

  loadEligible() {
    this.api.getPlayers().subscribe(p => {
      this.eligiblePlayers = p.filter(x => ['AVAILABLE','VERIFIED'].includes(x.status));
      this.filterEligible();
    });
  }

  filterEligible() {
    this.eligibleFiltered = this.playerSearch
      ? this.eligiblePlayers.filter(p => p.name.toLowerCase().includes(this.playerSearch.toLowerCase()) || p.player_id.includes(this.playerSearch))
      : this.eligiblePlayers;
  }

  selectPlayer(p: Player) {
    this.api.selectPlayer(p.player_id).subscribe({
      next: () => { this.showSelectPlayer = false; this.toast.success(`${p.name} selected`); this.loadState(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }

  doRandomPlayer() {
    this.api.getPlayers().subscribe(players => {
      const eligible = players.filter(p => ['AVAILABLE','VERIFIED'].includes(p.status));
      if (!eligible.length) { this.toast.error('No eligible players'); return; }
      this.randomDisplay = eligible.slice(0, 9);
      this.randomCycling = true; this.randomSelected = null; this.showRandom = true;
      let count = 0;
      const interval = setInterval(() => {
        this.randomHighlight = this.randomDisplay[count % this.randomDisplay.length];
        count++;
        if (count > 20) {
          clearInterval(interval);
          this.api.randomPlayer().subscribe({
            next: (res) => { this.randomCycling = false; this.randomSelected = res.selected; this.loadState(); },
            error: (err) => { this.randomCycling = false; this.toast.error(err.error?.error || 'Failed'); }
          });
        }
      }, 100);
    });
  }

  startAuction() {
    this.api.startAuction().subscribe({
      next: () => { this.toast.success('Auction started!'); this.loadState(); },
      error: (err) => this.toast.error(err.error?.error || 'Failed')
    });
  }

  pauseAuction() {
    this.api.pauseAuction().subscribe({ next: () => this.toast.info('Auction paused'), error: (err) => this.toast.error(err.error?.error || 'Failed') });
  }

  resumeAuction() {
    this.api.resumeAuction().subscribe({ next: () => this.toast.success('Auction resumed'), error: (err) => this.toast.error(err.error?.error || 'Failed') });
  }

  markSold() {
    this.api.markSold().subscribe({ next: () => this.toast.success('Player marked sold!'), error: (err) => this.toast.error(err.error?.error || 'Failed') });
  }

  markUnsold() {
    this.api.markUnsold().subscribe({ next: () => this.toast.info('Player marked unsold'), error: (err) => this.toast.error(err.error?.error || 'Failed') });
  }

  undoAuction() {
    this.api.undoAuction().subscribe({ next: () => { this.toast.success('Last auction undone'); this.loadTeams(); }, error: (err) => this.toast.error(err.error?.error || 'Failed') });
  }

  resetAuction() {
    this.api.resetAuction().subscribe({ next: () => { this.toast.warning('Auction reset'); this.loadState(); }, error: (err) => this.toast.error(err.error?.error || 'Failed') });
  }

  confirmMarkSold() { this.askConfirm('Mark Sold', 'Confirm sale of ' + this.auctionState?.currentPlayer?.name + ' to ' + this.auctionState?.currentBidTeamName + '?', 'Mark Sold', 'success', 'markSold'); }
  confirmMarkUnsold() { this.askConfirm('Mark Unsold', 'Mark ' + this.auctionState?.currentPlayer?.name + ' as unsold?', 'Mark Unsold', 'warning', 'markUnsold'); }
  confirmUndo() { this.askConfirm('Undo Last Auction', 'This will revert the last sold player back to AVAILABLE and restore team purse. Continue?', 'Undo', 'warning', 'undoAuction'); }
  confirmReset() { this.askConfirm('Reset Auction', 'This will reset the entire auction state. All current bidding data will be cleared. Continue?', 'Reset', 'danger', 'resetAuction'); }

  askConfirm(title: string, message: string, confirmText: string, confirmClass: string, method: string) {
    this.confirm = { show: true, title, message, confirmText, confirmClass, action: () => (this as any)[method]() };
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}
