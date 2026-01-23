import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarruselAdminPagina } from './carrusel-admin-pagina';

describe('CarruselAdminPagina', () => {
  let component: CarruselAdminPagina;
  let fixture: ComponentFixture<CarruselAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarruselAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
