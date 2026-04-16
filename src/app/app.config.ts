import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { I18nLocaleService } from './core/i18n-locale.service';
import { authInterceptor } from './core/auth.interceptor';

/**
 * Default MatDialog configuration shared across the whole app.
 * Individual open() calls only override what differs (e.g. data, component).
 * panelClass: 'apple-dialog-panel' applies the product design system overrides
 * defined in apple-design.scss.
 */
const dialogDefaults: MatDialogConfig = {
  panelClass: 'apple-dialog-panel',
  width: 'min(440px, 92vw)',
  autoFocus: 'dialog',
  restoreFocus: true,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
    }),
    provideAppInitializer(() => {
      const i18n = inject(I18nLocaleService);
      return i18n.initialize();
    }),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideRouter(routes),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: dialogDefaults },
  ],
};
