import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { API_BASE_URL } from './api.tokens';
import type { AdminStoryRow, PendingStory, PublishedStory } from '../data/story.models';

export type StoryStatusUpdate = 'approved' | 'rejected';

export type AdminInboxView = 'pending' | 'approved' | 'rejected' | 'reported';

export type BulkModerationAction = 'approve' | 'reject' | 'unapprove';

export interface StoriesQuery {
  page: number;
  limit: number;
  search?: string;
  industry?: string;
  reason?: string;
}

export interface CreateStoryPayload {
  company?: string;
  role: string;
  industry: string;
  location?: string;
  layoffDate: string;
  reason: string;
  severance?: string;
  story: string;
  isAnonymous?: boolean;
}

export interface ReportStoryPayload {
  reason: 'spam' | 'harassment' | 'doxxing' | 'fake' | 'other';
  message?: string;
}

/**
 * Thin API client for stories endpoints.
 */
@Injectable({ providedIn: 'root' })
export class StoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  /** GET `/stories` (approved stories). */
  getApproved(query?: Partial<StoriesQuery>) {
    let params = new HttpParams();
    if (query?.page) params = params.set('page', String(query.page));
    if (query?.limit) params = params.set('limit', String(query.limit));
    if (query?.search) params = params.set('search', query.search);
    if (query?.industry) params = params.set('industry', query.industry);
    if (query?.reason) params = params.set('reason', query.reason);
    return this.http.get<PublishedStory[]>(`${this.apiBaseUrl}/stories`, { params });
  }

  /** POST `/stories` (submit story). */
  submitStory(payload: CreateStoryPayload) {
    return this.http.post(`${this.apiBaseUrl}/stories`, payload);
  }

  /** POST `/stories/:id/report` (public). */
  reportStory(id: string, payload: ReportStoryPayload) {
    return this.http.post(`${this.apiBaseUrl}/stories/${id}/report`, payload);
  }

  /** GET `/stories/pending` (admin only). */
  getPending() {
    return this.http.get<PublishedStory[]>(`${this.apiBaseUrl}/stories/pending`);
  }

  /** GET `/admin/stories?view=` (admin only). */
  getAdminStories(view: AdminInboxView) {
    const params = new HttpParams().set('view', view);
    return this.http.get<AdminStoryRow[]>(`${this.apiBaseUrl}/admin/stories`, { params });
  }

  /** PATCH `/admin/stories/bulk-update` (admin only). */
  bulkModeration(ids: string[], action: BulkModerationAction, note?: string) {
    return this.http.patch<{ updated: number }>(`${this.apiBaseUrl}/admin/stories/bulk-update`, {
      ids: ids.map((id) => Number(id)),
      action,
      note: note?.trim() || undefined,
    });
  }

  /** PATCH `/stories/:id/status` (admin only). */
  updateStatus(id: string, status: StoryStatusUpdate) {
    return this.http.patch(`${this.apiBaseUrl}/stories/${id}/status`, { status });
  }

  /** PATCH `/stories/:id/unapprove` (admin only). */
  unapprove(id: string) {
    return this.http.patch(`${this.apiBaseUrl}/stories/${id}/unapprove`, {});
  }

  /**
   * Maps the backend "transformed story" to the minimal admin list UI model.
   */
  toPendingUi(story: PublishedStory): PendingStory {
    return {
      id: story.id,
      company: story.companyLabel,
      role: story.role,
      preview: story.preview,
    };
  }
}
