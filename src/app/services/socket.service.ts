import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  events$ = new Subject<{ event: string; data: any }>();

  constructor() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = isLocal ? 'http://localhost:3000' : 'https://tpl-2025.onrender.com';
    this.socket = io(backendUrl, { autoConnect: true });
    const events = ['AUCTION_STATE','AUCTION_STARTED','PLAYER_SELECTED','RANDOM_PLAYER_SELECTED',
      'BID_PLACED','TIMER_UPDATED','PLAYER_SOLD','PLAYER_UNSOLD','AUCTION_PAUSED',
      'AUCTION_RESUMED','AUCTION_COMPLETED','TEAM_PURSE_UPDATED','ANNOUNCEMENT_UPDATED'];
    events.forEach(e => this.socket.on(e, (data: any) => this.events$.next({ event: e, data })));
    this.socket.on('disconnect', () => setTimeout(() => this.socket.connect(), 2000));
  }

  isConnected(): boolean { return this.socket.connected; }
}
