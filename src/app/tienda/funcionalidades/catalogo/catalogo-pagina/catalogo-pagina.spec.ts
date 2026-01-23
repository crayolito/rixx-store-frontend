import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoPagina } from './catalogo-pagina';

describe('CatalogoPagina', () => {
  let component: CatalogoPagina;
  let fixture: ComponentFixture<CatalogoPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
