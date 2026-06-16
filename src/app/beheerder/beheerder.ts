import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CvwizApiService } from '../cvwiz-api.service';
import { BeheerderDto } from '../cvwiz.models';

@Component({
  selector: 'app-beheerder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  templateUrl: './beheerder.html',
  styleUrl: './beheerder.scss',
})
export class Beheerder {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CvwizApiService);
  private readonly snackBar = inject(MatSnackBar);

  isBusy = false;
  beheerderLookupId = '';
  selectedBeheerder: BeheerderDto | null = null;

  readonly beheerderForm = this.fb.nonNullable.group({
    id: [''],
    voornaam: ['', Validators.required],
    achternaam: ['', Validators.required],
    telefoon: [''],
    emailAdres: ['', [Validators.required, Validators.email]]
  });

  loadBeheerder(): void {
    const id = this.beheerderLookupId.trim();
    if (!id) {
      this.showMessage('Enter a beheerder id.');
      return;
    }

    this.isBusy = true;
    this.api.getBeheerder(id).subscribe({
      next: (beheerder) => {
        this.applyBeheerder(beheerder);
        this.showMessage(`Loaded ${beheerder.voornaam} ${beheerder.achternaam}.`);
        this.isBusy = false;
      },
      error: () => {
        this.showMessage('Failed to load Beheerder');
        this.isBusy = false;
      }
    });
  }

  createBeheerder(): void {
    if (this.beheerderForm.invalid) {
      this.beheerderForm.markAllAsTouched();
      return;
    }

    this.isBusy = true;
    this.api.createBeheerder(this.buildBeheerderDto(false)).subscribe({
      next: (beheerder) => {
        this.applyBeheerder(beheerder);
        this.beheerderLookupId = beheerder.id ?? '';
        this.showMessage(`Created beheerder ${beheerder.id}.`);
        this.isBusy = false;
      },
      error: () => {
        this.showMessage('Failed to create Beheerder');
        this.isBusy = false;
      }
    });
  }

  updateBeheerder(): void {
    if (this.beheerderForm.invalid) {
      this.beheerderForm.markAllAsTouched();
      return;
    }

    const dto = this.buildBeheerderDto(true);
    if (!dto.id) {
      this.showMessage('Load or create a beheerder before updating.');
      return;
    }

    this.isBusy = true;
    this.api.updateBeheerder(dto).subscribe({
      next: (beheerder) => {
        this.applyBeheerder(beheerder);
        this.showMessage('Beheerder updated.');
        this.isBusy = false;
      },
      error: () => {
        this.showMessage('Failed to update Beheerder');
        this.isBusy = false;
      }
    });
  }

  deleteBeheerder(): void {
    const id = this.beheerderForm.controls.id.value.trim();
    if (!id) {
      this.showMessage('Load a beheerder before deleting.');
      return;
    }

    this.isBusy = true;
    this.api.deleteBeheerder(id).subscribe({
      next: () => {
        this.selectedBeheerder = null;
        this.beheerderForm.reset();
        this.showMessage(`Deleted beheerder ${id}.`);
        this.isBusy = false;
      },
      error: () => {
        this.showMessage('Failed to delete Beheerder');
        this.isBusy = false;
      }
    });
  }

  private applyBeheerder(beheerder: BeheerderDto): void {
    this.selectedBeheerder = beheerder;
    this.beheerderForm.setValue({
      id: beheerder.id ?? '',
      voornaam: beheerder.voornaam ?? '',
      achternaam: beheerder.achternaam ?? '',
      telefoon: beheerder.telefoon ?? '',
      emailAdres: beheerder.emailAdres ?? ''
    });
  }

  private buildBeheerderDto(includeId: boolean): BeheerderDto {
    const values = this.beheerderForm.getRawValue();
    return {
      id: includeId ? values.id.trim() || null : null,
      voornaam: values.voornaam.trim(),
      achternaam: values.achternaam.trim(),
      telefoon: values.telefoon.trim(),
      emailAdres: values.emailAdres.trim()
    };
  }

  private showMessage(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
