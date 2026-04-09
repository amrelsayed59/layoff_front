import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type { PublishedStory } from '../../data/story.models';
import { StoriesApiService } from '../../core/stories-api.service';
import { STORY_INDUSTRY_OPTIONS, STORY_REASON_OPTIONS } from '../submit-story/submit-story.component';

/**
 * Public home: Apple-style hero + story tile grid (DESIGN.md).
 */
@Component({
  selector: 'app-home',
  imports: [
    TranslatePipe,
    RouterLink,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly storiesApi = inject(StoriesApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stories = signal<PublishedStory[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly error = signal<string | null>(null);

  protected expandedStories = new Set<string>();

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly industry = new FormControl<string>('', { nonNullable: true });
  protected readonly reason = new FormControl<string>('', { nonNullable: true });

  protected readonly industries = STORY_INDUSTRY_OPTIONS;
  protected readonly reasons = STORY_REASON_OPTIONS;

  private page = 1;
  private readonly limit = 10;
  private inFlight = false;
  private readonly requestSeq = signal(0);

  @ViewChild('sentinel') private readonly sentinel?: ElementRef<HTMLElement>;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.search.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetAndLoad());

    this.industry.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resetAndLoad());
    this.reason.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resetAndLoad());

    this.resetAndLoad();
  }

  ngAfterViewInit(): void {
    // Observer wiring only (no state writes here) to avoid ExpressionChangedAfterItHasBeenCheckedError.
    this.setupInfiniteScroll();
  }

  /**
   * Clears filters/search and reloads the first page.
   */
  protected clearFilters(): void {
    this.search.setValue('');
    this.industry.setValue('');
    this.reason.setValue('');
    this.resetAndLoad();
  }

  /**
   * Loads the first page and resets list/pagination state.
   */
  private resetAndLoad(): void {
    this.page = 1;
    this.hasMore.set(true);
    this.stories.set([]);
    this.expandedStories.clear();
    this.loadPage({ append: false });
  }

  /**
   * Loads the next page and appends results.
   */
  private loadMore(): void {
    if (!this.hasMore() || this.inFlight || this.loading()) return;
    this.page += 1;
    this.loadPage({ append: true });
  }

  private loadPage(opts: { append: boolean }): void {
    if (this.inFlight) return;
    this.inFlight = true;
    this.error.set(null);

    const seq = this.requestSeq() + 1;
    this.requestSeq.set(seq);

    if (opts.append) this.loadingMore.set(true);
    else this.loading.set(true);

    const search = this.search.value.trim();
    const industry = this.industry.value.trim();
    const reason = this.reason.value.trim();

    this.storiesApi
      .getApproved({
        page: this.page,
        limit: this.limit,
        search: search || undefined,
        industry: industry || undefined,
        reason: reason || undefined,
      })
      .subscribe({
        next: (rows) => {
          // Ignore outdated responses (race-safe when quickly changing filters/search).
          if (this.requestSeq() !== seq) return;

          const nextList = opts.append ? [...this.stories(), ...rows] : rows;
          this.stories.set(nextList);
          this.hasMore.set(rows.length === this.limit);
          this.loading.set(false);
          this.loadingMore.set(false);
          this.inFlight = false;
        },
        error: () => {
          if (this.requestSeq() !== seq) return;
          this.loading.set(false);
          this.loadingMore.set(false);
          this.inFlight = false;
          this.error.set('HOME.ERR_LOAD');
        },
      });
  }

  private setupInfiniteScroll(): void {
    const el = this.sentinel?.nativeElement;
    if (!el) return;
    // Disconnect any previous observer (hot reload / re-init safety).
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          this.loadMore();
        }
      },
      { root: null, rootMargin: '600px 0px', threshold: 0.01 },
    );
    this.observer.observe(el);
  }

  /** Toggles expanded full text for a story card. */
  toggleStory(id: string): void {
    if (this.expandedStories.has(id)) {
      this.expandedStories.delete(id);
    } else {
      this.expandedStories.add(id);
    }
  }

  /** Whether the given story id is showing full text. */
  isExpanded(id: string): boolean {
    return this.expandedStories.has(id);
  }

  /** First character for the tile monogram (DESIGN.md product tile). */
  initial(companyLabel: string): string {
    const t = companyLabel?.trim();
    return (t?.charAt(0) || '·').toUpperCase();
  }
}
