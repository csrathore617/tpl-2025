import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-brand">🏏 TPL2026</div>
            <div class="footer-tagline">T10 Cricket League</div>
            <p class="footer-desc">Where Every Ball Counts.</p>
          </div>
          <div>
            <div class="footer-heading">Quick Links</div>
            <a routerLink="/players">Players</a>
            <a routerLink="/teams">Teams</a>
            <a routerLink="/auction">Auction</a>
            <a routerLink="/rules">Rules</a>
            <a routerLink="/tournament">Tournament</a>
          </div>
          <div>
            <div class="footer-heading">More</div>
            <a routerLink="/sessions">Sessions</a>
            <a routerLink="/previous-seasons">Previous Seasons</a>
            <a routerLink="/gallery">Gallery</a>
            <a routerLink="/venue-contact">Venue &amp; Contact</a>
          </div>
          <div>
            <div class="footer-heading">Tournament</div>
            <p>📅 Tournament Date Will Be Announced Soon</p>
            <p>🗓️ Expected: 1st Week of November 2026</p>
            <p>🏟️ Venue: To Be Announced</p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 TPL2026 – T10 Cricket League. All rights reserved.</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer { background: var(--bg-card); border-top: 1px solid var(--border); padding: 3rem 0 1.5rem; margin-top: 4rem; }
    .footer-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 2rem; margin-bottom: 2rem; }
    .footer-brand { font-family: 'Rajdhani',sans-serif; font-size: 1.8rem; font-weight: 700; color: var(--primary); }
    .footer-tagline { color: var(--text-muted); font-size: 0.8rem; letter-spacing: 1px; text-transform: uppercase; }
    .footer-desc { color: var(--text-muted); margin-top: 8px; font-size: 0.9rem; }
    .footer-heading { font-weight: 700; margin-bottom: 12px; color: var(--text); }
    .footer a { display: block; color: var(--text-muted); font-size: 0.88rem; margin-bottom: 6px; transition: color 0.2s; }
    .footer a:hover { color: var(--primary); }
    .footer p { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 6px; }
    .footer-bottom { border-top: 1px solid var(--border); padding-top: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.82rem; }
    @media (max-width: 768px) { .footer-grid { grid-template-columns: repeat(2,1fr); } }
    @media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr; } }
  `]
})
export class FooterComponent {}
