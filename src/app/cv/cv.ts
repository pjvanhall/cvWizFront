import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';

import { CvwizApiService } from '../cvwiz-api.service';
import { CurriculumVitaeDto, ErvaringDto, MedewerkerDto, SkillMatrix } from '../cvwiz.models';

@Component({
  selector: 'app-cv',
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
  templateUrl: './cv.html',
  styleUrl: './cv.scss',
})
export class Cv {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CvwizApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isBusy = false;
  cvLookupId: number | null = null;
  medewerkerId: string | null = null;
  consultantName: string | null = null;
  loadedCv: CurriculumVitaeDto | null = null;
  isOwnProfile = false;
  ownMedewerker: MedewerkerDto | null = null;

  readonly cvForm = this.fb.group({
    id: this.fb.control<number | null>(null),
    bestandsNaam: [''],
    profiel: [''],
    opleiding: [''],
    competentiesText: [''],
    matrixId: this.fb.control<number | null>(null),
    matrixJson: ['{}', Validators.required],
    ervaring: this.fb.array([])
  });

  get ervaringen(): FormArray {
    return this.cvForm.get('ervaring') as FormArray;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['isOwn']) {
        this.isOwnProfile = true;
        this.isBusy = true;
        this.api.getMijzelf().subscribe({
          next: (medewerker) => {
            this.ownMedewerker = medewerker;
            if (medewerker.orgineleCv) {
              this.loadedCv = medewerker.orgineleCv;
              this.patchCvForm(this.loadedCv);
              this.showMessage(`Loaded own CV.`);
              this.isBusy = false;
            } else {
              this.showMessage(`Creating a new CV for this account...`);
              this.loadedCv = this.createDefaultCv(medewerker);
              this.patchCvForm(this.loadedCv);
              this.saveCurrentCv();
            }
          },
          error: () => {
            this.showMessage('Failed to load your profile.');
            this.isBusy = false;
          }
        });
      } else {
        if (params['name']) {
          this.consultantName = params['name'];
        }
        if (params['medewerkerId']) {
          this.medewerkerId = params['medewerkerId'];
          this.isBusy = true;
          this.api.getMedewerker(this.medewerkerId!).subscribe({
            next: (medewerker) => {
              if (medewerker.orgineleCv) {
                 this.loadedCv = medewerker.orgineleCv;
                 this.patchCvForm(this.loadedCv);
                 this.showMessage(`Loaded CV for consultant.`);
                 this.isBusy = false;
              } else {
                 this.showMessage('Creating a new CV for consultant.');
                 this.loadedCv = this.createDefaultCv(medewerker);
                 this.patchCvForm(this.loadedCv);
                 this.saveCurrentCv();
              }
            },
            error: () => {
              this.showMessage('Failed to load consultant details.');
              this.isBusy = false;
            }
          });
        } else if (params['id']) {
          this.cvLookupId = Number(params['id']);
          this.loadCvById();
        }
      }
    });
  }

  loadCvById(): void {
    if (this.cvLookupId === null) {
      this.showMessage('Enter a CV id.');
      return;
    }

    this.isBusy = true;
    this.api.getCurriculumVitae(this.cvLookupId).subscribe({
      next: (cv) => {
        this.loadedCv = cv;
        this.patchCvForm(cv);
        this.showMessage(`Loaded CV ${cv.id}.`);
        this.isBusy = false;
      },
      error: () => {
        this.showMessage('Failed to load CV');
        this.isBusy = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/medewerkers']);
  }

  saveCurrentCv(): void {
    if (this.cvForm.invalid) {
      this.cvForm.markAllAsTouched();
      this.showMessage('Complete the CV fields first.');
      return;
    }

    let cv: CurriculumVitaeDto;
    try {
      cv = this.buildCvDto();
    } catch (error) {
      this.showMessage(error instanceof Error ? error.message : 'Invalid matrix JSON.');
      return;
    }

    if (this.isOwnProfile && this.ownMedewerker) {
      this.isBusy = true;
      this.ownMedewerker.orgineleCv = cv;
      this.api.updateMedewerker(this.ownMedewerker).subscribe({
        next: (updated) => {
          this.ownMedewerker = updated;
          this.loadedCv = updated.orgineleCv || null;
          if (this.loadedCv) {
            this.patchCvForm(this.loadedCv);
          }
          this.showMessage(`CV updated.`);
          this.isBusy = false;
        },
        error: () => {
          this.showMessage('Failed to update your CV.');
          this.isBusy = false;
        }
      });
      return;
    }

    if (cv.id === null) {
      if (this.medewerkerId) {
        this.isBusy = true;
        this.api.getMedewerker(this.medewerkerId).subscribe({
          next: (medewerker) => {
            medewerker.orgineleCv = cv;
            this.api.updateMedewerker(medewerker).subscribe({
              next: (updated) => {
                this.loadedCv = updated.orgineleCv;
                this.patchCvForm(this.loadedCv);
                this.showMessage(`Created new CV for consultant.`);
                this.router.navigate(['/cv'], { queryParams: { id: this.loadedCv.id } });
                this.isBusy = false;
              },
              error: () => {
                this.showMessage('Failed to save consultant CV.');
                this.isBusy = false;
              }
            });
          },
          error: () => {
            this.showMessage('Failed to load consultant details.');
            this.isBusy = false;
          }
        });
        return;
      }
      this.showMessage('A standalone CV needs an id before update in this view.');
      return;
    }

    this.isBusy = true;
    this.api.updateCurriculumVitae(cv).subscribe({
      next: (updatedCv) => {
        this.loadedCv = updatedCv;
        this.patchCvForm(updatedCv);
        this.showMessage(`CV ${updatedCv.id} updated.`);
        this.isBusy = false;
      },
      error: () => {
        this.showMessage('Failed to update CV');
        this.isBusy = false;
      }
    });
  }

  private createDefaultCv(medewerker: MedewerkerDto): CurriculumVitaeDto {
    return {
      id: null,
      bestandsNaam: `CV ${medewerker.voornaam} ${medewerker.achternaam}`.trim(),
      profiel: '',
      opleiding: '',
      competenties: [],
      languages: {},
      matrix: { id: null, matrix: {} },
      ervaring: []
    };
  }

  addExperience(): void {
    this.ervaringen.push(this.createExperienceGroup());
    this.cvForm.markAsDirty();
  }

  removeExperience(index: number): void {
    this.ervaringen.removeAt(index);
    this.cvForm.markAsDirty();
  }

  private buildCvDto(): CurriculumVitaeDto {
    const value = this.cvForm.getRawValue();
    const matrix = this.parseMatrix(value.matrixJson ?? '{}');
    const ervaringen: ErvaringDto[] = this.ervaringen.controls.map((control) => {
      const ervaring = control.getRawValue() as ErvaringDto;
      return {
        id: ervaring.id ?? null,
        bedrijf: ervaring.bedrijf?.trim() ?? '',
        periode: ervaring.periode?.trim() ?? '',
        functie: ervaring.functie?.trim() ?? '',
        sector: ervaring.sector?.trim() ?? '',
        kennis: ervaring.kennis?.trim() ?? '',
        situatie: ervaring.situatie?.trim() ?? '',
        taak: ervaring.taak?.trim() ?? ''
      };
    });

    return {
      id: value.id ?? null,
      bestandsNaam: value.bestandsNaam?.trim() || 'CV',
      competenties: this.toList(value.competentiesText ?? ''),
      profiel: value.profiel?.trim() ?? '',
      opleiding: value.opleiding?.trim() ?? '',
      matrix: {
        id: value.matrixId ?? null,
        matrix
      },
      ervaring: ervaringen
    };
  }

  private patchCvForm(cv: CurriculumVitaeDto): void {
    this.cvForm.patchValue({
      id: cv.id ?? null,
      bestandsNaam: cv.bestandsNaam ?? '',
      profiel: cv.profiel ?? '',
      opleiding: cv.opleiding ?? '',
      competentiesText: (cv.competenties ?? []).join('\n'),
      matrixId: cv.matrix?.id ?? null,
      matrixJson: JSON.stringify(cv.matrix?.matrix ?? {}, null, 2)
    });

    this.ervaringen.clear();
    for (const ervaring of cv.ervaring ?? []) {
      this.ervaringen.push(this.createExperienceGroup(ervaring));
    }
    this.cvForm.markAsPristine();
  }

  private createExperienceGroup(ervaring?: Partial<ErvaringDto>) {
    return this.fb.group({
      id: this.fb.control<number | null>(ervaring?.id ?? null),
      bedrijf: [ervaring?.bedrijf ?? ''],
      periode: [ervaring?.periode ?? ''],
      functie: [ervaring?.functie ?? ''],
      sector: [ervaring?.sector ?? ''],
      kennis: [ervaring?.kennis ?? ''],
      situatie: [ervaring?.situatie ?? ''],
      taak: [ervaring?.taak ?? '']
    });
  }

  private parseMatrix(value: string): SkillMatrix {
    try {
      const parsed = JSON.parse(value || '{}');
      if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('Matrix JSON must be an object.');
      }
      return parsed;
    } catch {
      throw new Error('Matrix JSON is invalid.');
    }
  }

  private toList(value: string): string[] {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private showMessage(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
