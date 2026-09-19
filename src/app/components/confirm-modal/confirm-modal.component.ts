import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="visible" (click)="onCancel()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-title">{{ title }}</div>
        <p style="color:var(--text-muted);font-size:0.9rem">{{ message }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" (click)="onCancel()">Cancel</button>
          <button class="btn" [class]="'btn-' + confirmClass" (click)="onConfirm()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() confirmClass = 'danger';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  onConfirm() { this.confirmed.emit(); }
  onCancel() { this.cancelled.emit(); }
}
