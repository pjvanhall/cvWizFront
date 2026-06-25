import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cv } from './cv';
import { CvwizApiService } from '../cvwiz-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CurriculumVitaeDto, MedewerkerDto } from '../cvwiz.models';
import { FormArray } from '@angular/forms';

describe('Cv Component', () => {
  let component: Cv;
  let fixture: ComponentFixture<Cv>;
  let mockApiService: any;
  let mockSnackBar: any;
  let mockRouter: any;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockBaseMatrix = {
    matrix: {
      'Languages': { 'Java': 1, 'TypeScript': 2 },
      'Databases': { 'MySQL': 1, 'PostgreSQL': 2 }
    }
  };

  const mockCv: CurriculumVitaeDto = {
    id: 1,
    bestandsNaam: 'CV',
    profiel: 'Test profiel',
    opleiding: 'Test opleiding',
    competenties: ['Comp 1'],
    matrix: {
      id: 1,
      matrix: {
        'Languages': { 'Java': 3 }
      }
    },
    ervaring: [{ id: 1, bedrijf: 'Company', periode: '2020-2021', functie: 'Dev', sector: '', kennis: '', situatie: '', taak: '' }],
    languages: {}
  };

  const mockMedewerker: MedewerkerDto = {
    id: '123',
    voornaam: 'John',
    achternaam: 'Doe',
    telefoon: '0612345678',
    emailAdres: 'john.doe@example.com',
    cvLijst: [],
    orgineleCv: mockCv
  };

  const mockMedewerkerWithoutCv: MedewerkerDto = {
    id: '123',
    voornaam: 'Jane',
    achternaam: 'Doe',
    telefoon: '0687654321',
    emailAdres: 'jane.doe@example.com',
    cvLijst: []
  };

  beforeEach(async () => {
    mockApiService = {
      getBaseMatrix: jest.fn().mockReturnValue(of(mockBaseMatrix)),
      getMijzelf: jest.fn().mockReturnValue(of(mockMedewerker)),
      getMedewerker: jest.fn().mockReturnValue(of(mockMedewerker)),
      getCurriculumVitae: jest.fn().mockReturnValue(of(mockCv)),
      updateMedewerker: jest.fn().mockReturnValue(of(mockMedewerker)),
      updateCurriculumVitae: jest.fn().mockReturnValue(of(mockCv))
    };

    mockSnackBar = {
      open: jest.fn()
    };

    mockRouter = {
      navigate: jest.fn()
    };

    queryParamsSubject = new BehaviorSubject<any>({});

    await TestBed.configureTestingModule({
      imports: [Cv, NoopAnimationsModule],
      providers: [
        { provide: CvwizApiService, useValue: mockApiService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } }
      ]
    })
    .overrideComponent(Cv, {
      remove: { imports: [] }
    })
    .compileComponents();
  });

  function createComponent() {
    fixture = TestBed.createComponent(Cv);
    component = fixture.componentInstance;
    
    mockSnackBar = fixture.debugElement.injector.get(MatSnackBar);
    jest.spyOn(mockSnackBar, 'open').mockImplementation();
    mockRouter = fixture.debugElement.injector.get(Router);
    jest.spyOn(mockRouter, 'navigate').mockResolvedValue(true);
  }

  describe('Initialization (isOwn)', () => {
    it('should load base matrix and own CV if isOwn is true', () => {
      createComponent();
      queryParamsSubject.next({ isOwn: 'true' });
      fixture.detectChanges();


      expect(mockApiService.getBaseMatrix).toHaveBeenCalled();
      expect(component.baseMatrix).toEqual(mockBaseMatrix.matrix);
      expect(component.availableCategories).toEqual(['Languages', 'Databases']);

      expect(mockApiService.getMijzelf).toHaveBeenCalled();
      expect(component.isOwnProfile).toBe(true);
      expect(component.loadedCv).toEqual(mockCv);
      expect(component.cvForm.value.profiel).toBe('Test profiel');
      expect(mockSnackBar.open).toHaveBeenCalledWith('Loaded own CV.', 'Close', expect.any(Object));
    });

    it('should create new CV if isOwn is true but no orgineleCv', () => {
      mockApiService.getMijzelf.mockReturnValue(of({ ...mockMedewerkerWithoutCv }));
      mockApiService.updateMedewerker.mockReturnValue(of({ ...mockMedewerkerWithoutCv, orgineleCv: { id: 2, bestandsNaam: 'CV Jane Doe' } }));
      
      createComponent();
      queryParamsSubject.next({ isOwn: 'true' });
      fixture.detectChanges();

      expect(component.loadedCv?.bestandsNaam).toBe('CV Jane Doe');
      expect(mockApiService.updateMedewerker).toHaveBeenCalled(); // Should save current cv automatically
      expect(mockSnackBar.open).toHaveBeenCalledWith('Creating a new CV for this account...', 'Close', expect.any(Object));
    });
  });

  describe('Initialization (medewerkerId)', () => {
    it('should load medewerker CV if medewerkerId is provided', () => {
      createComponent();
      queryParamsSubject.next({ medewerkerId: '123' });
      fixture.detectChanges();

      expect(mockApiService.getMedewerker).toHaveBeenCalledWith('123');
      expect(component.loadedCv).toEqual(mockCv);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Loaded CV for consultant.', 'Close', expect.any(Object));
    });

    it('should create new CV if medewerkerId provided but no orgineleCv', () => {
      mockApiService.getMedewerker.mockReturnValue(of({ ...mockMedewerkerWithoutCv }));
      mockApiService.updateMedewerker.mockReturnValue(of({ ...mockMedewerkerWithoutCv, orgineleCv: { id: 3, bestandsNaam: 'CV Jane Doe' } }));
      
      createComponent();
      queryParamsSubject.next({ medewerkerId: '123' });
      fixture.detectChanges();

      expect(mockApiService.updateMedewerker).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Created new CV for consultant.', 'Close', expect.any(Object));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cv'], { queryParams: { id: 3 } });
    });
  });

  describe('Initialization (id)', () => {
    it('should load CV directly if id is provided', () => {
      createComponent();
      queryParamsSubject.next({ id: '1' });
      fixture.detectChanges();


      expect(component.cvLookupId).toBe(1);
      expect(mockApiService.getCurriculumVitae).toHaveBeenCalledWith(1);
      expect(component.loadedCv).toEqual(mockCv);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Loaded CV 1.', 'Close', expect.any(Object));
    });

    it('should show error if id is not provided in loadCvById', () => {
      createComponent();
      component.cvLookupId = null;
      component.loadCvById();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Enter a CV id.', 'Close', expect.any(Object));
    });

    it('should handle getCurriculumVitae error', () => {
      mockApiService.getCurriculumVitae.mockReturnValue(throwError(() => new Error('Err')));
      createComponent();
      queryParamsSubject.next({ id: '1' });
      fixture.detectChanges();


      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load CV', 'Close', expect.any(Object));
    });
  });

  describe('Form Actions & Methods', () => {
    beforeEach(() => {
      createComponent();
      queryParamsSubject.next({ id: '1' });
      fixture.detectChanges();
    });

    it('should navigate back to /medewerkers', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/medewerkers']);
    });

    it('should add and remove experience', () => {
      const initialLength = component.ervaringen.length;
      component.addExperience();
      expect(component.ervaringen.length).toBe(initialLength + 1);

      component.removeExperience(initialLength);
      expect(component.ervaringen.length).toBe(initialLength);
    });

    it('should add and remove matrix category', () => {
      const initialLength = component.matrixCategories.length;
      component.addMatrixCategory();
      expect(component.matrixCategories.length).toBe(initialLength + 1);

      component.removeMatrixCategory(initialLength);
      expect(component.matrixCategories.length).toBe(initialLength);
    });

    it('should add and remove matrix skill', () => {
      component.addMatrixSkill(0); // We have 'Languages' category from mockCv at index 0
      const skillsArray = component.getMatrixSkills(0);
      const initialLength = skillsArray.length;
      
      component.addMatrixSkill(0);
      expect(skillsArray.length).toBe(initialLength + 1);

      component.removeMatrixSkill(0, initialLength);
      expect(skillsArray.length).toBe(initialLength);
    });

    it('should validate form before saving', () => {
      component.cvForm.setErrors({ invalid: true });
      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Complete the CV fields first.', 'Close', expect.any(Object));
    });
  });

  describe('Select Dropdowns filtering', () => {
    beforeEach(() => {
      createComponent();
      queryParamsSubject.next({ id: '1' });
      fixture.detectChanges();
    });

    it('getAvailableCategoriesForSelect should filter out used categories', () => {
      // Mock CV has 'Languages' category
      const available = component.getAvailableCategoriesForSelect('');
      expect(available).toEqual(['Databases']); // Languages is used
    });

    it('getAvailableTechnologiesForSelect should filter out used technologies', () => {
      // Mock CV has 'Java' in 'Languages'
      const available = component.getAvailableTechnologiesForSelect(0, '');
      expect(available).toEqual(['TypeScript']); // Java is used
    });
    
    it('getBaseMatrixAllKeys should return all keys joined', () => {
      expect(component.getBaseMatrixAllKeys()).toBe('Languages, Databases');
    });

    it('canAddCategory should return true if we can add more', () => {
      expect(component.canAddCategory()).toBe(true); // 1 used, 2 total
    });

    it('canAddTechnology should return true if we can add more', () => {
      expect(component.canAddTechnology(0)).toBe(true); // 1 used, 2 total
    });
  });

  describe('Saving logic', () => {
    it('should update curriculum vitae directly if standalone (has id)', () => {
      createComponent();
      queryParamsSubject.next({ id: '1' });
      fixture.detectChanges();

      component.saveCurrentCv();
      expect(mockApiService.updateCurriculumVitae).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('CV 1 updated.', 'Close', expect.any(Object));
    });

    it('should handle error when updating curriculum vitae directly', () => {
      mockApiService.updateCurriculumVitae.mockReturnValue(throwError(() => new Error('Err')));
      createComponent();
      queryParamsSubject.next({ id: '1' });
      fixture.detectChanges();

      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to update CV', 'Close', expect.any(Object));
    });

    it('should update medewerker orgineleCv if isOwn', () => {
      createComponent();
      queryParamsSubject.next({ isOwn: 'true' });
      fixture.detectChanges();

      component.saveCurrentCv();
      expect(mockApiService.updateMedewerker).toHaveBeenCalledTimes(1); // One from saveCurrentCv
      expect(mockSnackBar.open).toHaveBeenCalledWith('CV updated.', 'Close', expect.any(Object));
    });

    it('should show message if trying to update new standalone CV without ID (and no medewerkerId)', () => {
      createComponent();
      fixture.detectChanges();
      component.loadedCv = null;
      component.medewerkerId = null;
      component.isOwnProfile = false;
      
      component.cvForm.patchValue({ bestandsNaam: 'Test' });
      // Reset ID
      component.cvForm.controls.id.setValue(null);

      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('A standalone CV needs an id before update in this view.', 'Close', expect.any(Object));
    });
  });
});
