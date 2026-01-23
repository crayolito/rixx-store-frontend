import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabeceraTienda } from './cabecera-tienda';

describe('CabeceraTienda', () => {
  let component: CabeceraTienda;
  let fixture: ComponentFixture<CabeceraTienda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabeceraTienda]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CabeceraTienda);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
