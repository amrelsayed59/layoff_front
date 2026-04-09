import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/auth.service';
import {
  StoriesApiService,
  type AdminInboxView,
  type BulkModerationAction,
} from '../../core/stories-api.service';
import type { AdminStoryRow } from '../../data/story.models';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../dialogs/confirm-dialog.component';

/** Tab config for the moderation inbox. */
interface InboxTab {
  view: AdminInboxView;
  labelKey: string;
}

/**
 * Admin moderation inbox: tabs, row selection, and bulk actions (with audit on the server).
 */
@Component({
  selector: 'app-admin',
  imports: [
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    MatCheckboxModule,
    TranslatePipe,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly storiesApi = inject(StoriesApiService);

  protected readonly inboxTabs: InboxTab[] = [
    { view: 'pending', labelKey: 'ADMIN.TAB_PENDING' },
    { view: 'approved', labelKey: 'ADMIN.TAB_APPROVED' },
    { view: 'rejected', labelKey: 'ADMIN.TAB_REJECTED' },
    { view: 'reported', labelKey: 'ADMIN.TAB_REPORTED' },
  ];

  protected readonly tabIndex = signal(0);
  protected readonly rows = signal<AdminStoryRow[]>([]);
  protected readonly selectedIds = signal<Set<string>>(new Set());
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Current inbox view derived from selected tab. */
  protected readonly currentView = computed(
    () => this.inboxTabs[this.tabIndex()]?.view ?? 'pending',
  );

  protected readonly allSelected = computed(() => {
    const list = this.rows();
    if (list.length === 0) return false;
    const sel = this.selectedIds();
    return list.every((r) => sel.has(r.id));
  });

  /** Number of rows currently selected for bulk actions. */
  protected readonly selectedCount = computed(() => this.selectedIds().size);

  /** Whether the bulk "approve" control applies to the active inbox tab. */
  protected readonly bulkApproveVisible = computed(() => {
    const v = this.currentView();
    return v === 'pending' || v === 'rejected' || v === 'reported';
  });

  /** Whether the bulk "reject" control applies to the active inbox tab. */
  protected readonly bulkRejectVisible = computed(() => {
    const v = this.currentView();
    return v === 'pending' || v === 'reported';
  });

  /** Whether the bulk "unapprove" control applies to the active inbox tab. */
  protected readonly bulkUnapproveVisible = computed(() => {
    const v = this.currentView();
    return v === 'approved' || v === 'reported';
  });

  ngOnInit(): void {
    this.refresh();
  }

  /**
   * Switches tab index and reloads rows.
   */
  protected onTabChange(index: number): void {
    this.tabIndex.set(index);
    this.selectedIds.set(new Set());
    this.refresh();
  }

  /**
   * Loads rows for the active tab from `GET /admin/stories`.
   */
  protected refresh(): void {
    this.error.set(null);
    this.loading.set(true);
    const view = this.currentView();
    this.storiesApi.getAdminStories(view).subscribe({
      next: (list) => {
        this.rows.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.translate.instant('ADMIN.ERR_LOAD'));
      },
    });
  }

  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  protected toggleRow(id: string, checked: boolean): void {
    const next = new Set(this.selectedIds());
    if (checked) next.add(id);
    else next.delete(id);
    this.selectedIds.set(next);
  }

  protected toggleSelectAll(checked: boolean): void {
    if (!checked) {
      this.selectedIds.set(new Set());
      return;
    }
    this.selectedIds.set(new Set(this.rows().map((r) => r.id)));
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  /**
   * Runs a bulk moderation action after confirmation.
   */
  protected bulk(action: BulkModerationAction): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;

    const { title, message, confirm } = this.bulkDialogCopy(action, ids.length);
    this.openConfirm(title, message, confirm, action === 'reject' ? 'warn' : 'primary').subscribe(
      (ok) => {
        if (!ok) return;
        this.runBulk(ids, action);
      },
    );
  }

  private bulkDialogCopy(
    action: BulkModerationAction,
    count: number,
  ): { title: string; message: string; confirm: string } {
    if (action === 'approve') {
      return {
        title: this.translate.instant('ADMIN.DIALOG.BULK_APPROVE_TITLE'),
        message: this.translate.instant('ADMIN.DIALOG.BULK_APPROVE_MESSAGE', { count }),
        confirm: this.translate.instant('ADMIN.DIALOG.BULK_CONFIRM'),
      };
    }
    if (action === 'reject') {
      return {
        title: this.translate.instant('ADMIN.DIALOG.BULK_REJECT_TITLE'),
        message: this.translate.instant('ADMIN.DIALOG.BULK_REJECT_MESSAGE', { count }),
        confirm: this.translate.instant('ADMIN.DIALOG.BULK_CONFIRM'),
      };
    }
    return {
      title: this.translate.instant('ADMIN.DIALOG.BULK_UNAPPROVE_TITLE'),
      message: this.translate.instant('ADMIN.DIALOG.BULK_UNAPPROVE_MESSAGE', { count }),
      confirm: this.translate.instant('ADMIN.DIALOG.BULK_CONFIRM'),
    };
  }

  private runBulk(ids: string[], action: BulkModerationAction): void {
    this.error.set(null);
    this.loading.set(true);
    this.storiesApi.bulkModeration(ids, action).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.clearSelection();
        this.snackBar.open(
          this.translate.instant('ADMIN.TOAST.BULK_OK', { count: res.updated }),
          undefined,
          { duration: 2500 },
        );
        this.refresh();
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.translate.instant('ADMIN.ERR_UPDATE'));
        this.snackBar.open(this.translate.instant('ADMIN.TOAST.UPDATE_ERR'), undefined, {
          duration: 3500,
        });
      },
    });
  }

  /**
   * Single-row approve (uses bulk endpoint for consistent audit log).
   */
  protected approveOne(row: AdminStoryRow): void {
    this.openConfirm(
      this.translate.instant('ADMIN.DIALOG.APPROVE_TITLE'),
      this.translate.instant('ADMIN.DIALOG.APPROVE_MESSAGE', { company: row.companyLabel }),
      this.translate.instant('ADMIN.DIALOG.APPROVE_CONFIRM'),
      'primary',
    ).subscribe((ok) => {
      if (ok) this.runBulk([row.id], 'approve');
    });
  }

  protected rejectOne(row: AdminStoryRow): void {
    this.openConfirm(
      this.translate.instant('ADMIN.DIALOG.REJECT_TITLE'),
      this.translate.instant('ADMIN.DIALOG.REJECT_MESSAGE', { company: row.companyLabel }),
      this.translate.instant('ADMIN.DIALOG.REJECT_CONFIRM'),
      'warn',
    ).subscribe((ok) => {
      if (ok) this.runBulk([row.id], 'reject');
    });
  }

  protected unapproveOne(row: AdminStoryRow): void {
    this.openConfirm(
      this.translate.instant('ADMIN.DIALOG.UNAPPROVE_TITLE'),
      this.translate.instant('ADMIN.DIALOG.UNAPPROVE_MESSAGE', { company: row.companyLabel }),
      this.translate.instant('ADMIN.DIALOG.UNAPPROVE_CONFIRM'),
      'warn',
    ).subscribe((ok) => {
      if (ok) this.runBulk([row.id], 'unapprove');
    });
  }

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  /**
   * Translation key for the moderation status pill on a row.
   */
  protected statusLabelKey(row: AdminStoryRow): string {
    switch (row.status) {
      case 'approved':
        return 'ADMIN.STATUS_APPROVED';
      case 'rejected':
        return 'ADMIN.STATUS_REJECTED';
      default:
        return 'ADMIN.STATUS_PENDING';
    }
  }

  /**
   * Aria label for the status pill (includes reported-queue context).
   */
  protected statusAriaKey(row: AdminStoryRow): string {
    if (this.currentView() === 'reported') {
      return 'ADMIN.STATUS_REPORTED_ARIA';
    }
    switch (row.status) {
      case 'approved':
        return 'ADMIN.STATUS_APPROVED_ARIA';
      case 'rejected':
        return 'ADMIN.STATUS_REJECTED_ARIA';
      default:
        return 'ADMIN.STATUS_PENDING_ARIA';
    }
  }

  protected reportCount(row: AdminStoryRow): number {
    return row.reports?.length ?? 0;
  }

  /** Per-row approve button for the active tab. */
  protected rowApproveVisible(): boolean {
    return this.bulkApproveVisible();
  }

  /** Per-row reject button for the active tab. */
  protected rowRejectVisible(): boolean {
    return this.bulkRejectVisible();
  }

  /** Per-row unapprove button for the active tab. */
  protected rowUnapproveVisible(): boolean {
    return this.bulkUnapproveVisible();
  }

  private openConfirm(
    title: string,
    message: string,
    confirmLabel: string,
    confirmColor: 'primary' | 'warn',
  ) {
    const data: ConfirmDialogData = {
      title,
      message,
      confirmLabel,
      confirmColor,
    };
    return this.dialog
      .open(ConfirmDialogComponent, {
        width: 'min(420px, 92vw)',
        autoFocus: 'dialog',
        panelClass: 'apple-dialog-panel',
        data,
      })
      .afterClosed();
  }
}
