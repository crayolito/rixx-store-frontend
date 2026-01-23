import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosAdminPagina } from './pedidos-admin-pagina';

describe('PedidosAdminPagina', () => {
  let component: PedidosAdminPagina;
  let fixture: ComponentFixture<PedidosAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
