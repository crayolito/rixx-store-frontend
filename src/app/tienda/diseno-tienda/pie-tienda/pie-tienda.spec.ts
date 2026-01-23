import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieTienda } from './pie-tienda';

describe('PieTienda', () => {
  let component: PieTienda;
  let fixture: ComponentFixture<PieTienda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieTienda]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PieTienda);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
