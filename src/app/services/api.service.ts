import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Player, Team, AuctionRecord, Bid, Announcement, Settings, AuctionState, Stats, Season, GalleryItem, TournamentSettings } from '../types/models';

const API = 'https://tpl-2025.onrender.com/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('tpl_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  // Auth
  adminLogin(username: string, password: string) {
    return this.http.post<any>(`${API}/auth/admin/login`, { username, password });
  }
  teamLogin(teamId: string, password: string) {
    return this.http.post<any>(`${API}/auth/team/login`, { teamId, password });
  }

  // Players
  getPlayers(): Observable<Player[]> { return this.http.get<Player[]>(`${API}/players`); }
  getPlayer(id: string): Observable<Player> { return this.http.get<Player>(`${API}/players/${id}`); }
  registerPlayer(data: FormData): Observable<any> { return this.http.post(`${API}/players/register`, data); }
  updatePlayer(id: string, data: FormData): Observable<Player> { return this.http.put<Player>(`${API}/admin/players/${id}`, data, { headers: this.headers() }); }
  deletePlayer(id: string): Observable<any> { return this.http.delete(`${API}/admin/players/${id}`, { headers: this.headers() }); }

  // Teams
  getTeams(): Observable<Team[]> { return this.http.get<Team[]>(`${API}/teams`); }
  getTeam(id: string): Observable<Team> { return this.http.get<Team>(`${API}/teams/${id}`); }
  createTeam(data: FormData): Observable<Team> { return this.http.post<Team>(`${API}/admin/teams`, data, { headers: this.headers() }); }
  updateTeam(id: string, data: FormData): Observable<Team> { return this.http.put<Team>(`${API}/admin/teams/${id}`, data, { headers: this.headers() }); }

  // Auction
  getAuctionState(): Observable<AuctionState> { return this.http.get<AuctionState>(`${API}/auction/current`); }
  getAuctionHistory(): Observable<AuctionRecord[]> { return this.http.get<AuctionRecord[]>(`${API}/auction/history`); }
  getBids(auctionId: string): Observable<Bid[]> { return this.http.get<Bid[]>(`${API}/auction/bids/${auctionId}`); }
  placeBid(bidAmount: number): Observable<Bid> { return this.http.post<Bid>(`${API}/auction/bid`, { bidAmount }, { headers: this.headers() }); }
  selectPlayer(playerId: string): Observable<Player> { return this.http.post<Player>(`${API}/admin/auction/select-player/${playerId}`, {}, { headers: this.headers() }); }
  randomPlayer(): Observable<any> { return this.http.post<any>(`${API}/admin/auction/random-player`, {}, { headers: this.headers() }); }
  startAuction(): Observable<any> { return this.http.post(`${API}/admin/auction/start`, {}, { headers: this.headers() }); }
  pauseAuction(): Observable<any> { return this.http.post(`${API}/admin/auction/pause`, {}, { headers: this.headers() }); }
  resumeAuction(): Observable<any> { return this.http.post(`${API}/admin/auction/resume`, {}, { headers: this.headers() }); }
  markSold(): Observable<any> { return this.http.post(`${API}/admin/auction/sold`, {}, { headers: this.headers() }); }
  markUnsold(): Observable<any> { return this.http.post(`${API}/admin/auction/unsold`, {}, { headers: this.headers() }); }
  undoAuction(): Observable<any> { return this.http.post(`${API}/admin/auction/undo`, {}, { headers: this.headers() }); }
  resetAuction(): Observable<any> { return this.http.post(`${API}/admin/auction/reset`, {}, { headers: this.headers() }); }

  // Announcements
  getAnnouncements(): Observable<Announcement[]> { return this.http.get<Announcement[]>(`${API}/announcements`); }
  getAdminAnnouncements(): Observable<Announcement[]> { return this.http.get<Announcement[]>(`${API}/admin/announcements`, { headers: this.headers() }); }
  createAnnouncement(data: any): Observable<Announcement> { return this.http.post<Announcement>(`${API}/admin/announcements`, data, { headers: this.headers() }); }
  updateAnnouncement(id: string, data: any): Observable<Announcement> { return this.http.put<Announcement>(`${API}/admin/announcements/${id}`, data, { headers: this.headers() }); }
  deleteAnnouncement(id: string): Observable<any> { return this.http.delete(`${API}/admin/announcements/${id}`, { headers: this.headers() }); }

  // Settings
  getSettings(): Observable<Settings> { return this.http.get<Settings>(`${API}/settings`); }
  updateSettings(data: any): Observable<any> { return this.http.put(`${API}/admin/settings`, data, { headers: this.headers() }); }

  // Stats
  getStats(): Observable<Stats> { return this.http.get<Stats>(`${API}/stats`); }

  // Audit
  getAuditLogs(): Observable<any[]> { return this.http.get<any[]>(`${API}/admin/audit`, { headers: this.headers() }); }

  // Seasons
  getSeasons(): Observable<Season[]> { return this.http.get<Season[]>(`${API}/seasons`); }
  getAdminSeasons(): Observable<Season[]> { return this.http.get<Season[]>(`${API}/admin/seasons`, { headers: this.headers() }); }
  createSeason(data: FormData): Observable<Season> { return this.http.post<Season>(`${API}/admin/seasons`, data, { headers: this.headers() }); }
  updateSeason(id: string, data: FormData): Observable<Season> { return this.http.put<Season>(`${API}/admin/seasons/${id}`, data, { headers: this.headers() }); }
  deleteSeason(id: string): Observable<any> { return this.http.delete(`${API}/admin/seasons/${id}`, { headers: this.headers() }); }

  // Gallery
  getGallery(season?: string): Observable<GalleryItem[]> {
    const url = season ? `${API}/gallery?season=${season}` : `${API}/gallery`;
    return this.http.get<GalleryItem[]>(url);
  }
  getAdminGallery(season?: string): Observable<GalleryItem[]> {
    const url = season ? `${API}/admin/gallery?season=${season}` : `${API}/admin/gallery`;
    return this.http.get<GalleryItem[]>(url, { headers: this.headers() });
  }
  uploadGallery(data: FormData): Observable<GalleryItem[]> { return this.http.post<GalleryItem[]>(`${API}/admin/gallery`, data, { headers: this.headers() }); }
  updateGalleryItem(id: string, data: any): Observable<GalleryItem> { return this.http.put<GalleryItem>(`${API}/admin/gallery/${id}`, data, { headers: this.headers() }); }
  deleteGalleryItem(id: string): Observable<any> { return this.http.delete(`${API}/admin/gallery/${id}`, { headers: this.headers() }); }

  // Tournament Settings
  getTournamentSettings(): Observable<TournamentSettings> { return this.http.get<TournamentSettings>(`${API}/tournament-settings`); }
  updateTournamentSettings(data: any): Observable<any> { return this.http.put(`${API}/admin/tournament-settings`, data, { headers: this.headers() }); }

  // Sessions
  getSessions(): Observable<any[]> { return this.http.get<any[]>(`${API}/sessions`); }
  createSession(data: any): Observable<any> { return this.http.post(`${API}/admin/sessions`, data, { headers: this.headers() }); }
  updateSession(id: string, data: any): Observable<any> { return this.http.put(`${API}/admin/sessions/${id}`, data, { headers: this.headers() }); }
  deleteSession(id: string): Observable<any> { return this.http.delete(`${API}/admin/sessions/${id}`, { headers: this.headers() }); }

  // Backup
  getBackupImages(): Observable<any[]> { return this.http.get<any[]>(`${API}/admin/backup/images`, { headers: this.headers() }); }
  getDriveStatus(): Observable<any> { return this.http.get<any>(`${API}/admin/drive-status`, { headers: this.headers() }); }
  getExcelDownloadUrl(): string { return `${API}/admin/backup/excel`; }
  getBackupDownloadUrl(): string { return `${API}/admin/backup/download`; }
  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `https://tpl-2025.onrender.com${path}`;
  }
}
