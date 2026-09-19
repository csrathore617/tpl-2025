import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PlayersComponent } from './pages/players/players.component';
import { PlayerDetailComponent } from './pages/player-detail/player-detail.component';
import { PlayerRegisterComponent } from './pages/player-register/player-register.component';
import { TeamsComponent } from './pages/teams/teams.component';
import { AuctionComponent } from './pages/auction/auction.component';
import { RulesComponent } from './pages/rules/rules.component';
import { TournamentComponent } from './pages/tournament/tournament.component';
import { LoginComponent } from './pages/login/login.component';
import { PreviousSeasonsComponent } from './pages/previous-seasons/previous-seasons.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { VenueContactComponent } from './pages/venue-contact/venue-contact.component';
import { SessionsComponent } from './pages/sessions/sessions.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { AdminPlayersComponent } from './pages/admin/players/admin-players.component';
import { AdminTeamsComponent } from './pages/admin/teams/admin-teams.component';
import { AdminAuctionComponent } from './pages/admin/auction-control/admin-auction.component';
import { AdminAnnouncementsComponent } from './pages/admin/announcements/admin-announcements.component';
import { AdminSettingsComponent } from './pages/admin/settings/admin-settings.component';
import { AdminAuditComponent } from './pages/admin/audit/admin-audit.component';
import { AdminSeasonsComponent } from './pages/admin/seasons/admin-seasons.component';
import { AdminGalleryComponent } from './pages/admin/gallery/admin-gallery.component';
import { AdminTournamentSettingsComponent } from './pages/admin/tournament-settings/admin-tournament-settings.component';
import { AdminSessionsComponent } from './pages/admin/sessions/admin-sessions.component';
import { AdminBackupComponent } from './pages/admin/backup/admin-backup.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'players', component: PlayersComponent },
  { path: 'players/register', component: PlayerRegisterComponent },
  { path: 'players/:id', component: PlayerDetailComponent },
  { path: 'teams', component: TeamsComponent },
  { path: 'auction', component: AuctionComponent },
  { path: 'rules', component: RulesComponent },
  { path: 'tournament', component: TournamentComponent },
  { path: 'previous-seasons', component: PreviousSeasonsComponent },
  { path: 'gallery', component: GalleryComponent },
  { path: 'venue-contact', component: VenueContactComponent },
  { path: 'sessions', component: SessionsComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin', component: AdminComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'players', component: AdminPlayersComponent },
      { path: 'teams', component: AdminTeamsComponent },
      { path: 'auction', component: AdminAuctionComponent },
      { path: 'announcements', component: AdminAnnouncementsComponent },
      { path: 'settings', component: AdminSettingsComponent },
      { path: 'audit', component: AdminAuditComponent },
      { path: 'seasons', component: AdminSeasonsComponent },
      { path: 'gallery', component: AdminGalleryComponent },
      { path: 'tournament-settings', component: AdminTournamentSettingsComponent },
      { path: 'sessions', component: AdminSessionsComponent },
      { path: 'backup', component: AdminBackupComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
