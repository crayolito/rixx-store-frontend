import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromocionAdminPagina } from './promocion-admin-pagina';

describe('PromocionAdminPagina', () => {
  let component: PromocionAdminPagina;
  let fixture: ComponentFixture<PromocionAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromocionAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromocionAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
