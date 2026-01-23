import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoDetallePagina } from './producto-detalle-pagina';

describe('ProductoDetallePagina', () => {
  let component: ProductoDetallePagina;
  let fixture: ComponentFixture<ProductoDetallePagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoDetallePagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductoDetallePagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
