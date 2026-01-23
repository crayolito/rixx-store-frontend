import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriasMarketingAdminPagina } from './categorias-marketing-admin-pagina';

describe('CategoriasMarketingAdminPagina', () => {
  let component: CategoriasMarketingAdminPagina;
  let fixture: ComponentFixture<CategoriasMarketingAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasMarketingAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriasMarketingAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
