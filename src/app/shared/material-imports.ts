import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * Angular Material modules used by the app header (toolbar + nav buttons).
 */
export const MATERIAL_HEADER = [
  MatToolbarModule,
  MatButtonModule,
] as const;

/**
 * Angular Material modules for story cards and simple lists.
 */
export const MATERIAL_CARD = [MatCardModule, MatButtonModule, MatIconModule] as const;

/**
 * Angular Material modules for reactive forms (inputs, selects, datepicker, checkbox).
 */
export const MATERIAL_FORM = [
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatDatepickerModule,
  MatCheckboxModule,
  MatButtonModule,
  MatIconModule,
  MatDividerModule,
] as const;

/** Dialog + actions for confirmation flows. */
export const MATERIAL_DIALOG = [MatDialogModule, MatButtonModule] as const;
