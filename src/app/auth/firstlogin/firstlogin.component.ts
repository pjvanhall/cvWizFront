import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CvwizApiService } from '../../cvwiz-api.service';
import { CurriculumVitaeDto, ErvaringDto } from '../../cvwiz.models';

@Component({
  selector: 'app-firstlogin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  templateUrl: './firstlogin.component.html',
  styleUrl: './firstlogin.component.scss'
})
export class FirstloginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CvwizApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  isBusy = false;

  readonly basicForm = this.fb.group({
    bestandsNaam: ['', Validators.required],
    profiel: [''],
    opleiding: [''],
    competentiesText: ['']
  });

  readonly experienceForm = this.fb.group({
    ervaring: this.fb.array([])
  });

  get ervaringen(): FormArray {
    return this.experienceForm.get('ervaring') as FormArray;
  }

  addExperience(): void {
    this.ervaringen.push(this.fb.group({
      bedrijf: [''],
      periode: [''],
      functie: [''],
      sector: [''],
      kennis: [''],
      situatie: [''],
      taak: ['']
    }));
  }

  removeExperience(index: number): void {
    this.ervaringen.removeAt(index);
  }

  submitCv(): void {
    if (this.basicForm.invalid || this.experienceForm.invalid) {
      this.snackBar.open('Please complete all required fields.', 'Close', { duration: 3000 });
      return;
    }

    this.isBusy = true;
    
    const basicValues = this.basicForm.getRawValue();
    const ervaringen: ErvaringDto[] = this.ervaringen.controls.map(control => {
      const exp = control.getRawValue();
      return {
        id: null,
        bedrijf: exp.bedrijf?.trim() ?? '',
        periode: exp.periode?.trim() ?? '',
        functie: exp.functie?.trim() ?? '',
        sector: exp.sector?.trim() ?? '',
        kennis: exp.kennis?.trim() ?? '',
        situatie: exp.situatie?.trim() ?? '',
        taak: exp.taak?.trim() ?? ''
      };
    });

    const cvDto: CurriculumVitaeDto = {
      id: null,
      bestandsNaam: basicValues.bestandsNaam?.trim() ?? '',
      competenties: (basicValues.competentiesText ?? '').split(/\r?\n|,/).map(s => s.trim()).filter(Boolean),
      profiel: basicValues.profiel?.trim() ?? '',
      opleiding: basicValues.opleiding?.trim() ?? '',
      matrix: { id: null, matrix: {} },
      ervaring: ervaringen
    };

    // Assuming we have this method added to CvwizApiService for first login
    this.api.completeOneTimeCv(cvDto).subscribe({
      next: () => {
        this.isBusy = false;
        this.snackBar.open('CV Setup Complete! Welcome.', 'Close', { duration: 3000 });
        this.router.navigate(['/medewerkers']);
      },
      error: () => {
        this.isBusy = false;
        this.snackBar.open('Failed to save CV. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }
}
