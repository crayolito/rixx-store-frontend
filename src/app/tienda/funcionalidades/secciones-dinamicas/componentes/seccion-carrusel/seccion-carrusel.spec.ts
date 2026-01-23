import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeccionCarrusel } from './seccion-carrusel';

describe('SeccionCarrusel', () => {
  let component: SeccionCarrusel;
  let fixture: ComponentFixture<SeccionCarrusel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionCarrusel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeccionCarrusel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
