/**
 * Published story shown on the public home page.
 */
export interface PublishedStory {
  id: string;
  /** Resolved display label for the company row. */
  companyLabel: string;
  /** Raw company name when not anonymous (admin / detail use). */
  company?: string | null;
  role: string;
  industry?: string;
  reason?: string;
  location?: string | null;
  severance?: string | null;
  /** Moderation status (included in admin API responses). */
  status?: 'pending' | 'approved' | 'rejected';
  /** Date of layoff or publication. */
  date?: string;
  /** Tags categorization (e.g. "Restructuring", "Technology"). */
  tags?: string[];
  /** Short excerpt shown on the card. */
  preview: string;
  /** The full text of the story. */
  fullText?: string;
}

/** GET `/stories` paginated body. */
export interface ApprovedStoriesPage {
  stories: PublishedStory[];
  totalCount: number;
}

/**
 * A user-submitted report (subset for list UI).
 */
export interface StoryReportDto {
  id: number;
  storyId: number;
  reason: string;
  message?: string | null;
  createdAt: string;
}

/**
 * Admin moderation row: story + optional recent reports.
 */
export interface AdminStoryRow extends PublishedStory {
  reports?: StoryReportDto[];
}

/**
 * Pending submission awaiting moderation in the admin view (legacy shape).
 */
export interface PendingStory {
  id: string;
  company: string;
  role: string;
  preview: string;
}
