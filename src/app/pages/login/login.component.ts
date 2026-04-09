import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AuthService } from '../../core/auth.service';

/**
 * Admin login page (JWT) for the single seeded admin user.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, TranslatePipe, MatFormFieldModule, MatInputModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  protected readonly password = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(6)],
  });

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      void this.router.navigate(['/admin']);
    }
  }

  /**
   * Calls the backend login endpoint and navigates to `/admin` on success.
   */
  protected submit(): void {
    this.error.set(null);

    if (this.email.invalid || this.password.invalid) {
      this.email.markAsTouched();
      this.password.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.login(this.email.value.trim(), this.password.value).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/admin']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.translate.instant('ADMIN_ACCESS.ERR_LOGIN_FAILED'));
      },
    });
  }
}

