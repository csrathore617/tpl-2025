import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast { id: string; type: 'success'|'error'|'info'|'warning'; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  toasts = this.toasts$.asObservable();

  show(message: string, type: Toast['type'] = 'info', duration = 3500) {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, type, message };
    this.toasts$.next([...this.toasts$.value, toast]);
    setTimeout(() => this.remove(id), duration);
  }

  remove(id: string) {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }

  success(msg: string) { this.show(msg, 'success'); }
  error(msg: string) { this.show(msg, 'error'); }
  info(msg: string) { this.show(msg, 'info'); }
  warning(msg: string) { this.show(msg, 'warning'); }
}
