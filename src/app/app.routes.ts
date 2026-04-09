import { Routes } from '@angular/router';

import { adminAuthGuard } from './core/admin-auth.guard';
import { MainLayoutComponent } from './layout/main-layout.component';
import { AdminComponent } from './pages/admin/admin.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { SubmitStoryComponent } from './pages/submit-story/submit-story.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: HomeComponent },
      { path: 'submit', component: SubmitStoryComponent },
      { path: 'login', component: LoginComponent },
      // Backward-compatible alias for older links/bookmarks.
      { path: 'admin-access', pathMatch: 'full', redirectTo: 'login' },
      { path: 'admin', component: AdminComponent, canActivate: [adminAuthGuard] },
    ],
  },
];
