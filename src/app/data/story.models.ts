/**
 * Published story shown on the public home page.
 */
export interface PublishedStory {
  id: string;
  /** Resolved display label for the company row. */
  companyLabel: string;
  role: string;
  /** Date of layoff or publication. */
  date?: string;
  /** Tags categorization (e.g. "Restructuring", "Technology"). */
  tags?: string[];
  /** Short excerpt shown on the card. */
  preview: string;
  /** The full text of the story. */
  fullText?: string;
}

/**
 * Pending submission awaiting moderation in the admin view.
 */
export interface PendingStory {
  id: string;
  company: string;
  role: string;
  preview: string;
}
