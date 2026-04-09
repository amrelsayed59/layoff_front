import { Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService } from '../../core/auth.service';
import { StoriesApiService, type StoryStatusUpdate } from '../../core/stories-api.service';
import type { PendingStory } from '../../data/story.models';
import { ConfirmDialogComponent, type ConfirmDialogData } from '../../dialogs/confirm-dialog.component';
/**
 * Admin review queue with approve / reject actions.
 */
@Component({
  selector: 'app-admin',
  imports: [MatDialogModule, TranslatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly storiesApi = inject(StoriesApiService);

  protected readonly pending = signal<PendingStory[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  /**
   * Loads the pending queue from the API.
   */
  protected refresh(): void {
    this.error.set(null);
    this.loading.set(true);
    this.storiesApi.getPending().subscribe({
      next: (stories) => {
        this.pending.set(stories.map((s) => this.storiesApi.toPendingUi(s)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.translate.instant('ADMIN.ERR_LOAD'));
      },
    });
  }

  /**
   * Opens a confirmation dialog, then approves when confirmed.
   */
  protected approve(story: PendingStory): void {
    this.openConfirm(
      this.translate.instant('ADMIN.DIALOG.APPROVE_TITLE'),
      this.translate.instant('ADMIN.DIALOG.APPROVE_MESSAGE', { company: story.company }),
      this.translate.instant('ADMIN.DIALOG.APPROVE_CONFIRM'),
      'primary',
    ).subscribe((ok) => {
      if (ok) {
        this.updateStatus(story.id, 'approved');
      }
    });
  }

  /**
   * Opens a confirmation dialog, then rejects when confirmed.
   */
  protected reject(story: PendingStory): void {
    this.openConfirm(
      this.translate.instant('ADMIN.DIALOG.REJECT_TITLE'),
      this.translate.instant('ADMIN.DIALOG.REJECT_MESSAGE', { company: story.company }),
      this.translate.instant('ADMIN.DIALOG.REJECT_CONFIRM'),
      'warn',
    ).subscribe((ok) => {
      if (ok) {
        this.updateStatus(story.id, 'rejected');
      }
    });
  }

  /**
   * Clears the JWT session and returns to the login page.
   */
  protected signOut(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }

  /**
   * Shows the shared confirm dialog and emits whether the user confirmed.
   */
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

  /**
   * Updates status via API then refreshes the queue.
   */
  private updateStatus(id: string, status: StoryStatusUpdate): void {
    this.error.set(null);
    this.loading.set(true);
    this.storiesApi.updateStatus(id, status).subscribe({
      next: () => this.refresh(),
      error: () => {
        this.loading.set(false);
        this.error.set(this.translate.instant('ADMIN.ERR_UPDATE'));
      },
    });
  }
}
