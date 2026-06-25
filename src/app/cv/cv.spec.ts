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

  describe('Initialization (Default fallback)', () => {
    it('should load base matrix and own CV if no params provided', () => {
      createComponent();
      window.history.replaceState({}, '', '');
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

    it('should create new CV if no params provided but no orgineleCv', () => {
      mockApiService.getMijzelf.mockReturnValue(of({ ...mockMedewerkerWithoutCv }));
      mockApiService.updateMedewerker.mockReturnValue(of({ ...mockMedewerkerWithoutCv, orgineleCv: { id: 2, bestandsNaam: 'CV Jane Doe' } }));
      
      createComponent();
      window.history.replaceState({}, '', '');
      fixture.detectChanges();

      expect(component.loadedCv?.bestandsNaam).toBe('CV Jane Doe');
      expect(mockApiService.updateMedewerker).toHaveBeenCalled(); // Should save current cv automatically
      expect(mockSnackBar.open).toHaveBeenCalledWith('Creating a new CV for this account...', 'Close', expect.any(Object));
    });

    it('should show error if getMijzelf fails', () => {
      mockApiService.getMijzelf.mockReturnValue(throwError(() => new Error('Err')));
      createComponent();
      window.history.replaceState({}, '', '');
      fixture.detectChanges();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load your profile.', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });

    it('should log error if getBaseMatrix fails', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiService.getBaseMatrix.mockReturnValue(throwError(() => new Error('Err')));
      createComponent();
      fixture.detectChanges();
      
      expect(consoleSpy).toHaveBeenCalledWith('Could not load base matrix');
      consoleSpy.mockRestore();
    });
  });

  describe('Initialization (medewerkerId)', () => {
    it('should load medewerker CV if medewerkerId is provided', () => {
      createComponent();
      window.history.replaceState({ medewerkerId: '123' }, '', '');
      fixture.detectChanges();

      expect(mockApiService.getMedewerker).toHaveBeenCalledWith('123');
      expect(component.loadedCv).toEqual(mockCv);
      expect(mockSnackBar.open).toHaveBeenCalledWith('Loaded CV for consultant.', 'Close', expect.any(Object));
    });

    it('should handle missing orgineleCv in updateMedewerker response for saveCurrentCv', () => {
      createComponent();
      window.history.replaceState({ medewerkerId: '123' }, '', '');
      fixture.detectChanges();

      component.cvForm.patchValue({ id: null });
      component.medewerkerId = '123';
      mockApiService.getMedewerker.mockReturnValue(of({ ...mockMedewerkerWithoutCv }));
      mockApiService.updateMedewerker.mockReturnValue(of({ ...mockMedewerkerWithoutCv, orgineleCv: undefined }));
      component.saveCurrentCv();
      expect(component.loadedCv).toBeNull();
    });

    it('should assign consultantName if name is provided in query params', () => {
      createComponent();
      window.history.replaceState({ medewerkerId: '123', name: 'John Doe' }, '', '');
      fixture.detectChanges();

      expect(component.consultantName).toBe('John Doe');
    });

    it('should create new CV if medewerkerId provided but no orgineleCv', () => {
      mockApiService.getMedewerker.mockReturnValue(of({ ...mockMedewerkerWithoutCv }));
      mockApiService.updateMedewerker.mockReturnValue(of({ ...mockMedewerkerWithoutCv, orgineleCv: { id: 3, bestandsNaam: 'CV Jane Doe' } }));
      
      createComponent();
      window.history.replaceState({ medewerkerId: '123' }, '', '');
      fixture.detectChanges();

      expect(mockApiService.updateMedewerker).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Created new CV for consultant.', 'Close', expect.any(Object));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cv'], { queryParams: { id: 3 } });
    });

    it('should show error if getMedewerker fails', () => {
      mockApiService.getMedewerker.mockReturnValue(throwError(() => new Error('Err')));
      createComponent();
      window.history.replaceState({ medewerkerId: '123' }, '', '');
      fixture.detectChanges();

      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load consultant details.', 'Close', expect.any(Object));
      expect(component.isBusy).toBe(false);
    });
  });

  describe('Initialization (id)', () => {
    it('should load CV directly if id is provided', () => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
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
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();


      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load CV', 'Close', expect.any(Object));
    });
  });

  describe('Form Actions & Methods', () => {
    beforeEach(() => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();
    });

    it('should navigate back to /medewerkers', () => {
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/medewerkers']);
    });

    it('should patch form with null and clear it', () => {
      component['patchCvForm'](null);
      expect(component.cvForm.value.id).toBeNull();
      expect(component.matrixCategories.length).toBe(0);
      expect(component.ervaringen.length).toBe(0);
    });

    it('should handle buildCvDto throwing an error when saving', () => {
      jest.spyOn(component as any, 'buildCvDto').mockImplementation(() => {
        throw new Error('Test error');
      });
      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Test error', 'Close', expect.any(Object));
    });

    it('should handle buildCvDto throwing non-Error when saving', () => {
      jest.spyOn(component as any, 'buildCvDto').mockImplementation(() => {
        throw 'String error';
      });
      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Invalid matrix JSON.', 'Close', expect.any(Object));
    });

    it('should return base matrix keys for category', () => {
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['Languages'],
        skills: component['fb'].array([])
      }));
      const keys = component.getBaseMatrixKeysForCat(0);
      expect(keys).toBe('Java, TypeScript');
    });

    it('should return "No Category Name" if category has no name', () => {
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: [''],
        skills: component['fb'].array([])
      }));
      const keys = component.getBaseMatrixKeysForCat(0);
      expect(keys).toBe('No Category Name');
    });

    it('should return "Category Not Found In Base Matrix" if category is not in base matrix', () => {
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['UnknownCategory'],
        skills: component['fb'].array([])
      }));
      const keys = component.getBaseMatrixKeysForCat(0);
      expect(keys).toBe('Category Not Found In Base Matrix');
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

    it('should calculate available categories for select', () => {
      component.availableCategories = ['Languages', 'Databases', 'Tools'];
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['Languages'],
        skills: component['fb'].array([])
      }));
      const available = component.getAvailableCategoriesForSelect('Databases');
      expect(available).toEqual(['Databases', 'Tools']);
    });

    it('should get available technologies for select', () => {
      component.baseMatrix = {
        'Languages': { 'Java': 1, 'TypeScript': 2 }
      };
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['Languages'],
        skills: component['fb'].array([
          component['fb'].group({ name: ['Java'], rating: [3] })
        ])
      }));
      const available = component.getAvailableTechnologiesForSelect(0, '');
      expect(available).toEqual(['TypeScript']);
    });

    it('should return empty if category not found for technologies select', () => {
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['UnknownCategory'],
        skills: component['fb'].array([])
      }));
      const available = component.getAvailableTechnologiesForSelect(0, '');
      expect(available).toEqual([]);

      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: [''],
        skills: component['fb'].array([])
      }));
      const emptyCat = component.getAvailableTechnologiesForSelect(0, '');
      expect(emptyCat).toEqual([]);
    });

    it('should calculate if category can be added', () => {
      component.availableCategories = ['Languages', 'Databases'];
      component.matrixCategories.clear();
      expect(component.canAddCategory()).toBe(true);
      component.matrixCategories.push(component['fb'].group({}));
      component.matrixCategories.push(component['fb'].group({}));
      expect(component.canAddCategory()).toBe(false);
    });

    it('should calculate if technology can be added', () => {
      component.baseMatrix = {
        'Languages': { 'Java': 1 }
      };
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['Languages'],
        skills: component['fb'].array([])
      }));
      expect(component.canAddTechnology(0)).toBe(true);

      (component.matrixCategories.at(0).get('skills') as any).push(component['fb'].group({}));
      expect(component.canAddTechnology(0)).toBe(false);
    });

    it('should return false if technology cannot be added due to missing category', () => {
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: [''],
        skills: component['fb'].array([])
      }));
      expect(component.canAddTechnology(0)).toBe(false);

      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['UnknownCategory'],
        skills: component['fb'].array([])
      }));
      expect(component.canAddTechnology(0)).toBe(false);
    });

    it('should add and remove matrix skill', () => {
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['Languages'],
        skills: component['fb'].array([])
      }));
      component.addMatrixSkill(0);
      expect((component.matrixCategories.at(0).get('skills') as any).length).toBe(1);

      component.removeMatrixSkill(0, 0);
      expect((component.matrixCategories.at(0).get('skills') as any).length).toBe(0);
      component.addMatrixSkill(0); // We have 'Languages' category from mockCv at index 0
      const skillsArray = component.getMatrixSkills(0);
      expect(skillsArray.length).toBeGreaterThan(0);
      
      const lastIndex = skillsArray.length - 1;
      component.removeMatrixSkill(0, lastIndex);
    });

    it('should build CvDto correctly ignoring empty categories and skills', () => {
      component.cvForm.patchValue({ bestandsNaam: 'My CV ', profiel: ' My Profile ', opleiding: ' My Opleiding ' });
      
      component.matrixCategories.clear();
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['  '], // empty name
        skills: component['fb'].array([])
      }));
      component.matrixCategories.push(component['fb'].group({
        categoryName: ['Languages'],
        skills: component['fb'].array([
          component['fb'].group({ name: ['  '], rating: [3] }), // empty skill
          component['fb'].group({ name: ['Java'], rating: [4] })
        ])
      }));

      const dto = component['buildCvDto']();
      expect(dto.bestandsNaam).toBe('My CV');
      expect(dto.profiel).toBe('My Profile');
      expect(dto.opleiding).toBe('My Opleiding');
      expect(dto.matrix.matrix).toEqual({ 'Languages': { 'Java': 4 } });
    });

    it('should build CvDto with default values when form values are missing', () => {
      component.cvForm.patchValue({
        bestandsNaam: null,
        profiel: null,
        opleiding: null,
        competentiesText: null,
        matrixId: null
      });
      component.matrixCategories.clear();
      component.ervaringen.clear();

      const dto = component['buildCvDto']();
      expect(dto.bestandsNaam).toBe('CV');
      expect(dto.profiel).toBe('');
      expect(dto.opleiding).toBe('');
      expect(dto.competenties).toEqual([]);
      expect(dto.matrix.id).toBeNull();
    });

    it('should handle undefined values in patchCvForm', () => {
      const cvWithNulls = {
        id: undefined,
        bestandsNaam: undefined,
        profiel: undefined,
        opleiding: undefined,
        competenties: undefined,
        matrix: {
          id: undefined,
          matrix: {
            'Languages': undefined
          }
        },
        ervaring: undefined
      } as any;
      component['patchCvForm'](cvWithNulls);
      expect(component.cvForm.value.bestandsNaam).toBe('');
      expect(component.matrixCategories.length).toBe(0);
      expect(component.ervaringen.length).toBe(0);
    });

    it('should populate form correctly in patchCvForm with valid matrix', () => {
      const validCv = {
        id: '2',
        bestandsNaam: 'Valid CV',
        matrix: {
          id: 1,
          matrix: {
            'Languages': { 'Java': 4, 'Empty': 0 },
            'Databases': { }
          }
        }
      } as any;
      component['patchCvForm'](validCv);
      expect(component.matrixCategories.length).toBe(1); // Only Languages should be added
      expect((component.matrixCategories.at(0).get('skills') as any).length).toBe(1); // Only Java
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
      window.history.replaceState({ id: '1' }, '', '');
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
    it('should call updateMedewerker when saving own CV (isOwnProfile)', () => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();

      component.isOwnProfile = true;
      component.ownMedewerker = mockMedewerker;
      component.saveCurrentCv();
      expect(mockApiService.updateMedewerker).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('CV updated.', 'Close', expect.any(Object));
    });

    it('should show error if updateMedewerker fails when saving own CV', () => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();

      component.isOwnProfile = true;
      component.ownMedewerker = mockMedewerker;
      mockApiService.updateMedewerker.mockReturnValue(throwError(() => new Error('Err')));
      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to update your CV.', 'Close', expect.any(Object));
    });

    it('should create CV for medewerker when cv.id is null and medewerkerId is set', () => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();

      component.cvForm.patchValue({ id: null });
      component.medewerkerId = '123';
      component.saveCurrentCv();
      expect(mockApiService.getMedewerker).toHaveBeenCalledWith('123');
      expect(mockApiService.updateMedewerker).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Created new CV for consultant.', 'Close', expect.any(Object));
    });

    it('should show error if getMedewerker fails when creating CV for medewerker', () => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();

      component.cvForm.patchValue({ id: null });
      component.medewerkerId = '123';
      mockApiService.getMedewerker.mockReturnValue(throwError(() => new Error('Err')));
      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to load consultant details.', 'Close', expect.any(Object));
    });

    it('should show error if updateMedewerker fails when creating CV for medewerker', () => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();

      component.cvForm.patchValue({ id: null });
      component.medewerkerId = '123';
      mockApiService.updateMedewerker.mockReturnValue(throwError(() => new Error('Err')));
      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to save consultant CV.', 'Close', expect.any(Object));
    });

    it('should call updateCurriculumVitae when cv has id', () => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();

      component.saveCurrentCv();
      expect(mockApiService.updateCurriculumVitae).toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith('CV 1 updated.', 'Close', expect.any(Object));
    });

    it('should show error if updateCurriculumVitae fails', () => {
      createComponent();
      window.history.replaceState({ id: '1' }, '', '');
      fixture.detectChanges();

      mockApiService.updateCurriculumVitae.mockReturnValue(throwError(() => new Error('Err')));
      component.saveCurrentCv();
      expect(mockSnackBar.open).toHaveBeenCalledWith('Failed to update CV', 'Close', expect.any(Object));
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
