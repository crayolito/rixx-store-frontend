import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BilleteraAdminPagina } from './billetera-admin-pagina';

describe('BilleteraAdminPagina', () => {
  let component: BilleteraAdminPagina;
  let fixture: ComponentFixture<BilleteraAdminPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilleteraAdminPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilleteraAdminPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
