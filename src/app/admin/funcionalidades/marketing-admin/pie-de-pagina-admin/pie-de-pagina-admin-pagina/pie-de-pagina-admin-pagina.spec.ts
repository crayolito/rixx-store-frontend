import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieDePaginaAdminPagina } from './pie-de-pagina-admin-pagina';

describe('PieDePaginaAdminPagina', () => {
  let component: PieDePaginaAdminPagina;
  let fixture: ComponentFixture<PieDePaginaAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieDePaginaAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PieDePaginaAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
