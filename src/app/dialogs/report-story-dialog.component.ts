import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '@ngx-translate/core';

import { StoriesApiService, type ReportStoryPayload } from '../core/stories-api.service';

/** Data passed into {@link ReportStoryDialogComponent}. */
export interface ReportStoryDialogData {
  storyId: string;
  /** Shown in dialog title (e.g. company label). */
  title: string;
}

/**
 * Dialog to report a public story for moderation.
 */
@Component({
  selector: 'app-report-story-dialog',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './report-story-dialog.component.html',
  styleUrl: './report-story-dialog.component.scss',
})
export class ReportStoryDialogComponent {
  readonly data = inject<ReportStoryDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ReportStoryDialogComponent, boolean>);
  private readonly fb = inject(FormBuilder);
  private readonly storiesApi = inject(StoriesApiService);

  protected readonly submitting = signal(false);
  protected readonly errorKey = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    reason: this.fb.nonNullable.control<ReportStoryPayload['reason']>('other', Validators.required),
    message: [''],
  });

  protected readonly reasonOptions: { value: ReportStoryPayload['reason']; labelKey: string }[] = [
    { value: 'spam', labelKey: 'REPORT.REASONS.SPAM' },
    { value: 'harassment', labelKey: 'REPORT.REASONS.HARASSMENT' },
    { value: 'doxxing', labelKey: 'REPORT.REASONS.DOXXING' },
    { value: 'fake', labelKey: 'REPORT.REASONS.FAKE' },
    { value: 'other', labelKey: 'REPORT.REASONS.OTHER' },
  ];

  /**
   * Submits the report to the API and closes the dialog on success.
   */
  protected submit(): void {
    this.errorKey.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.storiesApi
      .reportStory(this.data.storyId, {
        reason: v.reason,
        message: v.message?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.dialogRef.close(true);
        },
        error: () => {
          this.submitting.set(false);
          this.errorKey.set('REPORT.ERR_SUBMIT');
        },
      });
  }

  /** Closes without submitting. */
  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
