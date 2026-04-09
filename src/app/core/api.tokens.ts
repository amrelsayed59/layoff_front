import { InjectionToken } from '@angular/core';

/**
 * Base URL for the NestJS API.
 *
 * Can be overridden at runtime by setting `globalThis.__LAYOFF_API_BASE_URL__`.
 * This keeps local dev simple while allowing flexible deployment without rebuilding.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const override = (globalThis as any)?.__LAYOFF_API_BASE_URL__;
    if (typeof override === 'string' && override.trim().length > 0) {
      return override.trim().replace(/\/+$/, '');
    }
    return 'http://localhost:3000';
  },
});

