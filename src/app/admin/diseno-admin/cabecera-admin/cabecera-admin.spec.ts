import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabeceraAdmin } from './cabecera-admin';

describe('CabeceraAdmin', () => {
  let component: CabeceraAdmin;
  let fixture: ComponentFixture<CabeceraAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabeceraAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CabeceraAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
