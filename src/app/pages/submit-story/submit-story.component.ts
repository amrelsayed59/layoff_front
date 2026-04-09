import { Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';

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
 * Multi-step form for submitting a new layoff story.
 */
@Component({
  selector: 'app-submit-story',
  imports: [ReactiveFormsModule, TranslatePipe, MatStepperModule, ...MATERIAL_FORM],
  templateUrl: './submit-story.component.html',
  styleUrl: './submit-story.component.scss',
})
export class SubmitStoryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly storiesApi = inject(StoriesApiService);
  private readonly stepper = viewChild(MatStepper);

  /** When true, shows a simple confirmation state after a valid submit. */
  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly industries = STORY_INDUSTRY_OPTIONS;
  protected readonly reasons = STORY_REASON_OPTIONS;

  protected readonly workGroup = this.fb.group({
    company: [''],
    role: ['', Validators.required],
    industry: ['', Validators.required],
  });

  protected readonly layoffGroup = this.fb.group({
    layoffDate: [null as Date | null, Validators.required],
    reason: ['', Validators.required],
    location: [''],
    severance: [''],
  });

  protected readonly storyGroup = this.fb.group({
    story: ['', [Validators.required, Validators.minLength(20)]],
    anonymous: [false],
  });

  /**
   * Validates the form; on success submits to the backend.
   */
  protected onSubmit(): void {
    this.error.set(null);
    this.workGroup.markAllAsTouched();
    this.layoffGroup.markAllAsTouched();
    this.storyGroup.markAllAsTouched();

    if (this.workGroup.invalid || this.layoffGroup.invalid || this.storyGroup.invalid) {
      return;
    }

    const w = this.workGroup.getRawValue();
    const l = this.layoffGroup.getRawValue();
    const s = this.storyGroup.getRawValue();
    const layoffDate = l.layoffDate instanceof Date ? l.layoffDate : null;
    if (!layoffDate) {
      return;
    }

    this.loading.set(true);
    this.storiesApi
      .submitStory({
        company: w.company || undefined,
        role: w.role!,
        industry: w.industry!,
        location: l.location?.trim() || undefined,
        layoffDate: layoffDate.toISOString(),
        reason: l.reason!,
        severance: l.severance?.trim() || undefined,
        story: s.story!,
        isAnonymous: s.anonymous ?? false,
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
    this.workGroup.reset();
    this.layoffGroup.reset({ layoffDate: null, location: '', severance: '' });
    this.storyGroup.reset({ anonymous: false, story: '' });
    this.submitted.set(false);
    this.error.set(null);
    this.loading.set(false);
    this.stepper()?.reset();
  }
}
