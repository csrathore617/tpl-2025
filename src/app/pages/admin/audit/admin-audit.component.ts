import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding:2rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <div><h1>Audit Log</h1><p style="color:var(--text-muted)">{{ logs.length }} total entries</p></div>
        <input class="form-control" style="width:250px" placeholder="🔍 Search..." [(ngModel)]="search" (ngModelChange)="applyFilter()">
      </div>

      <div class="table-wrap card" style="padding:0">
        <table>
          <thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Details</th><th>By</th></tr></thead>
          <tbody>
            <tr *ngFor="let l of filtered">
              <td style="color:var(--text-muted);font-size:0.78rem;white-space:nowrap">{{ l.created_at | date:'short' }}</td>
              <td><span class="badge" [class]="getActionClass(l.action)">{{ l.action }}</span></td>
              <td>{{ l.entity }}</td>
              <td style="font-size:0.8rem;color:var(--text-muted)">{{ l.entity_id }}</td>
              <td style="font-size:0.8rem;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                {{ l.new_value }}
              </td>
              <td style="font-size:0.82rem">{{ l.admin }}</td>
            </tr>
            <tr *ngIf="filtered.length === 0">
              <td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No audit logs</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminAuditComponent implements OnInit {
  logs: any[] = [];
  filtered: any[] = [];
  search = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getAuditLogs().subscribe(l => { this.logs = l; this.applyFilter(); });
  }

  applyFilter() {
    if (!this.search) { this.filtered = this.logs; return; }
    const s = this.search.toLowerCase();
    this.filtered = this.logs.filter(l => l.action?.toLowerCase().includes(s) || l.entity?.toLowerCase().includes(s) || l.admin?.toLowerCase().includes(s));
  }

  getActionClass(action: string): string {
    if (action?.includes('SOLD')) return 'badge-sold';
    if (action?.includes('DELETED')) return 'badge-withdrawn';
    if (action?.includes('STARTED') || action?.includes('ADDED')) return 'badge-verified';
    if (action?.includes('UPDATED')) return 'badge-available';
    if (action?.includes('RESET') || action?.includes('UNDO')) return 'badge-unsold';
    return 'badge-registered';
  }
}
