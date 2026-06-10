import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { BeheerderDto, CurriculumVitaeDto, ErvaringDto, MedewerkerDto, SkillMatrix, TechniekMatrixDto } from './cvwiz.models';
import { CvwizApiService } from './cvwiz-api.service';

type Workspace = 'medewerker' | 'cv' | 'beheerder' | 'matrix';
type CvSelection = 'original' | 'draft' | number;

interface Notice {
  kind: 'idle' | 'success' | 'error';
  text: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly workspaces: Array<{ id: Workspace; label: string; badge: string }> = [
    { id: 'medewerker', label: 'Medewerkers', badge: 'MDW' },
    { id: 'cv', label: 'Curriculum vitae', badge: 'CV' },
    { id: 'beheerder', label: 'Beheerders', badge: 'BHR' },
    { id: 'matrix', label: 'Techniek matrix', badge: 'TM' }
  ];

  activeWorkspace: Workspace = 'medewerker';
  notice: Notice = { kind: 'idle', text: 'Ready' };
  busyLabel = '';

  medewerkerLookupId = '';
  beheerderLookupId = '';
  cvLookupId: number | null = null;
  matrixLookupId: number | null = null;
  matrixCategory = '';
  matrixTechnique = '';

  selectedMedewerker: MedewerkerDto | null = null;
  selectedBeheerder: BeheerderDto | null = null;
  loadedMatrix: TechniekMatrixDto | null = null;
  selectedCv: CvSelection = 'original';

  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CvwizApiService);

  readonly medewerkerForm = this.fb.nonNullable.group({
    id: [''],
    voornaam: ['', Validators.required],
    achternaam: ['', Validators.required],
    telefoon: [''],
    emailAdres: ['', [Validators.required, Validators.email]]
  });

  readonly beheerderForm = this.fb.nonNullable.group({
    id: [''],
    voornaam: ['', Validators.required],
    achternaam: ['', Validators.required],
    telefoon: [''],
    emailAdres: ['', [Validators.required, Validators.email]]
  });

  readonly cvForm = this.fb.group({
    id: this.fb.control<number | null>(null),
    bestandsNaam: ['', Validators.required],
    profiel: [''],
    opleiding: [''],
    competentiesText: [''],
    matrixId: this.fb.control<number | null>(null),
    matrixJson: ['{}', Validators.required],
    ervaring: this.fb.array([])
  });

  constructor() {
    this.patchCvForm(this.createEmptyCv());
  }

  get isBusy(): boolean {
    return this.busyLabel.length > 0;
  }

  get ervaringen(): FormArray {
    return this.cvForm.get('ervaring') as FormArray;
  }

  get hasMedewerker(): boolean {
    return this.selectedMedewerker !== null;
  }

  setWorkspace(workspace: Workspace): void {
    this.activeWorkspace = workspace;
  }

  loadMedewerker(): void {
    const id = this.medewerkerLookupId.trim();
    if (!id) {
      this.setNotice('error', 'Enter a medewerker id.');
      return;
    }

    this.execute(this.api.getMedewerker(id), 'Loading medewerker', (medewerker) => {
      this.applyMedewerker(medewerker);
      this.setNotice('success', `Loaded ${medewerker.voornaam} ${medewerker.achternaam}.`);
    });
  }

  createMedewerker(): void {
    if (this.medewerkerForm.invalid || this.cvForm.invalid) {
      this.markCurrentFormsTouched();
      this.setNotice('error', 'Complete the medewerker and CV fields first.');
      return;
    }

    this.execute(this.api.createMedewerker(this.buildMedewerkerDto(false)), 'Creating medewerker', (medewerker) => {
      this.applyMedewerker(medewerker);
      this.medewerkerLookupId = medewerker.id ?? '';
      this.setNotice('success', `Created medewerker ${medewerker.id}.`);
    });
  }

  updateMedewerker(): void {
    if (this.medewerkerForm.invalid || this.cvForm.invalid) {
      this.markCurrentFormsTouched();
      this.setNotice('error', 'Complete the medewerker and CV fields first.');
      return;
    }

    const dto = this.buildMedewerkerDto(true);
    if (!dto.id) {
      this.setNotice('error', 'Load or create a medewerker before updating.');
      return;
    }

    this.execute(this.api.updateMedewerker(dto), 'Updating medewerker', (medewerker) => {
      this.applyMedewerker(medewerker);
      this.setNotice('success', 'Medewerker updated.');
    });
  }

  deleteMedewerker(): void {
    const firstname = this.medewerkerForm.controls.voornaam.value.trim();
    const lastname = this.medewerkerForm.controls.achternaam.value.trim();

    if (!firstname || !lastname) {
      this.setNotice('error', 'Firstname and lastname are required for deletion.');
      return;
    }

    this.execute(this.api.deleteMedewerker(firstname, lastname), 'Deleting medewerker', () => {
      this.selectedMedewerker = null;
      this.medewerkerForm.reset();
      this.patchCvForm(this.createEmptyCv());
      this.setNotice('success', `Deleted ${firstname} ${lastname}.`);
    });
  }

  selectOriginalCv(): void {
    this.selectedCv = 'original';
    this.patchCvForm(this.selectedMedewerker?.orgineleCv ?? this.createEmptyCv());
  }

  selectUsedCv(index: number): void {
    const cv = this.selectedMedewerker?.cvLijst[index];
    if (!cv) {
      return;
    }
    this.selectedCv = index;
    this.patchCvForm(cv);
  }

  startDraftCv(): void {
    this.selectedCv = 'draft';
    this.patchCvForm(this.createEmptyCv());
    this.activeWorkspace = 'cv';
  }

  loadCvById(): void {
    if (this.cvLookupId === null) {
      this.setNotice('error', 'Enter a CV id.');
      return;
    }

    this.execute(this.api.getCurriculumVitae(this.cvLookupId), 'Loading CV', (cv) => {
      this.selectedCv = 'draft';
      this.patchCvForm(cv);
      this.activeWorkspace = 'cv';
      this.setNotice('success', `Loaded CV ${cv.id}.`);
    });
  }

  saveCurrentCv(): void {
    if (this.cvForm.invalid) {
      this.cvForm.markAllAsTouched();
      this.setNotice('error', 'Complete the CV fields first.');
      return;
    }

    let cv: CurriculumVitaeDto;
    try {
      cv = this.buildCvDto();
    } catch (error) {
      this.setNotice('error', error instanceof Error ? error.message : 'Invalid matrix JSON.');
      return;
    }

    if (this.selectedCv === 'draft' && this.selectedMedewerker?.id) {
      this.execute(
        this.api.addCurriculumVitaeToMedewerker(this.selectedMedewerker.id, cv),
        'Adding CV',
        (medewerker) => {
          this.applyMedewerker(medewerker);
          this.selectedCv = medewerker.cvLijst.length - 1;
          this.patchCvForm(medewerker.cvLijst[this.selectedCv]);
          this.setNotice('success', 'CV added to medewerker.');
        }
      );
      return;
    }

    if (this.selectedCv === 'original' && this.selectedMedewerker) {
      this.execute(
        this.api.updateOriginalCurriculumVitae(
          this.selectedMedewerker.voornaam,
          this.selectedMedewerker.achternaam,
          cv
        ),
        'Updating original CV',
        (updatedCv) => {
          this.mergeCurrentCv(updatedCv);
          this.setNotice('success', 'Original CV updated.');
        }
      );
      return;
    }

    if (cv.id === null) {
      this.setNotice('error', 'A standalone CV needs an id before update.');
      return;
    }

    this.execute(this.api.updateCurriculumVitae(cv), 'Updating CV', (updatedCv) => {
      this.mergeCurrentCv(updatedCv);
      this.setNotice('success', `CV ${updatedCv.id} updated.`);
    });
  }

  addExperience(): void {
    this.ervaringen.push(this.createExperienceGroup());
  }

  removeExperience(index: number): void {
    this.ervaringen.removeAt(index);
  }

  loadBeheerder(): void {
    const id = this.beheerderLookupId.trim();
    if (!id) {
      this.setNotice('error', 'Enter a beheerder id.');
      return;
    }

    this.execute(this.api.getBeheerder(id), 'Loading beheerder', (beheerder) => {
      this.applyBeheerder(beheerder);
      this.setNotice('success', `Loaded ${beheerder.voornaam} ${beheerder.achternaam}.`);
    });
  }

  createBeheerder(): void {
    if (this.beheerderForm.invalid) {
      this.beheerderForm.markAllAsTouched();
      this.setNotice('error', 'Complete the beheerder fields first.');
      return;
    }

    this.execute(this.api.createBeheerder(this.buildBeheerderDto(false)), 'Creating beheerder', (beheerder) => {
      this.applyBeheerder(beheerder);
      this.beheerderLookupId = beheerder.id ?? '';
      this.setNotice('success', `Created beheerder ${beheerder.id}.`);
    });
  }

  updateBeheerder(): void {
    if (this.beheerderForm.invalid) {
      this.beheerderForm.markAllAsTouched();
      this.setNotice('error', 'Complete the beheerder fields first.');
      return;
    }

    const dto = this.buildBeheerderDto(true);
    if (!dto.id) {
      this.setNotice('error', 'Load or create a beheerder before updating.');
      return;
    }

    this.execute(this.api.updateBeheerder(dto), 'Updating beheerder', (beheerder) => {
      this.applyBeheerder(beheerder);
      this.setNotice('success', 'Beheerder updated.');
    });
  }

  deleteBeheerder(): void {
    const id = this.beheerderForm.controls.id.value.trim();
    if (!id) {
      this.setNotice('error', 'Load a beheerder before deleting.');
      return;
    }

    this.execute(this.api.deleteBeheerder(id), 'Deleting beheerder', () => {
      this.selectedBeheerder = null;
      this.beheerderForm.reset();
      this.setNotice('success', `Deleted beheerder ${id}.`);
    });
  }

  loadMatrix(): void {
    if (this.matrixLookupId === null) {
      this.setNotice('error', 'Enter a matrix id.');
      return;
    }

    this.execute(this.api.getTechniekMatrix(this.matrixLookupId), 'Loading matrix', (matrix) => {
      this.loadedMatrix = matrix;
      this.setNotice('success', `Loaded matrix ${matrix.id}.`);
    });
  }

  addMatrixCategory(): void {
    this.mutateMatrix('category');
  }

  addMatrixTechnique(): void {
    this.mutateMatrix('technique');
  }

  matrixCategories(matrix: SkillMatrix | null | undefined): Array<{ name: string; tools: Array<{ name: string; level: number }> }> {
    return Object.entries(matrix ?? {}).map(([name, tools]) => ({
      name,
      tools: Object.entries(tools ?? {}).map(([toolName, level]) => ({ name: toolName, level }))
    }));
  }

  cvButtonLabel(selection: CvSelection): string {
    if (selection === 'original') {
      return 'Original';
    }
    if (selection === 'draft') {
      return 'Draft';
    }
    return `CV ${selection + 1}`;
  }

  private execute<T>(request: Observable<T>, label: string, next: (value: T) => void): void {
    this.busyLabel = label;
    request.subscribe({
      next: (value) => {
        this.busyLabel = '';
        next(value);
      },
      error: (error: unknown) => {
        this.busyLabel = '';
        this.setNotice('error', this.extractErrorMessage(error));
      }
    });
  }

  private buildMedewerkerDto(includeId: boolean): MedewerkerDto {
    const values = this.medewerkerForm.getRawValue();
    const currentCv = this.buildCvDto();
    const existing = this.selectedMedewerker;
    const cvLijst = [...(existing?.cvLijst ?? [])];
    let orgineleCv = existing?.orgineleCv ?? currentCv;

    if (this.selectedCv === 'original') {
      orgineleCv = currentCv;
    } else if (typeof this.selectedCv === 'number') {
      cvLijst[this.selectedCv] = currentCv;
    } else if (!cvLijst.length) {
      cvLijst.push(currentCv);
    }

    return {
      id: includeId ? values.id.trim() || null : null,
      voornaam: values.voornaam.trim(),
      achternaam: values.achternaam.trim(),
      telefoon: values.telefoon.trim(),
      emailAdres: values.emailAdres.trim(),
      orgineleCv,
      cvLijst
    };
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
      bestandsNaam: value.bestandsNaam?.trim() ?? '',
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

  private applyMedewerker(medewerker: MedewerkerDto): void {
    this.selectedMedewerker = medewerker;
    this.medewerkerForm.setValue({
      id: medewerker.id ?? '',
      voornaam: medewerker.voornaam ?? '',
      achternaam: medewerker.achternaam ?? '',
      telefoon: medewerker.telefoon ?? '',
      emailAdres: medewerker.emailAdres ?? ''
    });
    this.selectOriginalCv();
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
  }

  private mergeCurrentCv(cv: CurriculumVitaeDto): void {
    if (this.selectedMedewerker) {
      if (this.selectedCv === 'original') {
        this.selectedMedewerker = { ...this.selectedMedewerker, orgineleCv: cv };
      } else if (typeof this.selectedCv === 'number') {
        const cvLijst = [...this.selectedMedewerker.cvLijst];
        cvLijst[this.selectedCv] = cv;
        this.selectedMedewerker = { ...this.selectedMedewerker, cvLijst };
      }
    }
    this.patchCvForm(cv);
  }

  private mutateMatrix(kind: 'category' | 'technique'): void {
    const category = this.matrixCategory.trim();
    const technique = this.matrixTechnique.trim();

    if (!category || !technique) {
      this.setNotice('error', 'Category and technique are required.');
      return;
    }

    const request = kind === 'category'
      ? this.api.addCategory(category, technique)
      : this.api.addTechnique(category, technique);

    this.execute(request, 'Updating matrix', (message) => {
      this.setNotice('success', message || 'Matrix updated.');
      if (this.matrixLookupId !== null) {
        this.loadMatrix();
      }
    });
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

  private createEmptyCv(): CurriculumVitaeDto {
    return {
      id: null,
      bestandsNaam: '',
      competenties: [],
      profiel: '',
      opleiding: '',
      matrix: {
        id: null,
        matrix: {}
      },
      ervaring: []
    };
  }

  private parseMatrix(value: string): SkillMatrix {
    try {
      const parsed = JSON.parse(value || '{}') as unknown;
      if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('Matrix JSON must be an object.');
      }
      return parsed as SkillMatrix;
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

  private markCurrentFormsTouched(): void {
    this.medewerkerForm.markAllAsTouched();
    this.cvForm.markAllAsTouched();
  }

  private setNotice(kind: Notice['kind'], text: string): void {
    this.notice = { kind, text };
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
      if (error.error && typeof error.error === 'object' && 'message' in error.error) {
        return String(error.error.message);
      }
      return `${error.status || 'Request'} ${error.statusText || 'failed'}`;
    }
    return error instanceof Error ? error.message : 'Request failed.';
  }
}
