import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

const STORAGE_KEY = 'layoff-egypt-lang';

/**
 * Persists UI language, syncs `document.documentElement` `lang` and `dir` for RTL,
 * and exposes the active language for the switcher.
 */
@Injectable({ providedIn: 'root' })
export class I18nLocaleService {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);

  /** Active UI language for templates (e.g. header switcher highlight). */
  readonly currentLang = signal<'en' | 'ar'>('en');

  /**
   * Runs once at startup: restores language from localStorage, applies DOM dir/lang,
   * and wires persistence on subsequent `TranslateService` changes.
   */
  initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    const lang = this.readStoredLang();
    this.currentLang.set(lang);
    this.syncDom(lang);

    this.translate.onLangChange.subscribe((e) => {
      const next: 'en' | 'ar' = e.lang === 'ar' ? 'ar' : 'en';
      localStorage.setItem(STORAGE_KEY, next);
      this.syncDom(next);
      this.currentLang.set(next);
    });

    return firstValueFrom(this.translate.use(lang)).then(() => undefined);
  }

  /**
   * Switches the app language (ngx-translate + localStorage + dir).
   */
  setLanguage(lang: 'en' | 'ar'): void {
    void firstValueFrom(this.translate.use(lang));
  }

  private readStoredLang(): 'en' | 'ar' {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  }

  private syncDom(lang: 'en' | 'ar'): void {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }
}
