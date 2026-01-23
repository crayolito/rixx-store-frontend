import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetodosPagoAdminPagina } from './metodos-pago-admin-pagina';

describe('MetodosPagoAdminPagina', () => {
  let component: MetodosPagoAdminPagina;
  let fixture: ComponentFixture<MetodosPagoAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetodosPagoAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetodosPagoAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
