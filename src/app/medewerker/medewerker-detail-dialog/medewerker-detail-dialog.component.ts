import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CvwizApiService } from '../../cvwiz-api.service';
import { MedewerkerDto } from '../../cvwiz.models';

@Component({
  selector: 'app-medewerker-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Edit Consultant' : 'Add Consultant' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="medewerkerForm" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Voornaam</mat-label>
          <input matInput formControlName="voornaam">
          <mat-error *ngIf="medewerkerForm.controls.voornaam.hasError('required')">Voornaam is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Achternaam</mat-label>
          <input matInput formControlName="achternaam">
          <mat-error *ngIf="medewerkerForm.controls.achternaam.hasError('required')">Achternaam is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Telefoon</mat-label>
          <input matInput formControlName="telefoon">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="emailAdres" type="email">
          <mat-error *ngIf="medewerkerForm.controls.emailAdres.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="medewerkerForm.controls.emailAdres.hasError('email')">Must be a valid email</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="isBusy">Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()" [disabled]="isBusy">Save</button>
      <span class="spacer"></span>
      <button *ngIf="data?.id" mat-button color="warn" (click)="onDelete()" [disabled]="isBusy">Delete</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
      min-width: 300px;
    }
    .spacer {
      flex: 1 1 auto;
    }
  `]
})
export class MedewerkerDetailDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CvwizApiService);
  private readonly snackBar = inject(MatSnackBar);

  isBusy = false;

  readonly medewerkerForm = this.fb.nonNullable.group({
    id: [''],
    voornaam: ['', Validators.required],
    achternaam: ['', Validators.required],
    telefoon: [''],
    emailAdres: ['', [Validators.required, Validators.email]]
  });

  constructor(
    public dialogRef: MatDialogRef<MedewerkerDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MedewerkerDto | null
  ) {
    if (data) {
      this.medewerkerForm.patchValue({
        id: data.id ?? '',
        voornaam: data.voornaam ?? '',
        achternaam: data.achternaam ?? '',
        telefoon: data.telefoon ?? '',
        emailAdres: data.emailAdres ?? ''
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.medewerkerForm.invalid) {
      this.medewerkerForm.markAllAsTouched();
      return;
    }

    this.isBusy = true;
    const dto: MedewerkerDto = {
      id: this.medewerkerForm.controls.id.value || null,
      voornaam: this.medewerkerForm.controls.voornaam.value.trim(),
      achternaam: this.medewerkerForm.controls.achternaam.value.trim(),
      telefoon: this.medewerkerForm.controls.telefoon.value.trim(),
      emailAdres: this.medewerkerForm.controls.emailAdres.value.trim(),
      orgineleCv: this.data?.orgineleCv ?? (null as any),
      cvLijst: this.data?.cvLijst ?? []
    };

    const request$ = dto.id ? this.api.updateMedewerker(dto) : this.api.createMedewerker(dto);

    request$.subscribe({
      next: (result) => {
        this.snackBar.open(`Consultant ${dto.id ? 'updated' : 'created'} successfully`, 'Close', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: () => {
        this.snackBar.open(`Failed to ${dto.id ? 'update' : 'create'} Consultant`, 'Close', { duration: 3000 });
        this.isBusy = false;
      }
    });
  }

  onDelete(): void {
    if (!this.data) return;
    this.isBusy = true;
    this.api.deleteMedewerker(this.data.voornaam ?? '', this.data.achternaam ?? '').subscribe({
      next: () => {
        this.snackBar.open('Consultant deleted successfully', 'Close', { duration: 3000 });
        this.dialogRef.close('deleted');
      },
      error: () => {
        this.snackBar.open('Failed to delete Consultant', 'Close', { duration: 3000 });
        this.isBusy = false;
      }
    });
  }
}
