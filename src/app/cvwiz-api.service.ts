import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BeheerderDto, CurriculumVitaeDto, MedewerkerDto, MedewerkerListDto, TechniekMatrixDto } from './cvwiz.models';

@Injectable({ providedIn: 'root' })
export class CvwizApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  getMedewerker(id: string): Observable<MedewerkerDto> {
    return this.http.get<MedewerkerDto>(`${this.baseUrl}/medewerkers/medewerker`, {
      params: new HttpParams().set('id', id)
    });
  }

  getAllMedewerkers(): Observable<MedewerkerListDto[]> {
    return this.http.get<MedewerkerListDto[]>(`${this.baseUrl}/medewerkers/alle`);
  }

  updateMedewerker(dto: MedewerkerDto): Observable<MedewerkerDto> {
    return this.http.post<MedewerkerDto>(`${this.baseUrl}/medewerkers/updateMedewerker`, dto);
  }

  completeOneTimeCv(cv: CurriculumVitaeDto): Observable<MedewerkerDto> {
    return this.http.post<MedewerkerDto>(`${this.baseUrl}/medewerkers/curriculumVitae/eersteLogin`, cv);
  }

  createMedewerker(dto: MedewerkerDto): Observable<MedewerkerDto> {
    return this.http.post<MedewerkerDto>(`${this.baseUrl}/beheerders/nieuweMedewerker`, dto);
  }

  deleteMedewerker(firstname: string, lastname: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/beheerders/deleteMedewerker`, {
      params: new HttpParams().set('firstname', firstname).set('lastname', lastname)
    });
  }

  getBeheerder(id: string): Observable<BeheerderDto> {
    return this.http.get<BeheerderDto>(`${this.baseUrl}/beheerders/beheerder`, {
      params: new HttpParams().set('id', id)
    });
  }

  createBeheerder(dto: BeheerderDto): Observable<BeheerderDto> {
    return this.http.post<BeheerderDto>(`${this.baseUrl}/beheerders/nieuw`, dto);
  }

  updateBeheerder(dto: BeheerderDto): Observable<BeheerderDto> {
    return this.http.post<BeheerderDto>(`${this.baseUrl}/beheerders/bewerk`, dto);
  }

  deleteBeheerder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/beheerders/verwijder`, {
      params: new HttpParams().set('id', id)
    });
  }

  addCurriculumVitaeToMedewerker(id: string, cv: CurriculumVitaeDto): Observable<MedewerkerDto> {
    return this.http.post<MedewerkerDto>(`${this.baseUrl}/beheerders/nieuweCurriculumVitae`, cv, {
      params: new HttpParams().set('id', id)
    });
  }

  getCurriculumVitae(id: number): Observable<CurriculumVitaeDto> {
    return this.http.get<CurriculumVitaeDto>(`${this.baseUrl}/beheerders/curriculumVitae`, {
      params: new HttpParams().set('id', id)
    });
  }

  updateCurriculumVitae(dto: CurriculumVitaeDto): Observable<CurriculumVitaeDto> {
    return this.http.post<CurriculumVitaeDto>(`${this.baseUrl}/beheerders/curriculumVitae/update`, dto);
  }

  updateOriginalCurriculumVitae(
    firstname: string,
    lastname: string,
    dto: CurriculumVitaeDto
  ): Observable<CurriculumVitaeDto> {
    return this.http.post<CurriculumVitaeDto>(`${this.baseUrl}/beheerders/curriculumVitae/update/originale`, dto, {
      params: new HttpParams().set('voornaam', firstname).set('achternaam', lastname)
    });
  }

  getTechniekMatrix(id: number): Observable<TechniekMatrixDto> {
    return this.http.get<TechniekMatrixDto>(`${this.baseUrl}/beheerders/matrix`, {
      params: new HttpParams().set('id', id)
    });
  }

  getAllMatrices(): Observable<TechniekMatrixDto[]> {
    return this.http.get<TechniekMatrixDto[]>(`${this.baseUrl}/beheerders/matrices`);
  }

  addCategory(category: string, techniek: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/beheerders/nieweCategory`, null, {
      params: new HttpParams().set('category', category).set('techniek', techniek),
      responseType: 'text'
    });
  }

  addEmptyCategory(category: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/beheerders/nieuweLegeCategory`, null, {
      params: new HttpParams().set('category', category),
      responseType: 'text'
    });
  }

  addTechnique(category: string, techniek: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/beheerders/nieuweTechniek`, null, {
      params: new HttpParams().set('category', category).set('techniek', techniek),
      responseType: 'text'
    });
  }

  editCategory(oldCategory: string, newCategory: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/beheerders/bewerkCategory`, null, {
      params: new HttpParams().set('oldCategory', oldCategory).set('newCategory', newCategory),
      responseType: 'text'
    });
  }

  editTechnique(category: string, oldTechniek: string, newTechniek: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/beheerders/bewerkTechniek`, null, {
      params: new HttpParams().set('category', category).set('oldTechniek', oldTechniek).set('newTechniek', newTechniek),
      responseType: 'text'
    });
  }

  deleteCategory(category: string): Observable<string> {
    return this.http.delete(`${this.baseUrl}/beheerders/verwijderCategory`, {
      params: new HttpParams().set('category', category),
      responseType: 'text'
    });
  }

  deleteTechnique(category: string, techniek: string): Observable<string> {
    return this.http.delete(`${this.baseUrl}/beheerders/verwijderTechniek`, {
      params: new HttpParams().set('category', category).set('techniek', techniek),
      responseType: 'text'
    });
  }
}
