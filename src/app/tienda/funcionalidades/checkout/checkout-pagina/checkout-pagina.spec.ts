import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutPagina } from './checkout-pagina';

describe('CheckoutPagina', () => {
  let component: CheckoutPagina;
  let fixture: ComponentFixture<CheckoutPagina>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutPagina]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutPagina);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
