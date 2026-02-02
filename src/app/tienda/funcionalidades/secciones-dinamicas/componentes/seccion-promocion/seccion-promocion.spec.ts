import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeccionPromocion } from './seccion-promocion';

describe('SeccionPromocion', () => {
  let component: SeccionPromocion;
  let fixture: ComponentFixture<SeccionPromocion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionPromocion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeccionPromocion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
