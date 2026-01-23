import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncabezadoAdminPagina } from './encabezado-admin-pagina';

describe('EncabezadoAdminPagina', () => {
  let component: EncabezadoAdminPagina;
  let fixture: ComponentFixture<EncabezadoAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncabezadoAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncabezadoAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
