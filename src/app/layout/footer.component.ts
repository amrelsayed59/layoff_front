import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Minimal site footer with tagline.
 */
@Component({
  selector: 'app-footer',
  imports: [TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {}
