import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeccionCategorias } from './seccion-categorias';

describe('SeccionCategorias', () => {
  let component: SeccionCategorias;
  let fixture: ComponentFixture<SeccionCategorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionCategorias]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeccionCategorias);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categoria', {
      handle: 'test',
      titulo: 'Test',
      productos: []
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
