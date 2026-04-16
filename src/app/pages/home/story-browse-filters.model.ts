/**
 * Normalized filter state for browsing published layoff stories on the home page.
 * Values are trimmed; empty strings mean “no filter” for that field.
 */
export interface StoryBrowseFilters {
  search: string;
  industry: string;
  reason: string;
}
