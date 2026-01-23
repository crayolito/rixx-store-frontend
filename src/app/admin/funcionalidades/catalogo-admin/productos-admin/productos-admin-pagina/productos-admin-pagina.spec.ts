import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosAdminPagina } from './productos-admin-pagina';

describe('ProductosAdminPagina', () => {
  let component: ProductosAdminPagina;
  let fixture: ComponentFixture<ProductosAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
