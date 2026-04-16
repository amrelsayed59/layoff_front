import { DatePipe } from '@angular/common';
import { Component, Input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { PublishedStory } from '../../../data/story.models';

/**
 * Layoff story card for the public grid: documentary hierarchy (company → role → narrative → tags → actions).
 */
@Component({
  selector: 'app-story-card',
  imports: [TranslatePipe, DatePipe],
  templateUrl: './story-card.html',
  styleUrl: './story-card.scss',
})
export class StoryCardComponent {
  /** Published row from the API. */
  @Input({ required: true }) story!: PublishedStory;

  /** Whether full story text is shown (parent owns expanded state). */
  @Input() expanded = false;

  /** User toggled read more / show less. */
  readonly toggleExpand = output<void>();

  /** User chose to report this story. */
  readonly report = output<void>();

  /** Invoked from the template for read more / show less. */
  protected emitToggle(): void {
    this.toggleExpand.emit();
  }

  /** Invoked from the template to report this story. */
  protected emitReport(): void {
    this.report.emit();
  }
}
