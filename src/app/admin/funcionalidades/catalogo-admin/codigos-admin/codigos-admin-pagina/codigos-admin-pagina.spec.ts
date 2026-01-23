import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodigosAdminPagina } from './codigos-admin-pagina';

describe('CodigosAdminPagina', () => {
  let component: CodigosAdminPagina;
  let fixture: ComponentFixture<CodigosAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodigosAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodigosAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
