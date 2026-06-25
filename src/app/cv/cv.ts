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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
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
    MatProgressBarModule,
    MatExpansionModule,
    MatSelectModule
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
  baseMatrix: SkillMatrix = {};
  availableCategories: string[] = [];

  readonly cvForm = this.fb.group({
    id: this.fb.control<number | null>(null),
    bestandsNaam: [''],
    profiel: [''],
    opleiding: [''],
    competentiesText: [''],
    matrixId: this.fb.control<number | null>(null),
    matrixCategories: this.fb.array([]),
    ervaring: this.fb.array([])
  });

  get ervaringen(): FormArray {
    return this.cvForm.get('ervaring') as FormArray;
  }

  get matrixCategories(): FormArray {
    return this.cvForm.get('matrixCategories') as FormArray;
  }

  getMatrixSkills(categoryIndex: number): FormArray {
    return this.matrixCategories.at(categoryIndex).get('skills') as FormArray;
  }

  ngOnInit(): void {
    this.api.getBaseMatrix().subscribe({
      next: (dto) => {
        this.baseMatrix = dto.matrix || {};
        this.availableCategories = Object.keys(this.baseMatrix);
      },
      error: () => console.error('Could not load base matrix')
    });

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
                this.loadedCv = updated.orgineleCv ?? null;
                this.patchCvForm(this.loadedCv);
                this.showMessage(`Created new CV for consultant.`);
                this.router.navigate(['/cv'], { queryParams: { id: this.loadedCv?.id } });
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

  addMatrixCategory(): void {
    this.matrixCategories.push(this.fb.group({
      categoryName: ['', Validators.required],
      skills: this.fb.array([])
    }));
    this.cvForm.markAsDirty();
  }

  removeMatrixCategory(index: number): void {
    this.matrixCategories.removeAt(index);
    this.cvForm.markAsDirty();
  }

  getAvailableCategoriesForSelect(currentValue: string): string[] {
    const usedCategories = this.matrixCategories.controls
      .map(c => c.get('categoryName')?.value?.toLowerCase())
      .filter(val => val && val !== currentValue?.toLowerCase());
    return this.availableCategories.filter(cat => !usedCategories.includes(cat.toLowerCase()));
  }

  getAvailableTechnologiesForSelect(categoryIndex: number, currentTech: string): string[] {
    const catCtrl = this.matrixCategories.at(categoryIndex);
    const categoryName = catCtrl.get('categoryName')?.value;
    if (!categoryName) return [];
    
    const actualKey = Object.keys(this.baseMatrix).find(k => k.trim().toLowerCase() === categoryName.trim().toLowerCase());
    if (!actualKey) return [];
    
    const allTechs = Object.keys(this.baseMatrix[actualKey] || {});
    
    const skillsArray = catCtrl.get('skills') as FormArray;
    const usedTechs = skillsArray.controls
      .map(s => s.get('name')?.value?.toLowerCase())
      .filter(val => val && val !== currentTech?.toLowerCase());
      
    return allTechs.filter(tech => !usedTechs.includes(tech.toLowerCase()));
  }

  getBaseMatrixKeysForCat(categoryIndex: number): string {
    const catCtrl = this.matrixCategories.at(categoryIndex);
    const categoryName = catCtrl.get('categoryName')?.value;
    if (!categoryName) return 'No Category Name';
    const actualKey = Object.keys(this.baseMatrix).find(k => k.trim().toLowerCase() === categoryName.trim().toLowerCase());
    if (!actualKey) return 'Category Not Found In Base Matrix';
    const techs = Object.keys(this.baseMatrix[actualKey] || {});
    return techs.length > 0 ? techs.join(', ') : 'Empty Category';
  }

  getBaseMatrixAllKeys(): string {
    return Object.keys(this.baseMatrix).join(', ') || 'NONE';
  }

  canAddCategory(): boolean {
    return this.matrixCategories.length < this.availableCategories.length;
  }

  canAddTechnology(categoryIndex: number): boolean {
    const catCtrl = this.matrixCategories.at(categoryIndex);
    const categoryName = catCtrl.get('categoryName')?.value;
    if (!categoryName) return false;
    
    const actualKey = Object.keys(this.baseMatrix).find(k => k.trim().toLowerCase() === categoryName.trim().toLowerCase());
    if (!actualKey) return false;
    
    const allTechs = Object.keys(this.baseMatrix[actualKey] || {});
    const skillsArray = catCtrl.get('skills') as FormArray;
    
    return skillsArray.length < allTechs.length;
  }

  addMatrixSkill(categoryIndex: number): void {
    this.getMatrixSkills(categoryIndex).push(this.fb.group({
      name: ['', Validators.required],
      rating: [1, [Validators.required, Validators.min(1), Validators.max(5)]]
    }));
    this.cvForm.markAsDirty();
  }

  removeMatrixSkill(categoryIndex: number, skillIndex: number): void {
    this.getMatrixSkills(categoryIndex).removeAt(skillIndex);
    this.cvForm.markAsDirty();
  }

  private buildCvDto(): CurriculumVitaeDto {
    const value = this.cvForm.getRawValue();
    const matrix: SkillMatrix = {};
    for (const cat of (value.matrixCategories as any[]) || []) {
      const categoryName = cat.categoryName?.trim();
      if (!categoryName) continue;
      
      const skillsObj: Record<string, number> = {};
      for (const skill of cat.skills || []) {
        const skillName = skill.name?.trim();
        if (!skillName) continue;
        skillsObj[skillName] = Number(skill.rating) || 0;
      }
      matrix[categoryName] = skillsObj;
    }
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
      ervaring: ervaringen,
      languages: this.loadedCv?.languages ?? {}
    };
  }

  private patchCvForm(cv: CurriculumVitaeDto | null): void {
    if (!cv) {
      this.cvForm.reset();
      this.matrixCategories.clear();
      this.ervaringen.clear();
      return;
    }

    this.cvForm.patchValue({
      id: cv.id ?? null,
      bestandsNaam: cv.bestandsNaam ?? '',
      profiel: cv.profiel ?? '',
      opleiding: cv.opleiding ?? '',
      competentiesText: (cv.competenties ?? []).join('\n'),
      matrixId: cv.matrix?.id ?? null
    });

    this.matrixCategories.clear();
    const matrixObj = cv.matrix?.matrix || {};
    for (const categoryName of Object.keys(matrixObj)) {
      const skillsArray = new FormArray<any>([]);
      const skillsObj = matrixObj[categoryName] || {};
      let hasNonZero = false;
      for (const skillName of Object.keys(skillsObj)) {
        const ratingValue = skillsObj[skillName] || 0;
        if (ratingValue > 0) {
          skillsArray.push(this.fb.group({
            name: [skillName, Validators.required],
            rating: [ratingValue, [Validators.required, Validators.min(1), Validators.max(5)]]
          }));
          hasNonZero = true;
        }
      }
      if (hasNonZero) {
        this.matrixCategories.push(this.fb.group({
          categoryName: [categoryName, Validators.required],
          skills: skillsArray
        }));
      }
    }

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
