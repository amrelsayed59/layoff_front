import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { take } from 'rxjs';
import type { PublishedStory } from '../../data/story.models';
import { StoriesApiService } from '../../core/stories-api.service';
import { HomeFiltersComponent } from './home-filters/home-filters';
import { StoryCardComponent } from './story-card/story-card';
import type { StoryBrowseFilters } from './story-browse-filters.model';
import { ReportStoryDialogComponent } from '../../dialogs/report-story-dialog.component';

/**
 * Public home: Apple-style hero + story tile grid (DESIGN.md).
 */
@Component({
  selector: 'app-home',
  imports: [
    TranslatePipe,
    RouterLink,
    MatDialogModule,
    MatSnackBarModule,
    HomeFiltersComponent,
    StoryCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements AfterViewInit {
  private readonly storiesApi = inject(StoriesApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly stories = signal<PublishedStory[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadingMore = signal(false);
  protected readonly hasMore = signal(true);
  protected readonly error = signal<string | null>(null);

  protected expandedStories = new Set<string>();

  /** Latest filter payload from {@link HomeFiltersComponent}; drives API queries. */
  private browseFilters: StoryBrowseFilters = { search: '', industry: '', reason: '' };

  private page = 1;
  private readonly limit = 10;
  private inFlight = false;
  private readonly requestSeq = signal(0);

  @ViewChild('storiesSection') private readonly storiesSection?: ElementRef<HTMLElement>;
  @ViewChild('sentinel') private readonly sentinel?: ElementRef<HTMLElement>;
  private observer?: IntersectionObserver;

  constructor() {
    this.applyLandingSeo();

    // Keep SEO in sync when user toggles language (EN/AR).
    this.translate.onLangChange.subscribe(() => {
      this.applyLandingSeo();
    });
  }

  /**
   * Handles filter updates from the home filters component (initial + every change).
   */
  protected onStoryFiltersChange(filters: StoryBrowseFilters): void {
    this.browseFilters = filters;
    this.resetAndLoad();
  }

  ngAfterViewInit(): void {
    // Observer wiring only (no state writes here) to avoid ExpressionChangedAfterItHasBeenCheckedError.
    this.setupInfiniteScroll();
  }

  /**
   * Sets static SEO meta tags for the landing page.
   *
   * This runs during prerender/SSR as well, ensuring the tags exist in the initial HTML source
   * (e.g. "View Source") for Googlebot and social preview scrapers.
   */
  private applyLandingSeo(): void {
    const keys: string[] = ['HOME.SEO.TITLE', 'HOME.SEO.DESCRIPTION', 'HOME.SEO.KEYWORDS'];

    this.translate
      .get(keys)
      .pipe(take(1))
      .subscribe((t) => {
        const title = t['HOME.SEO.TITLE'];
        const description = t['HOME.SEO.DESCRIPTION'];
        const keywords = t['HOME.SEO.KEYWORDS'];

        // Use the canonical production origin (safe for prerender/SSR where `window` is unavailable).
        const url = 'https://layoff-egypt.netlify.app/';
        const ogImage = `${url}og-image.svg`;

        this.title.setTitle(title);

        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ name: 'keywords', content: keywords });
        this.meta.updateTag({ name: 'robots', content: 'index,follow' });

        this.meta.updateTag({ property: 'og:type', content: 'website' });
        this.meta.updateTag({ property: 'og:site_name', content: 'Layoff Egypt' });
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'og:image', content: ogImage });

        this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.meta.updateTag({ name: 'twitter:title', content: title });
        this.meta.updateTag({ name: 'twitter:description', content: description });
        this.meta.updateTag({ name: 'twitter:image', content: ogImage });
      });
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

    const search = this.browseFilters.search;
    const industry = this.browseFilters.industry;
    const reason = this.browseFilters.reason;

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

  /**
   * Opens the report dialog for a public story card.
   */
  protected openReport(story: PublishedStory): void {
    this.dialog
      .open(ReportStoryDialogComponent, {
        // width / panelClass / autoFocus come from MAT_DIALOG_DEFAULT_OPTIONS
        data: { storyId: story.id, title: story.companyLabel },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.snackBar.open(this.translate.instant('REPORT.TOAST_OK'), undefined, { duration: 3000 });
        }
      });
  }

  protected scrollToAnchor(event: MouseEvent, anchorId: string): void {
    // Don't interfere with middle-click, right-click, or modifier-key navigation.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    const el = this.storiesSection?.nativeElement ?? document.getElementById(anchorId);
    if (!el) return;

    // Keep the URL hash in sync without triggering a hard navigation.
    history.replaceState(null, '', `${location.pathname}${location.search}#${anchorId}`);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
