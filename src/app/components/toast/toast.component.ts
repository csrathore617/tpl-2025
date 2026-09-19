import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toasts" class="toast toast-{{t.type}}" (click)="toast.remove(t.id)">
        <span>{{ icon(t.type) }}</span>
        <span>{{ t.message }}</span>
      </div>
    </div>
  `
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];
  constructor(public toast: ToastService) {}
  ngOnInit() { this.toast.toasts.subscribe(t => this.toasts = t); }
  icon(type: string) { return { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' }[type] || ''; }
}
