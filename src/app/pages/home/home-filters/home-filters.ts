import { Component, DestroyRef, OnInit, inject, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { STORY_INDUSTRY_OPTIONS, STORY_REASON_OPTIONS } from '../../submit-story/submit-story.component';
import type { StoryBrowseFilters } from '../story-browse-filters.model';

/**
 * Search + industry + reason controls for the public story grid.
 * Emits {@link StoryBrowseFilters} when any field changes (search is debounced).
 */
@Component({
  selector: 'app-home-filters',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './home-filters.html',
  styleUrl: './home-filters.scss',
})
export class HomeFiltersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Fired when the effective query changes; parent loads the API with this payload. */
  readonly filtersChange = output<StoryBrowseFilters>();

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly industry = new FormControl<string>('', { nonNullable: true });
  protected readonly reason = new FormControl<string>('', { nonNullable: true });

  protected readonly industries = STORY_INDUSTRY_OPTIONS;
  protected readonly reasons = STORY_REASON_OPTIONS;

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emitFilters());

    this.industry.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emitFilters());
    this.reason.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.emitFilters());

    this.emitFilters();
  }

  /**
   * Emits the current trimmed values for the parent browsing layer.
   */
  private emitFilters(): void {
    this.filtersChange.emit({
      search: this.search.value.trim(),
      industry: this.industry.value.trim(),
      reason: this.reason.value.trim(),
    });
  }

  /** Clears all filters and emits once (no duplicate events from child controls). */
  protected clearFilters(): void {
    this.search.setValue('', { emitEvent: false });
    this.industry.setValue('', { emitEvent: false });
    this.reason.setValue('', { emitEvent: false });
    this.emitFilters();
  }

  /** Clears search only; avoids debounced duplicate fetch from the search stream. */
  protected clearSearchFilter(): void {
    this.search.setValue('', { emitEvent: false });
    this.emitFilters();
  }

  /** Clears industry only. */
  protected clearIndustryFilter(): void {
    this.industry.setValue('', { emitEvent: false });
    this.emitFilters();
  }

  /** Clears reason only. */
  protected clearReasonFilter(): void {
    this.reason.setValue('', { emitEvent: false });
    this.emitFilters();
  }

  /** ngx-translate key for the selected industry option, or empty. */
  protected industryLabelKey(): string {
    const v = this.industry.value;
    return this.industries.find((r) => r.value === v)?.labelKey ?? '';
  }

  /** ngx-translate key for the selected reason option, or empty. */
  protected reasonLabelKey(): string {
    const v = this.reason.value;
    return this.reasons.find((r) => r.value === v)?.labelKey ?? '';
  }
}
