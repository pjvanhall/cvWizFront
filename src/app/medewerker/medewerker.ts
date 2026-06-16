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
import { MedewerkerDto } from '../cvwiz.models';

@Component({
  selector: 'app-medewerker',
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
  templateUrl: './medewerker.html',
  styleUrl: './medewerker.scss',
})
export class Medewerker {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CvwizApiService);
  private readonly snackBar = inject(MatSnackBar);

  isBusy = false;
  medewerkerLookupId = '';
  selectedMedewerker: MedewerkerDto | null = null;

  readonly medewerkerForm = this.fb.nonNullable.group({
    id: [''],
    voornaam: ['', Validators.required],
    achternaam: ['', Validators.required],
    telefoon: [''],
    emailAdres: ['', [Validators.required, Validators.email]]
  });

  loadMedewerker(): void {
    const id = this.medewerkerLookupId.trim();
    if (!id) {
      this.showMessage('Enter a Medewerker ID');
      return;
    }

    this.isBusy = true;
    this.api.getMedewerker(id).subscribe({
      next: (medewerker) => {
        this.applyMedewerker(medewerker);
        this.showMessage(`Loaded ${medewerker.voornaam} ${medewerker.achternaam}`);
        this.isBusy = false;
      },
      error: (err) => {
        this.showMessage('Failed to load Medewerker');
        this.isBusy = false;
      }
    });
  }

  createMedewerker(): void {
    if (this.medewerkerForm.invalid) {
      this.medewerkerForm.markAllAsTouched();
      return;
    }

    this.isBusy = true;
    const dto = this.buildDto(false);
    
    this.api.createMedewerker(dto).subscribe({
      next: (medewerker) => {
        this.applyMedewerker(medewerker);
        this.medewerkerLookupId = medewerker.id ?? '';
        this.showMessage('Medewerker created successfully');
        this.isBusy = false;
      },
      error: (err) => {
        this.showMessage('Failed to create Medewerker');
        this.isBusy = false;
      }
    });
  }

  updateMedewerker(): void {
    if (this.medewerkerForm.invalid) {
      this.medewerkerForm.markAllAsTouched();
      return;
    }

    const dto = this.buildDto(true);
    if (!dto.id) {
      this.showMessage('Load or create a medewerker first');
      return;
    }

    this.isBusy = true;
    this.api.updateMedewerker(dto).subscribe({
      next: (medewerker) => {
        this.applyMedewerker(medewerker);
        this.showMessage('Medewerker updated successfully');
        this.isBusy = false;
      },
      error: (err) => {
        this.showMessage('Failed to update Medewerker');
        this.isBusy = false;
      }
    });
  }

  deleteMedewerker(): void {
    const voornaam = this.medewerkerForm.controls.voornaam.value.trim();
    const achternaam = this.medewerkerForm.controls.achternaam.value.trim();

    if (!voornaam || !achternaam) {
      this.showMessage('First name and last name required for deletion');
      return;
    }

    this.isBusy = true;
    this.api.deleteMedewerker(voornaam, achternaam).subscribe({
      next: () => {
        this.selectedMedewerker = null;
        this.medewerkerForm.reset();
        this.showMessage('Medewerker deleted successfully');
        this.isBusy = false;
      },
      error: (err) => {
        this.showMessage('Failed to delete Medewerker');
        this.isBusy = false;
      }
    });
  }

  private applyMedewerker(medewerker: MedewerkerDto): void {
    this.selectedMedewerker = medewerker;
    this.medewerkerForm.patchValue({
      id: medewerker.id ?? '',
      voornaam: medewerker.voornaam ?? '',
      achternaam: medewerker.achternaam ?? '',
      telefoon: medewerker.telefoon ?? '',
      emailAdres: medewerker.emailAdres ?? ''
    });
  }

  private buildDto(includeId: boolean): MedewerkerDto {
    const values = this.medewerkerForm.getRawValue();
    return {
      id: includeId ? values.id.trim() || null : null,
      voornaam: values.voornaam.trim(),
      achternaam: values.achternaam.trim(),
      telefoon: values.telefoon.trim(),
      emailAdres: values.emailAdres.trim(),
      orgineleCv: this.selectedMedewerker?.orgineleCv ?? this.createEmptyCv(),
      cvLijst: this.selectedMedewerker?.cvLijst ?? []
    };
  }

  private createEmptyCv() {
    return {
      id: null,
      bestandsNaam: '',
      competenties: [],
      profiel: '',
      opleiding: '',
      matrix: { id: null, matrix: {} },
      ervaring: []
    };
  }

  private showMessage(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
