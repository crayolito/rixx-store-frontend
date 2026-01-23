import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriasAdminPagina } from './categorias-admin-pagina';

describe('CategoriasAdminPagina', () => {
  let component: CategoriasAdminPagina;
  let fixture: ComponentFixture<CategoriasAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriasAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
