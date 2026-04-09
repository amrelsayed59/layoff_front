import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { MATERIAL_FORM } from '../../shared/material-imports';
import { StoriesApiService } from '../../core/stories-api.service';

/** Industry select: stable form value + i18n label key. */
export const STORY_INDUSTRY_OPTIONS = [
  { value: 'Technology', labelKey: 'OPTIONS.INDUSTRY.TECHNOLOGY' },
  { value: 'Finance', labelKey: 'OPTIONS.INDUSTRY.FINANCE' },
  { value: 'Healthcare', labelKey: 'OPTIONS.INDUSTRY.HEALTHCARE' },
  { value: 'Retail', labelKey: 'OPTIONS.INDUSTRY.RETAIL' },
  { value: 'Manufacturing', labelKey: 'OPTIONS.INDUSTRY.MANUFACTURING' },
  { value: 'Education', labelKey: 'OPTIONS.INDUSTRY.EDUCATION' },
  { value: 'Other', labelKey: 'OPTIONS.INDUSTRY.OTHER' },
] as const;

/** Reason select: stable form value + i18n label key. */
export const STORY_REASON_OPTIONS = [
  { value: 'Restructuring', labelKey: 'OPTIONS.REASON.RESTRUCTURING' },
  { value: 'Performance', labelKey: 'OPTIONS.REASON.PERFORMANCE' },
  { value: 'Cost cutting', labelKey: 'OPTIONS.REASON.COST_CUTTING' },
  { value: 'Office closure', labelKey: 'OPTIONS.REASON.OFFICE_CLOSURE' },
  { value: 'Merger / acquisition', labelKey: 'OPTIONS.REASON.MERGER' },
  { value: 'Other', labelKey: 'OPTIONS.REASON.OTHER' },
] as const;

/**
 * Form for submitting a new layoff story (client-side only until an API exists).
 */
@Component({
  selector: 'app-submit-story',
  imports: [ReactiveFormsModule, TranslatePipe, ...MATERIAL_FORM],
  templateUrl: './submit-story.component.html',
  styleUrl: './submit-story.component.scss',
})
export class SubmitStoryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly storiesApi = inject(StoriesApiService);

  /** When true, shows a simple confirmation state after a valid submit. */
  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly industries = STORY_INDUSTRY_OPTIONS;
  protected readonly reasons = STORY_REASON_OPTIONS;

  protected readonly form = this.fb.group({
    company: [''],
    role: ['', Validators.required],
    industry: ['', Validators.required],
    layoffDate: [null as Date | null, Validators.required],
    reason: ['', Validators.required],
    story: ['', [Validators.required, Validators.minLength(20)]],
    anonymous: [false],
  });

  /**
   * Validates the form; on success submits to the backend.
   */
  protected onSubmit(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const layoffDate = v.layoffDate instanceof Date ? v.layoffDate : null;
    if (!layoffDate) {
      this.form.controls.layoffDate.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.storiesApi
      .submitStory({
        company: v.company || undefined,
        role: v.role!,
        industry: v.industry!,
        layoffDate: layoffDate.toISOString(),
        reason: v.reason!,
        story: v.story!,
        isAnonymous: v.anonymous ?? false,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.submitted.set(true);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('SUBMIT.ERR_SUBMIT_FAILED');
        },
      });
  }

  /**
   * Returns the user to the form to submit another entry.
   */
  protected resetForm(): void {
    this.form.reset({ anonymous: false, layoffDate: null });
    this.submitted.set(false);
    this.error.set(null);
    this.loading.set(false);
  }
}
