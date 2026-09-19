import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Settings } from '../../types/models';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="max-width:900px;padding:2rem 1.5rem">
      <div class="page-header">
        <h1 class="page-title">📋 TPL2026 Auction Rules</h1>
        <p class="page-subtitle">Official rules for the TPL2026 T10 Cricket League Auction</p>
      </div>

      <div class="rules-section">
        <div class="card" style="margin-bottom:1.5rem" *ngFor="let section of ruleSections">
          <h2 style="color:var(--primary);margin-bottom:1rem;font-size:1.5rem">{{ section.title }}</h2>
          <ul>
            <li *ngFor="let rule of section.rules">{{ rule }}</li>
          </ul>
        </div>
      </div>

      <div class="card" style="background:linear-gradient(135deg,rgba(249,115,22,0.1),rgba(30,58,95,0.2));border-color:var(--primary)">
        <h2 style="color:var(--accent);margin-bottom:1rem">⚡ Quick Reference</h2>
        <div class="grid grid-3">
          <div class="qr-item"><div class="qr-value">₹{{ settings?.initialPurse || '21,000' }}</div><div class="qr-label">Starting Purse</div></div>
          <div class="qr-item"><div class="qr-value">₹{{ settings?.baseBid || '100' }}</div><div class="qr-label">Base Bid</div></div>
          <div class="qr-item"><div class="qr-value">₹{{ settings?.bidIncrement || '100' }}</div><div class="qr-label">Bid Increment</div></div>
          <div class="qr-item"><div class="qr-value">{{ settings?.maxTeams || '5' }}</div><div class="qr-label">Max Teams</div></div>
          <div class="qr-item"><div class="qr-value">{{ settings?.auctionTimer || '20' }}s</div><div class="qr-label">Auction Timer</div></div>
          <div class="qr-item"><div class="qr-value">T10</div><div class="qr-label">Format</div></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .qr-item { text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; }
    .qr-value { font-size: 1.8rem; font-weight: 800; font-family: 'Rajdhani',sans-serif; color: var(--primary); }
    .qr-label { font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; }
  `]
})
export class RulesComponent implements OnInit {
  settings: Settings | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() { this.api.getSettings().subscribe(s => this.settings = s); }

  ruleSections = [
    {
      title: '🏆 Team Rules',
      rules: [
        'Maximum 5 teams are allowed in the tournament.',
        'Each team receives ₹21,000 as starting auction purse.',
        'Only registered and active teams can participate in the auction.',
        'Only the authorized team owner or representative can place bids.',
        'A team cannot bid more than its remaining purse.',
        'Team registration is managed exclusively by the tournament admin.'
      ]
    },
    {
      title: '🏏 Player Rules',
      rules: [
        'Players must register through the official registration form.',
        'Registered players become eligible for auction after admin verification.',
        'Each player can be auctioned only once.',
        'Players can be marked SOLD or UNSOLD after auction.',
        'Admin controls player status movement.',
        'WITHDRAWN players are not eligible for auction.',
        'RETAINED players are pre-assigned and not auctioned.'
      ]
    },
    {
      title: '💰 Bidding Rules',
      rules: [
        'Starting/base bid is ₹100 (configurable by admin).',
        'Bid increment is ₹100 per bid (configurable by admin).',
        'Each bid must be greater than the current highest bid.',
        'Bids must follow the configured increment: ₹100 → ₹200 → ₹300...',
        'A team cannot place a bid exceeding its remaining purse.',
        'Only authorized team owners can place bids during live auction.',
        'Admin can also place bids on behalf of teams if required.'
      ]
    },
    {
      title: '⏱️ Auction Timer',
      rules: [
        'Default auction timer is 20 seconds (configurable by admin).',
        'Timer resets to configured duration after every valid bid.',
        'When timer reaches zero with a valid bid: Player is SOLD.',
        'When timer reaches zero with no bids: Player is UNSOLD.',
        'Admin can override the timer decision at any time.',
        'Admin can pause and resume the auction.'
      ]
    },
    {
      title: '✅ Winning Bid',
      rules: [
        'The highest valid bid at timer expiry wins the player.',
        'Only the final winning bid amount is deducted from team purse.',
        'Intermediate bids do NOT deduct from purse.',
        'After player is SOLD: status updates, team purse deducts, history records.',
        'Admin can undo the last auction transaction if required.',
        'Negative purse is never allowed under any circumstances.'
      ]
    },
    {
      title: '🎛️ Admin Controls',
      rules: [
        'Only admin can start, pause, resume, or end the auction.',
        'Only admin can select or randomly pick the next player.',
        'Only admin can mark a player as SOLD or UNSOLD.',
        'Admin can undo the last auction transaction.',
        'Admin can reset the entire auction if required.',
        'Admin can configure bid increment, base price, timer, and purse.',
        'Confirmation is required for all destructive operations.'
      ]
    }
  ];
}
