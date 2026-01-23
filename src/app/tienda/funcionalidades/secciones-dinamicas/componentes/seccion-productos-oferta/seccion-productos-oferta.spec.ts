import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeccionProductosOferta } from './seccion-productos-oferta';

describe('SeccionProductosOferta', () => {
  let component: SeccionProductosOferta;
  let fixture: ComponentFixture<SeccionProductosOferta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionProductosOferta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeccionProductosOferta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
