import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeccionProductosCategoria } from './seccion-productos-categoria';

describe('SeccionProductosCategoria', () => {
  let component: SeccionProductosCategoria;
  let fixture: ComponentFixture<SeccionProductosCategoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionProductosCategoria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeccionProductosCategoria);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
