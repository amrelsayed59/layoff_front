import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { API_BASE_URL } from './api.tokens';
import type { PublishedStory, PendingStory } from '../data/story.models';

export type StoryStatusUpdate = 'approved' | 'rejected';

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
  layoffDate: string;
  reason: string;
  story: string;
  isAnonymous?: boolean;
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

  /** GET `/stories/pending` (admin only). */
  getPending() {
    return this.http.get<PublishedStory[]>(`${this.apiBaseUrl}/stories/pending`);
  }

  /** PATCH `/stories/:id/status` (admin only). */
  updateStatus(id: string, status: StoryStatusUpdate) {
    return this.http.patch(`${this.apiBaseUrl}/stories/${id}/status`, { status });
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

