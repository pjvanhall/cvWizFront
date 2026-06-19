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
import { BeheerderDto } from '../../cvwiz.models';

@Component({
  selector: 'app-beheerder-detail-dialog',
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
    <h2 mat-dialog-title>{{ data?.id ? 'Edit Manager' : 'Add Manager' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="beheerderForm" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Voornaam</mat-label>
          <input matInput formControlName="voornaam">
          <mat-error *ngIf="beheerderForm.controls.voornaam.hasError('required')">Voornaam is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Achternaam</mat-label>
          <input matInput formControlName="achternaam">
          <mat-error *ngIf="beheerderForm.controls.achternaam.hasError('required')">Achternaam is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Telefoon</mat-label>
          <input matInput formControlName="telefoon">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="emailAdres" type="email">
          <mat-error *ngIf="beheerderForm.controls.emailAdres.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="beheerderForm.controls.emailAdres.hasError('email')">Must be a valid email</mat-error>
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
export class BeheerderDetailDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CvwizApiService);
  private readonly snackBar = inject(MatSnackBar);

  isBusy = false;

  readonly beheerderForm = this.fb.nonNullable.group({
    id: [''],
    voornaam: ['', Validators.required],
    achternaam: ['', Validators.required],
    telefoon: [''],
    emailAdres: ['', [Validators.required, Validators.email]]
  });

  constructor(
    public dialogRef: MatDialogRef<BeheerderDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BeheerderDto | null
  ) {
    if (data) {
      this.beheerderForm.patchValue({
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
    if (this.beheerderForm.invalid) {
      this.beheerderForm.markAllAsTouched();
      return;
    }

    this.isBusy = true;
    const dto: BeheerderDto = {
      id: this.beheerderForm.controls.id.value || null,
      voornaam: this.beheerderForm.controls.voornaam.value.trim(),
      achternaam: this.beheerderForm.controls.achternaam.value.trim(),
      telefoon: this.beheerderForm.controls.telefoon.value.trim(),
      emailAdres: this.beheerderForm.controls.emailAdres.value.trim()
    };

    const request$ = dto.id ? this.api.updateBeheerder(dto) : this.api.createBeheerder(dto);

    request$.subscribe({
      next: (result) => {
        this.snackBar.open(`Manager ${dto.id ? 'updated' : 'created'} successfully`, 'Close', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: () => {
        this.snackBar.open(`Failed to ${dto.id ? 'update' : 'create'} Manager`, 'Close', { duration: 3000 });
        this.isBusy = false;
      }
    });
  }

  onDelete(): void {
    if (!this.data?.id) return;
    
    const warning = this.data.hasCv 
      ? `\n\nWARNING: This manager is also a consultant with a coupled CV. Deleting this manager may affect their associated consultant login.`
      : '';
      
    if (!confirm(`Are you sure you want to delete manager ${this.data.voornaam} ${this.data.achternaam}?${warning}`)) {
      return;
    }
    
    this.isBusy = true;
    this.api.deleteBeheerder(this.data.id).subscribe({
      next: () => {
        this.snackBar.open('Manager deleted successfully', 'Close', { duration: 3000 });
        this.dialogRef.close('deleted');
      },
      error: () => {
        this.snackBar.open('Failed to delete Manager', 'Close', { duration: 3000 });
        this.isBusy = false;
      }
    });
  }
}
