import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarraLateralAdmin } from './barra-lateral-admin';

describe('BarraLateralAdmin', () => {
  let component: BarraLateralAdmin;
  let fixture: ComponentFixture<BarraLateralAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarraLateralAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarraLateralAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
