import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BeheerderDetailDialog } from './beheerder-detail-dialog';

describe('BeheerderDetailDialog', () => {
  let component: BeheerderDetailDialog;
  let fixture: ComponentFixture<BeheerderDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeheerderDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BeheerderDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
