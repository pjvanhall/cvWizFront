import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CvwizApiService } from './cvwiz-api.service';
import { BeheerderDto, CurriculumVitaeDto, MedewerkerDto, MedewerkerListDto, TechniekMatrixDto } from './cvwiz.models';

describe('CvwizApiService', () => {
  let service: CvwizApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CvwizApiService]
    });
    service = TestBed.inject(CvwizApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Medewerker Endpoints', () => {
    it('getMedewerker should return medewerker details', () => {
      const mockDto: MedewerkerDto = { id: '1', voornaam: 'Test', achternaam: 'User' };
      
      service.getMedewerker('1').subscribe(data => {
        expect(data).toEqual(mockDto);
      });

      const req = httpMock.expectOne('/api/medewerkers/medewerker?id=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockDto);
    });

    it('getMijzelf should return my details', () => {
      const mockDto: MedewerkerDto = { id: '1', voornaam: 'Test', achternaam: 'User' };
      
      service.getMijzelf().subscribe(data => {
        expect(data).toEqual(mockDto);
      });

      const req = httpMock.expectOne('/api/medewerkers/mijzelf');
      expect(req.request.method).toBe('GET');
      req.flush(mockDto);
    });

    it('getAllMedewerkers should return list', () => {
      const mockList: MedewerkerListDto[] = [{ id: '1', name: 'Test User' }];
      
      service.getAllMedewerkers().subscribe(data => {
        expect(data).toEqual(mockList);
      });

      const req = httpMock.expectOne('/api/medewerkers/alle');
      expect(req.request.method).toBe('GET');
      req.flush(mockList);
    });

    it('updateMedewerker should return updated data', () => {
      const mockDto: MedewerkerDto = { id: '1', voornaam: 'Test', achternaam: 'User' };
      
      service.updateMedewerker(mockDto).subscribe(data => {
        expect(data).toEqual(mockDto);
      });

      const req = httpMock.expectOne('/api/medewerkers/updateMedewerker');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDto);
      req.flush(mockDto);
    });

    it('createMedewerker should return new data', () => {
      const mockDto: MedewerkerDto = { id: null, voornaam: 'Test', achternaam: 'User' };
      
      service.createMedewerker(mockDto).subscribe(data => {
        expect(data).toEqual(mockDto);
      });

      const req = httpMock.expectOne('/api/beheerders/nieuweMedewerker');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDto);
      req.flush(mockDto);
    });

    it('deleteMedewerker should delete and return void', () => {
      service.deleteMedewerker('John', 'Doe').subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne('/api/beheerders/deleteMedewerker?firstname=John&lastname=Doe');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Beheerder Endpoints', () => {
    it('getBeheerder should return beheerder', () => {
      const mockDto: BeheerderDto = { id: '1', voornaam: 'Test', achternaam: 'Admin' };
      
      service.getBeheerder('1').subscribe(data => {
        expect(data).toEqual(mockDto);
      });

      const req = httpMock.expectOne('/api/beheerders/beheerder?id=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockDto);
    });

    it('getAllBeheerders should return list', () => {
      const mockList: BeheerderDto[] = [{ id: '1', voornaam: 'Test', achternaam: 'Admin' }];
      
      service.getAllBeheerders().subscribe(data => {
        expect(data).toEqual(mockList);
      });

      const req = httpMock.expectOne('/api/beheerders/alleBeheerders');
      expect(req.request.method).toBe('GET');
      req.flush(mockList);
    });

    it('createBeheerder should POST new beheerder', () => {
      const mockDto: BeheerderDto = { id: null, voornaam: 'Test', achternaam: 'Admin' };
      
      service.createBeheerder(mockDto).subscribe(data => {
        expect(data).toEqual(mockDto);
      });

      const req = httpMock.expectOne('/api/beheerders/nieuw');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDto);
      req.flush(mockDto);
    });

    it('updateBeheerder should POST updated beheerder', () => {
      const mockDto: BeheerderDto = { id: '1', voornaam: 'Test', achternaam: 'Admin' };
      
      service.updateBeheerder(mockDto).subscribe(data => {
        expect(data).toEqual(mockDto);
      });

      const req = httpMock.expectOne('/api/beheerders/bewerk');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockDto);
      req.flush(mockDto);
    });

    it('deleteBeheerder should DELETE beheerder', () => {
      service.deleteBeheerder('1').subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne('/api/beheerders/verwijder?id=1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('CV Endpoints', () => {
    it('addCurriculumVitaeToMedewerker should POST new cv', () => {
      const mockCv: CurriculumVitaeDto = { };
      const mockMedewerker: MedewerkerDto = { id: '1' };
      
      service.addCurriculumVitaeToMedewerker('1', mockCv).subscribe(data => {
        expect(data).toEqual(mockMedewerker);
      });

      const req = httpMock.expectOne('/api/beheerders/nieuweCurriculumVitae?id=1');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCv);
      req.flush(mockMedewerker);
    });

    it('getCurriculumVitae should GET cv by id', () => {
      const mockCv: CurriculumVitaeDto = { };
      
      service.getCurriculumVitae(1).subscribe(data => {
        expect(data).toEqual(mockCv);
      });

      const req = httpMock.expectOne('/api/beheerders/curriculumVitae?id=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockCv);
    });

    it('updateCurriculumVitae should POST updated cv', () => {
      const mockCv: CurriculumVitaeDto = { };
      
      service.updateCurriculumVitae(mockCv).subscribe(data => {
        expect(data).toEqual(mockCv);
      });

      const req = httpMock.expectOne('/api/beheerders/curriculumVitae/update');
      expect(req.request.method).toBe('POST');
      req.flush(mockCv);
    });

    it('updateOriginalCurriculumVitae should POST updated original cv', () => {
      const mockCv: CurriculumVitaeDto = { };
      
      service.updateOriginalCurriculumVitae('John', 'Doe', mockCv).subscribe(data => {
        expect(data).toEqual(mockCv);
      });

      const req = httpMock.expectOne('/api/beheerders/curriculumVitae/update/originale?voornaam=John&achternaam=Doe');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCv);
      req.flush(mockCv);
    });
  });

  describe('Matrix Endpoints', () => {
    it('getBaseMatrix should GET base matrix', () => {
      const mockMatrix: TechniekMatrixDto = { };
      
      service.getBaseMatrix().subscribe(data => {
        expect(data).toEqual(mockMatrix);
      });

      const req = httpMock.expectOne('/api/medewerkers/basisMatrix');
      expect(req.request.method).toBe('GET');
      req.flush(mockMatrix);
    });

    it('getTechniekMatrix should GET matrix by id', () => {
      const mockMatrix: TechniekMatrixDto = { };
      
      service.getTechniekMatrix(1).subscribe(data => {
        expect(data).toEqual(mockMatrix);
      });

      const req = httpMock.expectOne('/api/beheerders/matrix?id=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockMatrix);
    });

    it('getAllMatrices should GET all matrices', () => {
      const mockList: TechniekMatrixDto[] = [];
      
      service.getAllMatrices().subscribe(data => {
        expect(data).toEqual(mockList);
      });

      const req = httpMock.expectOne('/api/beheerders/matrices');
      expect(req.request.method).toBe('GET');
      req.flush(mockList);
    });

    it('addCategory should POST new category and technique', () => {
      service.addCategory('cat', 'tech').subscribe(response => {
        expect(response).toEqual('Success');
      });

      const req = httpMock.expectOne('/api/beheerders/nieweCategory?category=cat&techniek=tech');
      expect(req.request.method).toBe('POST');
      req.flush('Success');
    });

    it('addEmptyCategory should POST new empty category', () => {
      service.addEmptyCategory('cat').subscribe(response => {
        expect(response).toEqual('Success');
      });

      const req = httpMock.expectOne('/api/beheerders/nieuweLegeCategory?category=cat');
      expect(req.request.method).toBe('POST');
      req.flush('Success');
    });

    it('addTechnique should POST new technique', () => {
      service.addTechnique('cat', 'tech').subscribe(response => {
        expect(response).toEqual('Success');
      });

      const req = httpMock.expectOne('/api/beheerders/nieuweTechniek?category=cat&techniek=tech');
      expect(req.request.method).toBe('POST');
      req.flush('Success');
    });

    it('editCategory should POST edited category', () => {
      service.editCategory('old', 'new').subscribe(response => {
        expect(response).toEqual('Success');
      });

      const req = httpMock.expectOne('/api/beheerders/bewerkCategory?oldCategory=old&newCategory=new');
      expect(req.request.method).toBe('POST');
      req.flush('Success');
    });

    it('editTechnique should POST edited technique', () => {
      service.editTechnique('cat', 'old', 'new').subscribe(response => {
        expect(response).toEqual('Success');
      });

      const req = httpMock.expectOne('/api/beheerders/bewerkTechniek?category=cat&oldTechniek=old&newTechniek=new');
      expect(req.request.method).toBe('POST');
      req.flush('Success');
    });

    it('deleteCategory should DELETE category', () => {
      service.deleteCategory('cat').subscribe(response => {
        expect(response).toEqual('Success');
      });

      const req = httpMock.expectOne('/api/beheerders/verwijderCategory?category=cat');
      expect(req.request.method).toBe('DELETE');
      req.flush('Success');
    });

    it('deleteTechnique should DELETE technique', () => {
      service.deleteTechnique('cat', 'tech').subscribe(response => {
        expect(response).toEqual('Success');
      });

      const req = httpMock.expectOne('/api/beheerders/verwijderTechniek?category=cat&techniek=tech');
      expect(req.request.method).toBe('DELETE');
      req.flush('Success');
    });
  });
});
